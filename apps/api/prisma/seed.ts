/**
 * Seed EnergieSI — données de démonstration scientifiquement cohérentes.
 *
 * Génère :
 *  - 9 scénarios (4 matériels + 5 virtualisation, conformes au sujet)
 *  - 3 machines (fixe, portable, hôte de virtualisation)
 *  - 17 campagnes de mesure avec séries temporelles réalistes
 *  - les résultats agrégés (stats) de chaque campagne
 *
 * Les données sont calibrées pour illustrer H1, H2 et H3 tout en restant
 * plausibles (modèle de puissance P = P_idle + (P_max − P_idle)·u + bruit).
 */
import { PrismaClient } from '@prisma/client';
import {
  MachineType,
  WorkloadType,
  StudyCase,
  Hypervisor,
  PowerBackend,
  TestStatus,
} from '@energie-si/shared';
import { describe, pearson, round } from '../src/analysis/stats.util';

const prisma = new PrismaClient();

// ── Générateur pseudo-aléatoire déterministe (reproductibilité) ──────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240627);
const gauss = (mean: number, sd: number) => {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ── Profils de charge CPU (%) par type de scénario ───────────────────────────
const CPU_PROFILE: Record<WorkloadType, { mean: number; sd: number; ram: number }> = {
  [WorkloadType.IDLE]: { mean: 5, sd: 2, ram: 30 },
  [WorkloadType.WEB]: { mean: 24, sd: 7, ram: 46 },
  [WorkloadType.VIDEO]: { mean: 33, sd: 5, ram: 50 },
  [WorkloadType.CPU]: { mean: 96, sd: 2.5, ram: 58 },
};

interface GenOpts {
  pIdleW: number;
  pMaxW: number;
  ramGo: number;
  workload: WorkloadType;
  count: number;
  cpuOverride?: number; // force la charge CPU moyenne (cas virtualisation)
  powerOverhead?: number; // facteur multiplicatif (overhead virtualisation)
  baseTime: number; // timestamp de départ (ms)
}

function generate(o: GenOpts) {
  const prof = CPU_PROFILE[o.workload];
  const cpuMean = o.cpuOverride ?? prof.mean;
  const overhead = o.powerOverhead ?? 1;
  const ramTotalMo = o.ramGo * 1024;
  const rows: Array<{
    cpuPct: number;
    ramPct: number;
    ramMo: number;
    cpuTempC: number;
    powerW: number;
    energyJ: number;
    timestamp: Date;
  }> = [];
  let energyJ = 0;
  for (let i = 0; i < o.count; i++) {
    const cpuPct = round2(clamp(gauss(cpuMean, prof.sd), 0, 100));
    const ramPct = round2(clamp(gauss(prof.ram, 3), 5, 95));
    const ramMo = Math.round((ramPct / 100) * ramTotalMo);
    const cpuTempC = round2(clamp(40 + cpuPct * 0.32 + gauss(0, 1.5), 30, 95));
    const base = o.pIdleW + (o.pMaxW - o.pIdleW) * (cpuPct / 100);
    const powerW = round2(clamp(base * overhead * (1 + gauss(0, 0.02)), 1, 400));
    energyJ = round(energyJ + powerW, 3); // dt = 1 s
    rows.push({
      cpuPct,
      ramPct,
      ramMo,
      cpuTempC,
      powerW,
      energyJ,
      timestamp: new Date(o.baseTime + i * 1000),
    });
  }
  return rows;
}
const round2 = (n: number) => Number(n.toFixed(2));

// ── Création d'une campagne complète (test + mesures + résultat) ─────────────
let testClock = Date.UTC(2026, 5, 20, 8, 0, 0); // 20 juin 2026
async function campaign(params: {
  machineId: number;
  scenarioId: number;
  hypervisor?: Hypervisor;
  vmCount?: number;
  gen: GenOpts;
  notes?: string;
}) {
  const start = testClock;
  testClock += 10 * 60 * 1000; // espace les campagnes de 10 min
  const rows = generate({ ...params.gen, baseTime: start });

  const test = await prisma.test.create({
    data: {
      machineId: params.machineId,
      scenarioId: params.scenarioId,
      hypervisor: params.hypervisor ?? Hypervisor.NONE,
      vmCount: params.vmCount ?? 0,
      powerBackend: PowerBackend.MODEL,
      status: TestStatus.COMPLETED,
      startedAt: new Date(start),
      endedAt: new Date(start + rows.length * 1000),
      notes: params.notes,
    },
  });

  await prisma.measurement.createMany({
    data: rows.map((r) => ({ testId: test.id, ...r })),
  });

  // Résultat agrégé
  const power = rows.map((r) => r.powerW);
  const cpu = rows.map((r) => r.cpuPct);
  const ram = rows.map((r) => r.ramPct);
  const temps = rows.map((r) => r.cpuTempC);
  const ps = describe(power);
  await prisma.result.create({
    data: {
      testId: test.id,
      samples: rows.length,
      powerMeanW: ps.mean,
      powerMedianW: ps.median,
      powerStdW: ps.std,
      powerVarW: ps.variance,
      powerMinW: ps.min,
      powerMaxW: ps.max,
      cpuMeanPct: describe(cpu).mean,
      ramMeanPct: describe(ram).mean,
      tempMeanC: describe(temps).mean,
      energyWh: round(rows[rows.length - 1].energyJ / 3600, 3),
      corrPowerCpu: pearson(power, cpu),
    },
  });
  return test;
}

async function main() {
  console.log('🌱 Réinitialisation de la base…');
  await prisma.result.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.test.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.machine.deleteMany();
  // Réinitialise les compteurs auto-increment → IDs stables (1, 2, 3…) à chaque seed.
  await prisma.$executeRawUnsafe(
    "DELETE FROM sqlite_sequence WHERE name IN ('machines','scenarios','tests','measurements','results')",
  );

  // ── Scénarios ──────────────────────────────────────────────────────────────
  console.log('🌱 Scénarios…');
  const S = await Promise.all(
    [
      // Cas 1 : matériel
      { code: 'C1-S1-REPOS', name: 'Système au repos', workload: WorkloadType.IDLE, studyCase: StudyCase.HARDWARE, description: 'Machine au repos, aucune activité.' },
      { code: 'C1-S2-WEB', name: 'Navigation Web', workload: WorkloadType.WEB, studyCase: StudyCase.HARDWARE, description: 'Navigation multi-onglets continue.' },
      { code: 'C1-S3-VIDEO', name: 'Lecture vidéo Full HD', workload: WorkloadType.VIDEO, studyCase: StudyCase.HARDWARE, description: 'Lecture d’une vidéo 1080p.' },
      { code: 'C1-S4-CPU', name: 'Charge CPU maximale', workload: WorkloadType.CPU, studyCase: StudyCase.HARDWARE, description: 'Stress CPU sur tous les cœurs.' },
      // Cas 2 : virtualisation
      { code: 'C2-S1-VM-REPOS', name: 'VM au repos', workload: WorkloadType.IDLE, studyCase: StudyCase.VIRTUALIZATION, description: 'Une VM Ubuntu démarrée sans activité.' },
      { code: 'C2-S2-VM-WEB', name: 'Navigation Web dans la VM', workload: WorkloadType.WEB, studyCase: StudyCase.VIRTUALIZATION, description: 'Navigation Internet dans la VM.' },
      { code: 'C2-S3-VM-CPU', name: 'Charge CPU dans la VM', workload: WorkloadType.CPU, studyCase: StudyCase.VIRTUALIZATION, description: 'stress --cpu 2 dans la VM.' },
      { code: 'C2-S4-MULTI', name: 'Plusieurs VM simultanées', workload: WorkloadType.CPU, studyCase: StudyCase.VIRTUALIZATION, description: 'Montée en charge : 1, 2, 3 VM.' },
      { code: 'C2-S5-HYPERVISEURS', name: 'Comparaison VirtualBox / VMware', workload: WorkloadType.CPU, studyCase: StudyCase.VIRTUALIZATION, description: 'Mêmes tests sous deux hyperviseurs.' },
    ].map((s) => prisma.scenario.create({ data: { ...s, durationS: 600 } })),
  );
  const sc = Object.fromEntries(S.map((x) => [x.code, x.id])) as Record<string, number>;

  // ── Machines ────────────────────────────────────────────────────────────────
  console.log('🌱 Machines…');
  const desktop = await prisma.machine.create({
    data: { name: 'PC Fixe (bureau)', type: MachineType.DESKTOP, cpuModel: 'Intel Core i5-10400', cpuCores: 6, ramGo: 16, os: 'Windows 11', pIdleW: 55, pMaxW: 145 },
  });
  const laptop = await prisma.machine.create({
    data: { name: 'Ordinateur portable', type: MachineType.LAPTOP, cpuModel: 'Intel Core i5-1135G7', cpuCores: 4, ramGo: 16, os: 'Ubuntu 22.04', pIdleW: 8, pMaxW: 42 },
  });
  const host = await prisma.machine.create({
    data: { name: 'Hôte de virtualisation', type: MachineType.HOST, cpuModel: 'Intel Core i7-11700', cpuCores: 8, ramGo: 32, os: 'Ubuntu 22.04', pIdleW: 12, pMaxW: 62 },
  });

  const N = 90; // 90 échantillons (90 s) par campagne

  // ── Cas 1 : fixe vs portable, 4 scénarios chacun ────────────────────────────
  console.log('🌱 Campagnes — cas 1 (fixe vs portable)…');
  const hwScenarios = ['C1-S1-REPOS', 'C1-S2-WEB', 'C1-S3-VIDEO', 'C1-S4-CPU'] as const;
  const wl: Record<string, WorkloadType> = {
    'C1-S1-REPOS': WorkloadType.IDLE,
    'C1-S2-WEB': WorkloadType.WEB,
    'C1-S3-VIDEO': WorkloadType.VIDEO,
    'C1-S4-CPU': WorkloadType.CPU,
  };
  for (const code of hwScenarios) {
    await campaign({ machineId: desktop.id, scenarioId: sc[code], gen: { pIdleW: 55, pMaxW: 145, ramGo: 16, workload: wl[code], count: N, baseTime: 0 } });
    await campaign({ machineId: laptop.id, scenarioId: sc[code], gen: { pIdleW: 8, pMaxW: 42, ramGo: 16, workload: wl[code], count: N, baseTime: 0 } });
  }

  // ── Cas 2 : virtualisation (sur l'hôte) ─────────────────────────────────────
  console.log('🌱 Campagnes — cas 2 (virtualisation)…');
  const HOST = { pIdleW: 12, pMaxW: 62, ramGo: 32 };

  // Référence H2 : hôte au repos SANS VM
  await campaign({
    machineId: host.id,
    scenarioId: sc['C1-S1-REPOS'],
    vmCount: 0,
    gen: { ...HOST, workload: WorkloadType.IDLE, count: N, baseTime: 0 },
    notes: 'Référence : hôte au repos sans virtualisation.',
  });

  // VirtualBox — une VM, 3 scénarios (overhead virtualisation ~ +12 %)
  await campaign({ machineId: host.id, scenarioId: sc['C2-S1-VM-REPOS'], hypervisor: Hypervisor.VIRTUALBOX, vmCount: 1, gen: { ...HOST, workload: WorkloadType.IDLE, count: N, cpuOverride: 11, powerOverhead: 1.12, baseTime: 0 } });
  await campaign({ machineId: host.id, scenarioId: sc['C2-S2-VM-WEB'], hypervisor: Hypervisor.VIRTUALBOX, vmCount: 1, gen: { ...HOST, workload: WorkloadType.WEB, count: N, cpuOverride: 30, powerOverhead: 1.12, baseTime: 0 } });
  await campaign({ machineId: host.id, scenarioId: sc['C2-S3-VM-CPU'], hypervisor: Hypervisor.VIRTUALBOX, vmCount: 1, gen: { ...HOST, workload: WorkloadType.CPU, count: N, cpuOverride: 60, powerOverhead: 1.12, baseTime: 0 } });

  // Montée en charge (H3) : 1, 2, 3 VM (charge cumulée)
  const vmLoad = [
    { vm: 1, cpu: 30 },
    { vm: 2, cpu: 54 },
    { vm: 3, cpu: 76 },
  ];
  for (const { vm, cpu } of vmLoad) {
    await campaign({
      machineId: host.id,
      scenarioId: sc['C2-S4-MULTI'],
      hypervisor: Hypervisor.VIRTUALBOX,
      vmCount: vm,
      gen: { ...HOST, workload: WorkloadType.CPU, count: N, cpuOverride: cpu, powerOverhead: 1.12, baseTime: 0 },
      notes: `${vm} VM simultanée(s).`,
    });
  }

  // Comparaison hyperviseurs (S5) : même charge, VBox (overhead +18 %) vs VMware (+8 %)
  await campaign({ machineId: host.id, scenarioId: sc['C2-S5-HYPERVISEURS'], hypervisor: Hypervisor.VIRTUALBOX, vmCount: 1, gen: { ...HOST, workload: WorkloadType.CPU, count: N, cpuOverride: 60, powerOverhead: 1.18, baseTime: 0 }, notes: 'Hyperviseur VirtualBox.' });
  await campaign({ machineId: host.id, scenarioId: sc['C2-S5-HYPERVISEURS'], hypervisor: Hypervisor.VMWARE, vmCount: 1, gen: { ...HOST, workload: WorkloadType.CPU, count: N, cpuOverride: 57, powerOverhead: 1.08, baseTime: 0 }, notes: 'Hyperviseur VMware.' });

  const counts = {
    machines: await prisma.machine.count(),
    scenarios: await prisma.scenario.count(),
    tests: await prisma.test.count(),
    measurements: await prisma.measurement.count(),
  };
  console.log('✅ Seed terminé :', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

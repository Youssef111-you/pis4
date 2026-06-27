import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MachineType,
  StudyCase,
  Hypervisor,
  HypothesisResult,
  ComparisonRow,
} from '@energie-si/shared';
import { describe, pearson, differencePct, welchT, round } from './stats.util';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────── Résultats par test ─────────────────────────

  /** Calcule les agrégats statistiques d'un test et les stocke (table results). */
  async computeAndStoreResult(testId: number) {
    const ms = await this.prisma.measurement.findMany({
      where: { testId },
      orderBy: { timestamp: 'asc' },
    });
    if (ms.length === 0) return null;

    const power = ms.map((m) => m.powerW);
    const cpu = ms.map((m) => m.cpuPct);
    const ram = ms.map((m) => m.ramPct);
    const temps = ms.map((m) => m.cpuTempC).filter((t): t is number => t != null);
    const ps = describe(power);
    const energyJ = ms[ms.length - 1].energyJ;

    const data = {
      samples: ms.length,
      powerMeanW: ps.mean,
      powerMedianW: ps.median,
      powerStdW: ps.std,
      powerVarW: ps.variance,
      powerMinW: ps.min,
      powerMaxW: ps.max,
      cpuMeanPct: describe(cpu).mean,
      ramMeanPct: describe(ram).mean,
      tempMeanC: temps.length ? describe(temps).mean : null,
      energyWh: round(energyJ / 3600, 3),
      corrPowerCpu: pearson(power, cpu),
    };

    return this.prisma.result.upsert({
      where: { testId },
      create: { testId, ...data },
      update: data,
    });
  }

  // ───────────────────────────── Tableau de bord ────────────────────────────

  /** Synthèse globale pour la vue d'ensemble. */
  async summary() {
    const [machines, tests, measurements, results] = await Promise.all([
      this.prisma.machine.count(),
      this.prisma.test.count(),
      this.prisma.measurement.count(),
      this.prisma.result.findMany({ include: { test: { include: { machine: true } } } }),
    ]);

    const byType: Record<string, { power: number[]; energy: number[] }> = {};
    for (const r of results) {
      const type = r.test.machine.type;
      byType[type] ??= { power: [], energy: [] };
      byType[type].power.push(r.powerMeanW);
      byType[type].energy.push(r.energyWh);
    }
    const powerByType = Object.entries(byType).map(([type, v]) => ({
      type,
      powerMeanW: describe(v.power).mean,
      energyMeanWh: describe(v.energy).mean,
      tests: v.power.length,
    }));

    return {
      counts: { machines, tests, measurements, results: results.length },
      powerByType,
    };
  }

  // ─────────────────────────── Données pour graphiques ──────────────────────

  /** Série temporelle (mesures) d'un test, pour tracer les courbes. */
  async timeseries(testId: number) {
    const ms = await this.prisma.measurement.findMany({
      where: { testId },
      orderBy: { timestamp: 'asc' },
    });
    return ms.map((m, i) => ({
      t: i, // secondes écoulées
      cpuPct: m.cpuPct,
      ramPct: m.ramPct,
      powerW: round(m.powerW, 2),
      cpuTempC: m.cpuTempC,
    }));
  }

  // ─────────────────────────── Comparaisons (tableaux) ──────────────────────

  private async powerSamples(where: any): Promise<number[]> {
    const ms = await this.prisma.measurement.findMany({ where, select: { powerW: true } });
    return ms.map((m) => m.powerW);
  }

  private async resultsRow(label: string, where: any): Promise<ComparisonRow> {
    const results = await this.prisma.result.findMany({ where });
    const power = results.map((r) => r.powerMeanW);
    const energy = results.map((r) => r.energyWh);
    const cpu = results.map((r) => r.cpuMeanPct);
    const temps = results.map((r) => r.tempMeanC).filter((t): t is number => t != null);
    return {
      label,
      powerMeanW: describe(power).mean,
      energyWh: round(describe(energy).mean, 3),
      cpuMeanPct: describe(cpu).mean,
      tempMeanC: temps.length ? describe(temps).mean : null,
      samples: results.length,
    };
  }

  /** Cas 1 : comparaison fixe vs portable, par scénario. */
  async compareHardware() {
    const scenarios = await this.prisma.scenario.findMany({
      where: { studyCase: StudyCase.HARDWARE },
      orderBy: { id: 'asc' },
    });
    const rows: Array<{
      scenario: string;
      code: string;
      desktopW: number;
      laptopW: number;
      diffPct: number;
    }> = [];
    for (const sc of scenarios) {
      const desktop = await this.resultsRow('Fixe', {
        test: { scenarioId: sc.id, machine: { type: MachineType.DESKTOP } },
      });
      const laptop = await this.resultsRow('Portable', {
        test: { scenarioId: sc.id, machine: { type: MachineType.LAPTOP } },
      });
      rows.push({
        scenario: sc.name,
        code: sc.code,
        desktopW: desktop.powerMeanW,
        laptopW: laptop.powerMeanW,
        diffPct: differencePct(laptop.powerMeanW, desktop.powerMeanW),
      });
    }
    return rows;
  }

  /** Cas 2 (S5) : comparaison VirtualBox vs VMware, à conditions égales (scénario dédié). */
  async compareHypervisors() {
    const where = (h: Hypervisor) => ({
      test: { hypervisor: h, scenario: { code: 'C2-S5-HYPERVISEURS' } },
    });
    const vbox = await this.resultsRow('VirtualBox', where(Hypervisor.VIRTUALBOX));
    const vmware = await this.resultsRow('VMware', where(Hypervisor.VMWARE));
    return {
      virtualbox: vbox,
      vmware: vmware,
      diffPct: differencePct(vbox.powerMeanW, vmware.powerMeanW),
    };
  }

  /** Évolution de la consommation selon le nombre de VM (scénario de montée en charge, pour H3). */
  async powerByVmCount() {
    const results = await this.prisma.result.findMany({
      where: { test: { vmCount: { gt: 0 }, scenario: { code: 'C2-S4-MULTI' } } },
      include: { test: true },
      orderBy: { test: { vmCount: 'asc' } },
    });
    const map = new Map<number, number[]>();
    for (const r of results) {
      const n = r.test.vmCount;
      if (!map.has(n)) map.set(n, []);
      map.get(n)!.push(r.powerMeanW);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([vmCount, p]) => ({ vmCount, powerMeanW: describe(p).mean }));
  }

  // ─────────────────────────── Validation des hypothèses ────────────────────

  async hypotheses(): Promise<HypothesisResult[]> {
    return [await this.evalH1(), await this.evalH2(), await this.evalH3()];
  }

  /** H1 : le portable consomme moins que le fixe. */
  private async evalH1(): Promise<HypothesisResult> {
    const laptop = await this.powerSamples({
      test: { machine: { type: MachineType.LAPTOP }, scenario: { studyCase: StudyCase.HARDWARE } },
    });
    const desktop = await this.powerSamples({
      test: { machine: { type: MachineType.DESKTOP }, scenario: { studyCase: StudyCase.HARDWARE } },
    });
    const ls = describe(laptop);
    const ds = describe(desktop);
    const diff = differencePct(ls.mean, ds.mean); // négatif si portable < fixe
    const test = welchT(laptop, desktop);
    const confirmed = ls.mean < ds.mean && test.significant;

    return {
      id: 'H1',
      statement: 'Un ordinateur portable consomme moins d’énergie qu’un ordinateur fixe.',
      verdict: laptop.length === 0 || desktop.length === 0 ? 'INCONCLUSIVE' : confirmed ? 'CONFIRMED' : 'REJECTED',
      differencePct: diff,
      conclusion: confirmed
        ? `H1 confirmée : le portable consomme en moyenne ${Math.abs(diff)} % de moins que le fixe (${ls.mean} W contre ${ds.mean} W ; t = ${test.t}, significatif).`
        : `H1 non confirmée avec les données disponibles (portable ${ls.mean} W, fixe ${ds.mean} W).`,
      evidence: {
        laptopMeanW: ls.mean,
        desktopMeanW: ds.mean,
        differencePct: diff,
        tStatistic: test.t,
      },
    };
  }

  /** H2 : la virtualisation augmente la consommation de l'hôte. */
  private async evalH2(): Promise<HypothesisResult> {
    // Référence : hôte sans VM (vmCount = 0). Comparé : hôte avec ≥ 1 VM.
    const baseline = await this.powerSamples({
      test: { machine: { type: MachineType.HOST }, vmCount: 0 },
    });
    const withVm = await this.powerSamples({
      test: { machine: { type: MachineType.HOST }, vmCount: { gte: 1 } },
    });
    const bs = describe(baseline);
    const vs = describe(withVm);
    const diff = differencePct(vs.mean, bs.mean); // positif si VM > hôte seul
    const test = welchT(withVm, baseline);
    const confirmed = vs.mean > bs.mean && test.significant;

    return {
      id: 'H2',
      statement: 'L’utilisation d’une machine virtuelle augmente la consommation du système hôte.',
      verdict: baseline.length === 0 || withVm.length === 0 ? 'INCONCLUSIVE' : confirmed ? 'CONFIRMED' : 'REJECTED',
      differencePct: diff,
      conclusion: confirmed
        ? `H2 confirmée : l’exécution d’une VM augmente la consommation de l’hôte de ${diff} % (${bs.mean} W → ${vs.mean} W ; t = ${test.t}, significatif).`
        : `H2 non confirmée avec les données disponibles (hôte seul ${bs.mean} W, hôte + VM ${vs.mean} W).`,
      evidence: {
        hostBaselineW: bs.mean,
        hostWithVmW: vs.mean,
        differencePct: diff,
        tStatistic: test.t,
      },
    };
  }

  /** H3 : la consommation augmente avec le nombre de VM. */
  private async evalH3(): Promise<HypothesisResult> {
    const series = await this.powerByVmCount();
    if (series.length < 2) {
      return {
        id: 'H3',
        statement: 'La consommation augmente avec le nombre de machines virtuelles exécutées.',
        verdict: 'INCONCLUSIVE',
        differencePct: null,
        conclusion: 'Données insuffisantes (moins de deux niveaux de VM mesurés).',
        evidence: {},
      };
    }
    const counts = series.map((s) => s.vmCount);
    const powers = series.map((s) => s.powerMeanW);
    const corr = pearson(counts, powers);
    // Monotonie croissante stricte ?
    let monotone = true;
    for (let i = 1; i < powers.length; i++) if (powers[i] <= powers[i - 1]) monotone = false;
    const diff = differencePct(powers[powers.length - 1], powers[0]);
    const confirmed = corr > 0.7 && monotone;

    return {
      id: 'H3',
      statement: 'La consommation augmente avec le nombre de machines virtuelles exécutées.',
      verdict: confirmed ? 'CONFIRMED' : 'REJECTED',
      differencePct: diff,
      conclusion: confirmed
        ? `H3 confirmée : la consommation croît avec le nombre de VM (corrélation r = ${corr}), soit +${diff} % entre ${counts[0]} et ${counts[counts.length - 1]} VM.`
        : `H3 non confirmée : la relation nb VM ↔ consommation n’est pas strictement croissante (r = ${corr}).`,
      evidence: {
        correlation: corr,
        differencePct: diff,
        levels: counts.join(', '),
      },
    };
  }
}

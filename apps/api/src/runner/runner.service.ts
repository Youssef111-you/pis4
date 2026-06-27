import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectorService } from '../collector/collector.service';
import { PowerService } from '../power/power.service';
import { AnalysisService } from '../analysis/analysis.service';
import { RunnerGateway } from './runner.gateway';
import { CpuStress } from './cpu-stress';
import { RunTestDto, WorkloadType, TestStatus, Hypervisor } from '@energie-si/shared';
import * as os from 'os';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round = (n: number, d = 2) => Number(n.toFixed(d));

@Injectable()
export class RunnerService {
  private readonly logger = new Logger(RunnerService.name);
  private readonly stress = new CpuStress();
  private running = false;
  private currentTestId: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly collector: CollectorService,
    private readonly power: PowerService,
    private readonly analysis: AnalysisService,
    private readonly gateway: RunnerGateway,
  ) {}

  isRunning() {
    return { running: this.running, testId: this.currentTestId };
  }

  /** Lance un test : crée l'enregistrement, démarre la boucle de mesure (asynchrone) et renvoie le test. */
  async run(dto: RunTestDto) {
    if (this.running) {
      throw new ConflictException('Un test est déjà en cours. Attendez sa fin ou arrêtez-le.');
    }

    const machine = await this.prisma.machine.findUnique({ where: { id: dto.machineId } });
    if (!machine) throw new NotFoundException(`Machine ${dto.machineId} introuvable`);

    const scenario = await this.prisma.scenario.findUnique({ where: { code: dto.scenarioCode } });
    if (!scenario) throw new NotFoundException(`Scénario ${dto.scenarioCode} introuvable`);

    const backend = this.power.getActiveBackend();
    const durationS = dto.durationS ?? Math.min(scenario.durationS, 30); // démo : 30 s max par défaut
    const intervalMs = dto.intervalMs ?? 1000;

    const test = await this.prisma.test.create({
      data: {
        machineId: machine.id,
        scenarioId: scenario.id,
        hypervisor: dto.hypervisor ?? Hypervisor.NONE,
        vmCount: dto.vmCount ?? 0,
        powerBackend: backend,
        status: TestStatus.RUNNING,
        notes: dto.notes,
      },
      include: { machine: true, scenario: true },
    });

    this.running = true;
    this.currentTestId = test.id;
    this.power.reset();
    this.gateway.emitStarted(test as any);

    // Boucle de mesure lancée en arrière-plan (le client suit via WebSocket).
    void this.loop(test.id, machine, scenario.workload as WorkloadType, durationS, intervalMs).catch(
      (e) => this.logger.error(`Erreur pendant le test ${test.id}: ${e.message}`),
    );

    return test;
  }

  /** Arrête proprement le test en cours. */
  async stop() {
    this.running = false;
    this.stress.stop();
    return { stopped: true, testId: this.currentTestId };
  }

  private async loop(
    testId: number,
    machine: { pIdleW: number; pMaxW: number; cpuCores: number | null },
    workload: WorkloadType,
    durationS: number,
    intervalMs: number,
  ) {
    // Application de la charge selon le type de scénario.
    // On sature les cœurs RÉELS de l'hôte (et non le profil de la machine simulée).
    if (workload === WorkloadType.CPU) {
      this.stress.start(os.cpus().length);
    }

    const totalSamples = Math.max(1, Math.floor((durationS * 1000) / intervalMs));
    let energyJ = 0;

    try {
      for (let i = 0; i < totalSamples && this.running; i++) {
        const t0 = Date.now();
        const s = await this.collector.sample();
        const powerW = round(
          await this.power.read({ cpuPct: s.cpuPct, pIdleW: machine.pIdleW, pMaxW: machine.pMaxW }),
        );
        energyJ = round(energyJ + powerW * (intervalMs / 1000), 3);

        await this.prisma.measurement.create({
          data: {
            testId,
            cpuPct: s.cpuPct,
            ramPct: s.ramPct,
            ramMo: s.ramMo,
            cpuTempC: s.cpuTempC,
            powerW,
            energyJ,
          },
        });

        this.gateway.emitSample({
          testId,
          elapsedS: i + 1,
          cpuPct: s.cpuPct,
          ramPct: s.ramPct,
          ramMo: s.ramMo,
          cpuTempC: s.cpuTempC,
          powerW,
          energyJ,
          backend: this.power.getActiveBackend(),
        });

        const elapsed = Date.now() - t0;
        await sleep(Math.max(0, intervalMs - elapsed));
      }
    } finally {
      this.stress.stop();
      const status = this.running ? TestStatus.COMPLETED : TestStatus.ABORTED;
      const test = await this.prisma.test.update({
        where: { id: testId },
        data: { status, endedAt: new Date() },
        include: { machine: true, scenario: true },
      });
      await this.analysis.computeAndStoreResult(testId);
      const full = await this.prisma.test.findUnique({
        where: { id: testId },
        include: { machine: true, scenario: true, result: true },
      });
      this.running = false;
      this.currentTestId = null;
      this.gateway.emitCompleted(full as any);
      this.logger.log(`Test ${testId} terminé (${status}).`);
    }
  }
}

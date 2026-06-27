import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PowerBackend } from '@energie-si/shared';
import { PowerBackendStrategy, PowerContext } from './power-backend.interface';
import { RaplBackend } from './rapl.backend';
import { BatteryBackend } from './battery.backend';
import { ModelBackend } from './model.backend';

/**
 * Sélectionne automatiquement le backend de mesure le plus précis disponible,
 * du plus fiable (RAPL) au repli universel (Model), et délègue les lectures.
 */
@Injectable()
export class PowerService implements OnModuleInit {
  private readonly logger = new Logger(PowerService.name);
  private readonly strategies: PowerBackendStrategy[];
  private active!: PowerBackendStrategy;

  constructor(
    private readonly rapl: RaplBackend,
    private readonly battery: BatteryBackend,
    private readonly model: ModelBackend,
  ) {
    this.strategies = [rapl, battery, model].sort((a, b) => b.priority - a.priority);
  }

  async onModuleInit() {
    await this.selectBackend();
  }

  /** (Re)choisit le backend actif en testant la disponibilité par ordre de priorité. */
  async selectBackend(): Promise<PowerBackend> {
    for (const s of this.strategies) {
      if (await s.isAvailable()) {
        this.active = s;
        this.logger.log(`Backend énergie sélectionné : ${s.backend} (priorité ${s.priority})`);
        s.reset?.();
        return s.backend;
      }
    }
    this.active = this.model; // sécurité : le modèle est toujours dispo
    return this.model.backend;
  }

  getActiveBackend(): PowerBackend {
    return this.active?.backend ?? PowerBackend.MODEL;
  }

  /** Liste l'état de disponibilité de chaque backend (pour l'UI / diagnostic). */
  async describe(): Promise<Array<{ backend: PowerBackend; available: boolean; priority: number }>> {
    const out: Array<{ backend: PowerBackend; available: boolean; priority: number }> = [];
    for (const s of this.strategies) {
      out.push({ backend: s.backend, available: await s.isAvailable(), priority: s.priority });
    }
    return out;
  }

  /** Prépare le backend pour un nouveau test (réinitialise les compteurs). */
  reset(): void {
    this.active?.reset?.();
  }

  /** Lit la puissance instantanée via le backend actif. */
  async read(ctx: PowerContext): Promise<number> {
    const value = await this.active.read(ctx);
    // Sécurité : si un backend matériel renvoie 0/NaN, on retombe sur le modèle.
    if (!Number.isFinite(value) || value <= 0) {
      return this.model.read(ctx);
    }
    return value;
  }
}

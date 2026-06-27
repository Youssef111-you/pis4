import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PowerBackend } from '@energie-si/shared';
import { PowerBackendStrategy, PowerContext } from './power-backend.interface';

const RAPL_ENERGY = '/sys/class/powercap/intel-rapl:0/energy_uj';
const RAPL_MAX = '/sys/class/powercap/intel-rapl:0/max_energy_range_uj';

/**
 * Backend RAPL (Running Average Power Limit) — Intel/AMD sous Linux.
 * Lit le compteur d'énergie cumulée du package CPU (energy_uj, en microjoules)
 * et déduit la puissance = ΔE / Δt. Nécessite généralement les droits root
 * (atténuation CVE‑2020‑8694) : si la lecture échoue, le manager passe au backend suivant.
 */
@Injectable()
export class RaplBackend implements PowerBackendStrategy {
  readonly backend = PowerBackend.RAPL;
  readonly priority = 90;
  private readonly logger = new Logger(RaplBackend.name);

  private lastEnergyUj: number | null = null;
  private lastTimeMs: number | null = null;
  private maxRangeUj = Number.MAX_SAFE_INTEGER;

  async isAvailable(): Promise<boolean> {
    try {
      await fs.readFile(RAPL_ENERGY, 'utf8');
      try {
        this.maxRangeUj = Number((await fs.readFile(RAPL_MAX, 'utf8')).trim());
      } catch {
        /* max range optionnel */
      }
      return true;
    } catch (e: any) {
      this.logger.debug(`RAPL indisponible (${e.code ?? e.message})`);
      return false;
    }
  }

  reset(): void {
    this.lastEnergyUj = null;
    this.lastTimeMs = null;
  }

  async read(_ctx: PowerContext): Promise<number> {
    const energyUj = Number((await fs.readFile(RAPL_ENERGY, 'utf8')).trim());
    const nowMs = Date.now();

    if (this.lastEnergyUj === null || this.lastTimeMs === null) {
      this.lastEnergyUj = energyUj;
      this.lastTimeMs = nowMs;
      return 0; // première lecture : pas encore de delta
    }

    let deltaUj = energyUj - this.lastEnergyUj;
    if (deltaUj < 0) deltaUj += this.maxRangeUj; // gestion du débordement du compteur
    const deltaS = (nowMs - this.lastTimeMs) / 1000;

    this.lastEnergyUj = energyUj;
    this.lastTimeMs = nowMs;

    if (deltaS <= 0) return 0;
    // ΔE (J) / Δt (s) = puissance (W) ; energy_uj en microjoules → /1e6
    return deltaUj / 1e6 / deltaS;
  }
}

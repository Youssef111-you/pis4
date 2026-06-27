import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PowerBackend } from '@energie-si/shared';
import { PowerBackendStrategy, PowerContext } from './power-backend.interface';

const SUPPLY_DIR = '/sys/class/power_supply';

/**
 * Backend Batterie (ordinateur portable, Linux).
 * Lit la puissance instantanée de décharge via :
 *   - power_now (µW), ou
 *   - current_now (µA) × voltage_now (µV)
 * Valable uniquement quand la batterie se décharge (sur secteur, la valeur
 * reflète la charge et non la consommation système → backend marqué indisponible).
 */
@Injectable()
export class BatteryBackend implements PowerBackendStrategy {
  readonly backend = PowerBackend.BATTERY;
  readonly priority = 70;
  private readonly logger = new Logger(BatteryBackend.name);
  private batteryPath: string | null = null;

  private async findBattery(): Promise<string | null> {
    if (this.batteryPath) return this.batteryPath;
    try {
      const entries = await fs.readdir(SUPPLY_DIR);
      for (const name of entries) {
        try {
          const type = (await fs.readFile(`${SUPPLY_DIR}/${name}/type`, 'utf8')).trim();
          if (type === 'Battery') {
            this.batteryPath = `${SUPPLY_DIR}/${name}`;
            return this.batteryPath;
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* pas de /sys/class/power_supply */
    }
    return null;
  }

  private async readPowerW(path: string): Promise<number | null> {
    try {
      const powerNow = Number((await fs.readFile(`${path}/power_now`, 'utf8')).trim());
      if (!Number.isNaN(powerNow) && powerNow > 0) return powerNow / 1e6; // µW → W
    } catch {
      /* power_now absent : on tente current × voltage */
    }
    try {
      const current = Number((await fs.readFile(`${path}/current_now`, 'utf8')).trim()); // µA
      const voltage = Number((await fs.readFile(`${path}/voltage_now`, 'utf8')).trim()); // µV
      if (current > 0 && voltage > 0) return (current * voltage) / 1e12; // µA·µV → W
    } catch {
      /* ignore */
    }
    return null;
  }

  async isAvailable(): Promise<boolean> {
    const path = await this.findBattery();
    if (!path) return false;
    try {
      const status = (await fs.readFile(`${path}/status`, 'utf8')).trim();
      const power = await this.readPowerW(path);
      const ok = status === 'Discharging' && power !== null && power > 0;
      if (!ok) {
        this.logger.debug(`Batterie présente mais non exploitable (status=${status})`);
      }
      return ok;
    } catch {
      return false;
    }
  }

  async read(_ctx: PowerContext): Promise<number> {
    const path = await this.findBattery();
    if (!path) return 0;
    const power = await this.readPowerW(path);
    return power ?? 0;
  }
}

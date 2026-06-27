import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as si from 'systeminformation';

export interface SystemSample {
  cpuPct: number; // charge CPU globale (%)
  ramPct: number; // utilisation mémoire (%)
  ramMo: number; // mémoire active (Mo)
  cpuTempC: number | null; // température CPU (°C) si disponible
}

export interface MachineSpecs {
  cpuModel: string;
  cpuCores: number;
  ramGo: number;
  os: string;
}

/**
 * Collecte les métriques matérielles instantanées (CPU, RAM, température)
 * via `systeminformation`, avec repli sur /sys/class/thermal pour la température.
 */
@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name);

  /** Échantillon instantané des ressources. */
  async sample(): Promise<SystemSample> {
    const [load, mem, temp] = await Promise.all([
      si.currentLoad().catch(() => null),
      si.mem().catch(() => null),
      this.readCpuTemp(),
    ]);

    const cpuPct = load ? Number(load.currentLoad.toFixed(1)) : 0;
    const ramPct = mem ? Number(((mem.active / mem.total) * 100).toFixed(1)) : 0;
    const ramMo = mem ? Number((mem.active / 1024 / 1024).toFixed(0)) : 0;

    return { cpuPct, ramPct, ramMo, cpuTempC: temp };
  }

  /** Température CPU : systeminformation puis repli /sys/class/thermal. */
  private async readCpuTemp(): Promise<number | null> {
    try {
      const t = await si.cpuTemperature();
      if (t && typeof t.main === 'number' && t.main > 0) return Number(t.main.toFixed(1));
    } catch {
      /* repli ci-dessous */
    }
    try {
      const raw = await fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8');
      const milli = Number(raw.trim());
      if (milli > 0) return Number((milli / 1000).toFixed(1));
    } catch {
      /* température indisponible */
    }
    return null;
  }

  /** Détection automatique des caractéristiques de la machine hôte. */
  async detectSpecs(): Promise<MachineSpecs> {
    const [cpu, mem, osInfo] = await Promise.all([si.cpu(), si.mem(), si.osInfo()]);
    return {
      cpuModel: `${cpu.manufacturer} ${cpu.brand}`.trim(),
      cpuCores: cpu.cores,
      ramGo: Number((mem.total / 1024 / 1024 / 1024).toFixed(1)),
      os: `${osInfo.distro} ${osInfo.release} (${osInfo.arch})`.trim(),
    };
  }
}

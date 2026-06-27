import { Injectable } from '@nestjs/common';
import { PowerBackend } from '@energie-si/shared';
import { PowerBackendStrategy, PowerContext } from './power-backend.interface';

/**
 * Backend Modèle — estimation logicielle universelle (repli).
 * Modèle linéaire de puissance largement utilisé en littérature :
 *
 *     P(u) = P_idle + (P_max − P_idle) × u
 *
 * où u = charge CPU ∈ [0,1]. Les paramètres P_idle et P_max sont calibrés
 * par machine (champs pIdleW / pMaxW). Toujours disponible.
 */
@Injectable()
export class ModelBackend implements PowerBackendStrategy {
  readonly backend = PowerBackend.MODEL;
  readonly priority = 10;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async read(ctx: PowerContext): Promise<number> {
    const u = Math.min(Math.max(ctx.cpuPct / 100, 0), 1);
    return ctx.pIdleW + (ctx.pMaxW - ctx.pIdleW) * u;
  }
}

import { PowerBackend } from '@energie-si/shared';

/** Contexte fourni à chaque lecture de puissance. */
export interface PowerContext {
  /** Charge CPU instantanée (%) — utilisée par le modèle d'estimation. */
  cpuPct: number;
  /** Puissance de repos de la machine (W) — paramètre du modèle. */
  pIdleW: number;
  /** Puissance maximale de la machine (W) — paramètre du modèle. */
  pMaxW: number;
}

/**
 * Stratégie de mesure de la puissance instantanée.
 * Chaque backend sait dire s'il est disponible et lire une valeur en Watts.
 */
export interface PowerBackendStrategy {
  /** Identifiant du backend (tracé dans chaque mesure). */
  readonly backend: PowerBackend;
  /** Priorité : plus la valeur est haute, plus le backend est précis/préféré. */
  readonly priority: number;
  /** Le backend peut-il fonctionner sur cette machine ? */
  isAvailable(): Promise<boolean>;
  /** Lecture de la puissance instantanée en Watts. */
  read(ctx: PowerContext): Promise<number>;
  /** Réinitialise l'état interne (compteurs d'énergie) avant un test. */
  reset?(): void;
}

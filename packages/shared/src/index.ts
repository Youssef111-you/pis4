/**
 * @energie-si/shared
 * Types, énumérations et contrats partagés entre l'API (NestJS) et le dashboard (Next.js).
 */

// ──────────────────────────────────────────────────────────────────────────
// Énumérations métier
// ──────────────────────────────────────────────────────────────────────────

/** Type d'équipement informatique étudié. */
export enum MachineType {
  DESKTOP = 'DESKTOP', // ordinateur fixe
  LAPTOP = 'LAPTOP', // ordinateur portable
  HOST = 'HOST', // hôte de virtualisation
  VM = 'VM', // machine virtuelle
}

/** Hyperviseur utilisé (cas d'étude 2). */
export enum Hypervisor {
  NONE = 'NONE',
  VIRTUALBOX = 'VIRTUALBOX',
  VMWARE = 'VMWARE',
}

/** Type de charge appliquée pendant un scénario. */
export enum WorkloadType {
  IDLE = 'IDLE', // repos
  WEB = 'WEB', // navigation web
  VIDEO = 'VIDEO', // lecture vidéo Full HD
  CPU = 'CPU', // charge CPU maximale
}

/** Backend de mesure énergétique réellement utilisé pour une mesure. */
export enum PowerBackend {
  WATTMETER = 'WATTMETER',
  RAPL = 'RAPL',
  BATTERY = 'BATTERY',
  MODEL = 'MODEL',
}

/** Cas d'étude du sujet de recherche. */
export enum StudyCase {
  HARDWARE = 'HARDWARE', // Cas 1 : fixe vs portable
  VIRTUALIZATION = 'VIRTUALIZATION', // Cas 2 : virtualisation
}

/** État d'exécution d'un test. */
export enum TestStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

// ──────────────────────────────────────────────────────────────────────────
// Entités (formes sérialisées renvoyées par l'API)
// ──────────────────────────────────────────────────────────────────────────

export interface Machine {
  id: number;
  name: string;
  type: MachineType;
  cpuModel: string | null;
  cpuCores: number | null;
  ramGo: number | null;
  os: string | null;
  /** Puissance de repos (W) pour le modèle d'estimation. */
  pIdleW: number;
  /** Puissance maximale (W) pour le modèle d'estimation. */
  pMaxW: number;
  createdAt: string;
}

export interface Scenario {
  id: number;
  code: string; // ex: "S1-REPOS"
  name: string;
  description: string | null;
  durationS: number;
  workload: WorkloadType;
  studyCase: StudyCase;
}

export interface Test {
  id: number;
  machineId: number;
  scenarioId: number;
  hypervisor: Hypervisor;
  vmCount: number;
  powerBackend: PowerBackend;
  status: TestStatus;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  machine?: Machine;
  scenario?: Scenario;
  result?: Result | null;
}

export interface Measurement {
  id: number;
  testId: number;
  timestamp: string;
  cpuPct: number;
  ramPct: number;
  ramMo: number;
  cpuTempC: number | null;
  powerW: number;
  energyJ: number; // énergie cumulée depuis le début du test
}

export interface Result {
  id: number;
  testId: number;
  samples: number;
  powerMeanW: number;
  powerMedianW: number;
  powerStdW: number;
  powerVarW: number;
  powerMinW: number;
  powerMaxW: number;
  cpuMeanPct: number;
  ramMeanPct: number;
  tempMeanC: number | null;
  energyWh: number;
  /** Corrélation de Pearson puissance ↔ CPU%. */
  corrPowerCpu: number;
}

// ──────────────────────────────────────────────────────────────────────────
// DTO de création / pilotage
// ──────────────────────────────────────────────────────────────────────────

export interface CreateMachineDto {
  name: string;
  type: MachineType;
  cpuModel?: string;
  cpuCores?: number;
  ramGo?: number;
  os?: string;
  pIdleW?: number;
  pMaxW?: number;
}

export interface RunTestDto {
  machineId: number;
  scenarioCode: string;
  hypervisor?: Hypervisor;
  vmCount?: number;
  /** Durée en secondes (par défaut : durée du scénario). */
  durationS?: number;
  /** Intervalle d'échantillonnage en ms (défaut 1000). */
  intervalMs?: number;
  notes?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Évènements WebSocket (temps réel)
// ──────────────────────────────────────────────────────────────────────────

export const WS_EVENTS = {
  TEST_STARTED: 'test:started',
  SAMPLE: 'test:sample',
  TEST_COMPLETED: 'test:completed',
} as const;

export interface LiveSample {
  testId: number;
  elapsedS: number;
  cpuPct: number;
  ramPct: number;
  ramMo: number;
  cpuTempC: number | null;
  powerW: number;
  energyJ: number;
  backend: PowerBackend;
}

// ──────────────────────────────────────────────────────────────────────────
// Analyse comparative / hypothèses
// ──────────────────────────────────────────────────────────────────────────

export type HypothesisVerdict = 'CONFIRMED' | 'REJECTED' | 'INCONCLUSIVE';

export interface HypothesisResult {
  id: 'H1' | 'H2' | 'H3';
  statement: string;
  verdict: HypothesisVerdict;
  /** Différence en % (signe selon l'hypothèse). */
  differencePct: number | null;
  conclusion: string;
  evidence: Record<string, number | string | null>;
}

export interface ComparisonRow {
  label: string;
  powerMeanW: number;
  energyWh: number;
  cpuMeanPct: number;
  tempMeanC: number | null;
  samples: number;
}

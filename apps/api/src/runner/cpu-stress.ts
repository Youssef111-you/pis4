import { Worker } from 'worker_threads';

/**
 * Générateur de charge CPU 100 % en Node pur (worker_threads), équivalent à
 * `stress --cpu N`. Chaque worker sature un cœur via une boucle de calcul qui
 * rend la main au boucle d'évènements (setImmediate) pour pouvoir s'arrêter.
 * Aucune dépendance système requise → portable Linux/Windows/macOS.
 */
const WORKER_CODE = `
const { parentPort } = require('worker_threads');
let running = true;
parentPort.on('message', (m) => { if (m === 'stop') running = false; });
function chunk() {
  let x = 0;
  for (let i = 0; i < 5e6; i++) { x += Math.sqrt(i) * Math.sin(i); }
  return x;
}
function loop() {
  if (!running) { process.exit(0); return; }
  chunk();
  setImmediate(loop);
}
loop();
`;

export class CpuStress {
  private workers: Worker[] = [];

  /** Démarre `n` workers de charge (par défaut le nombre de cœurs). */
  start(n: number): void {
    this.stop();
    const count = Math.max(1, Math.floor(n));
    for (let i = 0; i < count; i++) {
      const w = new Worker(WORKER_CODE, { eval: true });
      w.on('error', () => {});
      this.workers.push(w);
    }
  }

  /** Arrête tous les workers. */
  stop(): void {
    for (const w of this.workers) {
      try {
        w.postMessage('stop');
        void w.terminate();
      } catch {
        /* ignore */
      }
    }
    this.workers = [];
  }

  get active(): number {
    return this.workers.length;
  }
}

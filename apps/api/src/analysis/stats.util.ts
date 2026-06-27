import * as ss from 'simple-statistics';

export interface SeriesStats {
  count: number;
  mean: number;
  median: number;
  std: number; // écart-type
  variance: number;
  min: number;
  max: number;
}

const round = (n: number, d = 2) => Number(n.toFixed(d));

/** Statistiques descriptives d'une série numérique. */
export function describe(values: number[]): SeriesStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, std: 0, variance: 0, min: 0, max: 0 };
  }
  return {
    count: values.length,
    mean: round(ss.mean(values)),
    median: round(ss.median(values)),
    std: round(ss.standardDeviation(values)),
    variance: round(ss.variance(values)),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
  };
}

/** Corrélation de Pearson entre deux séries (0 si non calculable). */
export function pearson(a: number[], b: number[]): number {
  if (a.length < 2 || a.length !== b.length) return 0;
  try {
    const r = ss.sampleCorrelation(a, b);
    return Number.isFinite(r) ? round(r, 3) : 0;
  } catch {
    return 0;
  }
}

/** Différence relative (%) de `value` par rapport à `reference`. */
export function differencePct(value: number, reference: number): number {
  if (reference === 0) return 0;
  return round(((value - reference) / reference) * 100, 1);
}

/**
 * Test t de Welch (échantillons indépendants, variances inégales).
 * Renvoie la statistique t et une approximation du seuil de signification.
 */
export function welchT(a: number[], b: number[]): { t: number; significant: boolean } {
  if (a.length < 2 || b.length < 2) return { t: 0, significant: false };
  const ma = ss.mean(a);
  const mb = ss.mean(b);
  const va = ss.variance(a);
  const vb = ss.variance(b);
  const se = Math.sqrt(va / a.length + vb / b.length);
  if (se === 0) return { t: 0, significant: false };
  const t = (ma - mb) / se;
  // Seuil empirique |t| > 2 ≈ p < 0,05 pour des effectifs raisonnables.
  return { t: round(t, 3), significant: Math.abs(t) > 2 };
}

export { round };

/** RNG determinístico (mulberry32). O estado vive dentro do GameState para o save ser reprodutível. */
export interface HasRng {
  rng: number;
}

export function rnd(g: HasRng): number {
  let t = (g.rng = (g.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const rint = (g: HasRng, min: number, max: number) => min + Math.floor(rnd(g) * (max - min + 1));
export const rrange = (g: HasRng, min: number, max: number) => min + rnd(g) * (max - min);
export const chance = (g: HasRng, p: number) => rnd(g) < p;
export const pick = <T>(g: HasRng, arr: readonly T[]): T => arr[Math.floor(rnd(g) * arr.length)];

/** Aproximação de normal (soma de 3 uniformes), centrada em `mean`. */
export function gauss(g: HasRng, mean: number, spread: number): number {
  return mean + ((rnd(g) + rnd(g) + rnd(g)) / 3 - 0.5) * 2 * spread;
}

export function weighted<T>(g: HasRng, items: { item: T; w: number }[]): T | null {
  const total = items.reduce((s, i) => s + Math.max(0, i.w), 0);
  if (total <= 0) return null;
  let r = rnd(g) * total;
  for (const i of items) {
    r -= Math.max(0, i.w);
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
}

export function shuffle<T>(g: HasRng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(g) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

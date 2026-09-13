/**
 * Deterministic seeded RNG so the same seed always rebuilds the same dungeon.
 */

/** FNV-1a style string hash → 32-bit unsigned integer. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** Mulberry32 PRNG — small, fast, good enough distribution for map gen. */
export function createRng(seed: string): Rng {
  let a = hashSeed(seed) || 0x9e3779b9;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randInt(rng, 0, items.length - 1)];
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SEED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly random seed like "K7XT-2QP". */
export function randomSeed(): string {
  const part = (n: number) =>
    Array.from(
      { length: n },
      () => SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)],
    ).join("");
  return `${part(4)}-${part(3)}`;
}

/**
 * Global seeded random number generator
 * Allows deterministic map generation for debugging
 */

let rng: () => number = Math.random
let currentSeed: number | null = null

/**
 * Set the global RNG seed
 * @param seed - Seed value, or null for Math.random
 */
export function setSeed(seed: number | null): void {
  currentSeed = seed
  if (seed === null) {
    rng = Math.random
  } else {
    // Mulberry32 seeded PRNG
    let s = seed
    rng = () => {
      s |= 0
      s = s + 0x6D2B79F5 | 0
      let t = Math.imul(s ^ s >>> 15, 1 | s)
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
      return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
  }
}

/**
 * Get a random number [0, 1)
 */
export function random(): number {
  return rng()
}

/**
 * Get current seed value
 */
export function getSeed(): number | null {
  return currentSeed
}

/**
 * In-place Fisher-Yates shuffle using seeded RNG
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

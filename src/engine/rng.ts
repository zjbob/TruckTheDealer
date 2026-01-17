export type Rng = {
  nextFloat: () => number
  nextInt: (maxExclusive: number) => number
}

/**
 * Creates a small deterministic pseudo-random number generator.
 * Use a fixed seed to replay games or keep multiplayer clients in sync.
 */
export function createRng(seed: number): Rng {
  let t = seed >>> 0

  /**
   * Returns a float in the range [0, 1).
   */
  const nextFloat = () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Returns an integer in the range [0, maxExclusive).
   */
  const nextInt = (maxExclusive: number) => {
    if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
      throw new Error('maxExclusive must be a positive number')
    }
    return Math.floor(nextFloat() * maxExclusive)
  }

  return { nextFloat, nextInt }
}

import type { Rng } from './rng'

/**
 * Shuffles an array in-place using Fisher–Yates.
 * Returns the same array for convenience.
 */
export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
  // Fisher–Yates
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

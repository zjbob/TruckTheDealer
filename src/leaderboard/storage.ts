import AsyncStorage from '@react-native-async-storage/async-storage'
import type { LifetimeLeaderboardDelta, LifetimeLeaderboardStats } from './types'

const STORAGE_KEY = 'truck-the-dealer:leaderboard:v1'

function defaultStats(now: number): LifetimeLeaderboardStats {
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    gamesStarted: 0,
    gamesCompleted: 0,
    drinksTaken: 0,
    correctGuesses: 0,
    incorrectGuesses: 0,
  }
}

function addNonNegative(current: number, delta: number | undefined): number {
  if (!delta) return current
  const next = current + delta
  return next < 0 ? 0 : next
}

let writeChain: Promise<unknown> = Promise.resolve()

export async function loadLifetimeLeaderboardStats(): Promise<LifetimeLeaderboardStats> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  const now = Date.now()
  if (!raw) return defaultStats(now)

  try {
    const parsed = JSON.parse(raw) as Partial<LifetimeLeaderboardStats>
    if (parsed.version !== 1) return defaultStats(now)

    return {
      ...defaultStats(now),
      ...parsed,
      version: 1,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : now,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
    }
  } catch {
    return defaultStats(now)
  }
}

export function applyLifetimeLeaderboardDelta(
  delta: LifetimeLeaderboardDelta,
): Promise<LifetimeLeaderboardStats> {
  writeChain = writeChain.then(async () => {
    const current = await loadLifetimeLeaderboardStats()
    const now = Date.now()

    const next: LifetimeLeaderboardStats = {
      ...current,
      gamesStarted: addNonNegative(current.gamesStarted, delta.gamesStarted),
      gamesCompleted: addNonNegative(current.gamesCompleted, delta.gamesCompleted),
      drinksTaken: addNonNegative(current.drinksTaken, delta.drinksTaken),
      correctGuesses: addNonNegative(current.correctGuesses, delta.correctGuesses),
      incorrectGuesses: addNonNegative(current.incorrectGuesses, delta.incorrectGuesses),
      updatedAt: now,
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  })

  return writeChain as Promise<LifetimeLeaderboardStats>
}

export async function resetLifetimeLeaderboardStats(): Promise<LifetimeLeaderboardStats> {
  const now = Date.now()
  const next = defaultStats(now)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function lifetimeCorrectGuessPercent(stats: LifetimeLeaderboardStats): number {
  const total = stats.correctGuesses + stats.incorrectGuesses
  return total === 0 ? 0 : (stats.correctGuesses / total) * 100
}

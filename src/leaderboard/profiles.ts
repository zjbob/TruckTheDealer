import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Action, GameState, Player } from '../game'

export type ProfileStats = {
  gamesStarted: number
  gamesCompleted: number
  drinksTaken: number
  correctGuesses: number
  incorrectGuesses: number
}

export type LeaderboardProfile = {
  key: string
  name: string
  createdAt: number
  updatedAt: number
  stats: ProfileStats
}

type LeaderboardStoreV1 = {
  version: 1
  createdAt: number
  updatedAt: number
  profiles: Record<
    string,
    {
      name: string
      createdAt: number
      updatedAt: number
      stats: ProfileStats
    }
  >
}

const STORAGE_KEY = 'truck-the-dealer:leaderboard:profiles:v1'

function defaultProfileStats(): ProfileStats {
  return {
    gamesStarted: 0,
    gamesCompleted: 0,
    drinksTaken: 0,
    correctGuesses: 0,
    incorrectGuesses: 0,
  }
}

function defaultStore(now: number): LeaderboardStoreV1 {
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    profiles: {},
  }
}

export function normalizeProfileName(name: string): string | undefined {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (!trimmed) return undefined
  return trimmed.toLowerCase()
}

function addNonNegative(current: number, delta: number | undefined): number {
  if (!delta) return current
  const next = current + delta
  return next < 0 ? 0 : next
}

let writeChain: Promise<unknown> = Promise.resolve()

export async function loadLeaderboardStore(): Promise<LeaderboardStoreV1> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  const now = Date.now()
  if (!raw) return defaultStore(now)

  try {
    const parsed = JSON.parse(raw) as Partial<LeaderboardStoreV1>
    if (parsed.version !== 1) return defaultStore(now)

    return {
      ...defaultStore(now),
      ...parsed,
      version: 1,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : now,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
      profiles: (parsed.profiles ?? {}) as any,
    }
  } catch {
    return defaultStore(now)
  }
}

async function saveStore(store: LeaderboardStoreV1) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function resetLeaderboardProfiles(): Promise<LeaderboardStoreV1> {
  const now = Date.now()
  const store = defaultStore(now)
  await saveStore(store)
  return store
}

export function correctGuessPercent(stats: Pick<ProfileStats, 'correctGuesses' | 'incorrectGuesses'>) {
  const total = stats.correctGuesses + stats.incorrectGuesses
  return total === 0 ? 0 : (stats.correctGuesses / total) * 100
}

export async function listLeaderboardProfiles(): Promise<LeaderboardProfile[]> {
  const store = await loadLeaderboardStore()
  const list: LeaderboardProfile[] = Object.entries(store.profiles).map(([key, value]) => ({
    key,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    stats: value.stats,
  }))

  list.sort((a, b) => {
    const pctB = correctGuessPercent(b.stats)
    const pctA = correctGuessPercent(a.stats)
    if (pctB !== pctA) return pctB - pctA
    if (b.stats.gamesStarted !== a.stats.gamesStarted) return b.stats.gamesStarted - a.stats.gamesStarted
    return b.updatedAt - a.updatedAt
  })

  return list
}

function ensureProfile(store: LeaderboardStoreV1, displayName: string, now: number) {
  const key = normalizeProfileName(displayName)
  if (!key) return

  const existing = store.profiles[key]
  if (!existing) {
    store.profiles[key] = {
      name: displayName.trim().replace(/\s+/g, ' '),
      createdAt: now,
      updatedAt: now,
      stats: defaultProfileStats(),
    }
    return
  }

  // Keep the most recently used capitalization/spelling.
  store.profiles[key] = {
    ...existing,
    name: displayName.trim().replace(/\s+/g, ' '),
  }
}

export function applyProfilesDelta(args: {
  byName: Array<{ name: string; delta: Partial<ProfileStats> }>
}): Promise<LeaderboardStoreV1> {
  writeChain = writeChain.then(async () => {
    const now = Date.now()
    const store = await loadLeaderboardStore()

    for (const item of args.byName) {
      const key = normalizeProfileName(item.name)
      if (!key) continue

      ensureProfile(store, item.name, now)
      const profile = store.profiles[key]
      if (!profile) continue

      profile.stats = {
        ...profile.stats,
        gamesStarted: addNonNegative(profile.stats.gamesStarted, item.delta.gamesStarted),
        gamesCompleted: addNonNegative(profile.stats.gamesCompleted, item.delta.gamesCompleted),
        drinksTaken: addNonNegative(profile.stats.drinksTaken, item.delta.drinksTaken),
        correctGuesses: addNonNegative(profile.stats.correctGuesses, item.delta.correctGuesses),
        incorrectGuesses: addNonNegative(profile.stats.incorrectGuesses, item.delta.incorrectGuesses),
      }
      profile.updatedAt = now
    }

    store.updatedAt = now
    await saveStore(store)
    return store
  })

  return writeChain as Promise<LeaderboardStoreV1>
}

export function recordGameCompletedFromState(state: GameState) {
  const names = state.players.map(p => p.name)
  void applyProfilesDelta({
    byName: names.map(name => ({ name, delta: { gamesCompleted: 1 } })),
  })
}

function playerNameById(players: Player[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of players) map[p.id] = p.name
  return map
}

export function recordProfilesFromTransition(
  prevState: GameState | undefined,
  action: Action,
  nextState: GameState,
) {
  if (!prevState && action.type === 'START_GAME') {
    const names = action.players.map(p => p.name)
    void applyProfilesDelta({
      byName: names.map(name => ({ name, delta: { gamesStarted: 1 } })),
    })
    return
  }

  if (prevState && action.type === 'SUBMIT_GUESS') {
    const prevNameById = playerNameById(prevState.players)
    const nextNameById = playerNameById(nextState.players)

    const deltas: Array<{ name: string; delta: Partial<ProfileStats> }> = []

    for (const p of nextState.players) {
      const prevStats = prevState.playerStats[p.id] ?? {
        drinksTaken: 0,
        correctGuesses: 0,
        incorrectGuesses: 0,
      }
      const nextStats = nextState.playerStats[p.id] ?? {
        drinksTaken: 0,
        correctGuesses: 0,
        incorrectGuesses: 0,
      }

      const drinksDelta = nextStats.drinksTaken - prevStats.drinksTaken
      const correctDelta = nextStats.correctGuesses - prevStats.correctGuesses
      const incorrectDelta = nextStats.incorrectGuesses - prevStats.incorrectGuesses

      if (!drinksDelta && !correctDelta && !incorrectDelta) continue

      // Prefer the next state's name; fall back to previous if needed.
      const name = nextNameById[p.id] ?? prevNameById[p.id] ?? p.name
      deltas.push({
        name,
        delta: {
          drinksTaken: drinksDelta,
          correctGuesses: correctDelta,
          incorrectGuesses: incorrectDelta,
        },
      })
    }

    if (deltas.length > 0) {
      void applyProfilesDelta({ byName: deltas })
    }
  }
}

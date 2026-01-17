import type { Action, GameState } from '../game'
import { applyLifetimeLeaderboardDelta } from './storage'

function sumPlayerStats(state: GameState): {
  drinksTaken: number
  correctGuesses: number
  incorrectGuesses: number
} {
  let drinksTaken = 0
  let correctGuesses = 0
  let incorrectGuesses = 0

  for (const p of state.players) {
    const s = state.playerStats[p.id]
    if (!s) continue
    drinksTaken += s.drinksTaken
    correctGuesses += s.correctGuesses
    incorrectGuesses += s.incorrectGuesses
  }

  return { drinksTaken, correctGuesses, incorrectGuesses }
}

export function recordLifetimeFromTransition(
  prevState: GameState | undefined,
  action: Action,
  nextState: GameState,
) {
  // Game start.
  if (!prevState && action.type === 'START_GAME') {
    void applyLifetimeLeaderboardDelta({ gamesStarted: 1 })
    return
  }

  // Guess result changes per-player counters. Use a diff so it stays correct even if the rules change.
  if (prevState && action.type === 'SUBMIT_GUESS') {
    const prevTotals = sumPlayerStats(prevState)
    const nextTotals = sumPlayerStats(nextState)

    const drinksDelta = nextTotals.drinksTaken - prevTotals.drinksTaken
    const correctDelta = nextTotals.correctGuesses - prevTotals.correctGuesses
    const incorrectDelta = nextTotals.incorrectGuesses - prevTotals.incorrectGuesses

    if (drinksDelta || correctDelta || incorrectDelta) {
      void applyLifetimeLeaderboardDelta({
        drinksTaken: drinksDelta,
        correctGuesses: correctDelta,
        incorrectGuesses: incorrectDelta,
      })
    }
  }
}

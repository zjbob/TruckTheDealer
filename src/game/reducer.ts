import { createStandardDeck, rankLabel } from '../engine/cards'
import { createRng } from '../engine/rng'
import { shuffleInPlace } from '../engine/shuffle'
import type {
  Action,
  GameConfig,
  GameState,
  Player,
  PlayerStats,
  Prompt,
  ReducerResult,
} from './types'

const DEFAULT_CONFIG: GameConfig = {
  punishmentText: 'Group punishment (configurable)',
  wrongStreakToChangeDealer: 3,
  correctStreakForShot: 5,
  correctStreakForPunishment: 7,
  resetCorrectStreakAfterPunishment: true,
}

/**
 * Validates the starting player list against the game's supported range and data shape.
 */
function assertPlayers(players: Player[]) {
  if (players.length < 2 || players.length > 8) {
    throw new Error('Truck the Dealer supports 2–8 players')
  }
  for (const p of players) {
    if (!p.id || !p.name) throw new Error('Each player needs id + name')
  }
}

/**
 * Builds the table piles for each rank (Ace low = 1 through King = 13).
 */
function buildEmptyTableByRank() {
  const tableByRank: GameState['tableByRank'] = {} as GameState['tableByRank']
  for (let rank = 1; rank <= 13; rank++) {
    tableByRank[rank] = { rank: rank as any, cards: [], isComplete: false }
  }
  return tableByRank
}

function buildInitialPlayerStats(players: Player[]): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {}
  for (const p of players) {
    stats[p.id] = { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
  }
  return stats
}

function withUpdatedPlayerStats(
  playerStats: GameState['playerStats'],
  playerId: string,
  patch: Partial<PlayerStats>,
): GameState['playerStats'] {
  const current = playerStats[playerId] ?? { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
  return {
    ...playerStats,
    [playerId]: {
      drinksTaken: patch.drinksTaken ?? current.drinksTaken,
      correctGuesses: patch.correctGuesses ?? current.correctGuesses,
      incorrectGuesses: patch.incorrectGuesses ?? current.incorrectGuesses,
    },
  }
}

/**
 * Advances an index by one, wrapping around the players list.
 */
function nextIndexCircular(current: number, count: number): number {
  return (current + 1) % count
}

/**
 * Finds the next guesser index, ensuring the dealer is never the guesser.
 */
function nextGuesserIndex(playersCount: number, dealerIndex: number, fromIndex: number): number {
  let idx = nextIndexCircular(fromIndex, playersCount)
  if (idx === dealerIndex) idx = nextIndexCircular(idx, playersCount)
  return idx
}

/**
 * Ensures `peekedCard` is set to the next card to be guessed.
 * If the deck is empty, reshuffles a fresh deck and shows an informational prompt.
 */
function drawPeekedCard(state: GameState): GameState {
  if (state.deck.length === 0) {
    const rng = createRng(state.seed + state.turn + 1)
    const deck = shuffleInPlace(createStandardDeck(), rng)
    return {
      ...state,
      deck,
      tableByRank: buildEmptyTableByRank(),
      pendingPrompts: [{ type: 'INFO', text: 'Deck reshuffled.' }],
      phase: 'prompt',
      peekedCard: deck[0],
    }
  }

  return {
    ...state,
    peekedCard: state.deck[0],
  }
}

/**
 * Moves the game into the dealer peek phase for the next card.
 */
function beginDealerPeek(state: GameState): GameState {
  return drawPeekedCard({
    ...state,
    phase: 'dealerPeek',
    pendingPrompts: [],
    peekedCard: undefined,
  })
}

/**
 * Advances to the next guesser or rotates the dealer if the wrong-streak threshold was hit.
 * This is called after all prompts for a guess have been acknowledged.
 */
function resolvePromptsAndAdvanceIfDone(state: GameState): GameState {
  if (state.pendingPrompts.length > 0) return state

  // Dealer rotates after N wrong-in-a-row.
  if (state.wrongStreak >= state.config.wrongStreakToChangeDealer) {
    const newDealerIndex = nextIndexCircular(state.dealerIndex, state.players.length)
    const newGuesserIndex = nextGuesserIndex(state.players.length, newDealerIndex, newDealerIndex)

    return beginDealerPeek({
      ...state,
      dealerIndex: newDealerIndex,
      guesserIndex: newGuesserIndex,
      correctStreak: 0,
      wrongStreak: 0,
      turn: state.turn + 1,
    })
  }

  // Otherwise advance guesser (skip dealer).
  const newGuesserIndex = nextGuesserIndex(
    state.players.length,
    state.dealerIndex,
    state.guesserIndex,
  )

  return beginDealerPeek({
    ...state,
    guesserIndex: newGuesserIndex,
    turn: state.turn + 1,
  })
}

/**
 * Pure reducer for Truck the Dealer.
 *
 * Intended usage pattern:
 * - UI dispatches Actions
 * - Reducer returns next immutable state + a prompt queue for the UI to show
 *
 * Keeping this deterministic makes pass-and-play easy now and multiplayer easy later.
 */
export function reduce(state: GameState | undefined, action: Action): ReducerResult {
  if (!state) {
    if (action.type !== 'START_GAME') throw new Error('First action must be START_GAME')

    const players = action.players
    assertPlayers(players)

    const seed = action.seed ?? Date.now()
    const rng = createRng(seed)
    const deck = shuffleInPlace(createStandardDeck(), rng)

    const dealerIndex = action.dealerIndex ?? rng.nextInt(players.length)
    const guesserIndex = nextGuesserIndex(players.length, dealerIndex, dealerIndex)

    const config: GameConfig = {
      ...DEFAULT_CONFIG,
      ...action.config,
    }

    const leaderId = action.leaderId ?? players[0].id

    const started = beginDealerPeek({
      players,
      leaderId,
      playerStats: buildInitialPlayerStats(players),
      dealerIndex,
      guesserIndex,
      deck,
      tableByRank: buildEmptyTableByRank(),
      correctStreak: 0,
      wrongStreak: 0,
      phase: 'dealerPeek',
      pendingPrompts: [],
      config,
      seed,
      turn: 0,
      peekedCard: undefined,
    })

    return {
      state: started,
      currentPrompt: started.pendingPrompts[0],
    }
  }

  switch (action.type) {
    case 'START_GAME': {
      // If the UI wants a hard reset mid-session, it can pass state=undefined.
      // Keeping this branch explicit avoids surprising resets.
      return { state, currentPrompt: state.pendingPrompts[0] }
    }

    case 'CONFIRM_DEALER_PEEK': {
      if (state.phase !== 'dealerPeek') return { state, currentPrompt: state.pendingPrompts[0] }
      return {
        state: { ...state, phase: 'guess' },
        currentPrompt: state.pendingPrompts[0],
      }
    }

    case 'SUBMIT_GUESS': {
      if (state.phase !== 'guess') return { state, currentPrompt: state.pendingPrompts[0] }
      if (!state.peekedCard) throw new Error('No peeked card')

      const isCorrect = action.guess === state.peekedCard.rank

      const correctStreak = isCorrect ? state.correctStreak + 1 : 0
      const wrongStreak = isCorrect ? 0 : state.wrongStreak + 1

      // Reveal the peeked card to the table.
      const revealed = state.peekedCard
      const deck = state.deck.slice(1)

      const pile = state.tableByRank[revealed.rank]
      const nextCards = pile.cards.concat(revealed)
      const nextPile = {
        ...pile,
        cards: nextCards,
        isComplete: nextCards.length >= 4,
      }

      const tableByRank = {
        ...state.tableByRank,
        [revealed.rank]: nextPile,
      }

      const dealer = state.players[state.dealerIndex]
      const guesser = state.players[state.guesserIndex]

      // Update player statistics.
      let playerStats = state.playerStats
      if (isCorrect) {
        // Guesser got it right; dealer drinks.
        const guesserStats = playerStats[guesser.id] ?? { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
        playerStats = withUpdatedPlayerStats(playerStats, guesser.id, {
          correctGuesses: guesserStats.correctGuesses + 1,
        })

        const dealerStats = playerStats[dealer.id] ?? { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
        playerStats = withUpdatedPlayerStats(playerStats, dealer.id, {
          drinksTaken: dealerStats.drinksTaken + 1,
        })
      } else {
        // Guesser got it wrong; guesser drinks.
        const guesserStats = playerStats[guesser.id] ?? { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
        playerStats = withUpdatedPlayerStats(playerStats, guesser.id, {
          incorrectGuesses: guesserStats.incorrectGuesses + 1,
          drinksTaken: guesserStats.drinksTaken + 1,
        })
      }

      const prompts: Prompt[] = []
      prompts.push({
        type: 'RESULT',
        text: isCorrect
          ? `GOOD ANSWER — ${dealer.name} drinks.`
          : `WRONG — it was ${rankLabel(revealed.rank)}. ${guesser.name} drinks.`,
      })

      if (correctStreak === state.config.correctStreakForShot) {
        prompts.push({ type: 'SHOT', text: `${dealer.name} takes a shot.` })

        const dealerStats = playerStats[dealer.id] ?? { drinksTaken: 0, correctGuesses: 0, incorrectGuesses: 0 }
        playerStats = withUpdatedPlayerStats(playerStats, dealer.id, {
          drinksTaken: dealerStats.drinksTaken + 1,
        })
      }

      if (correctStreak === state.config.correctStreakForPunishment) {
        prompts.push({
          type: 'PUNISHMENT',
          text: state.config.punishmentText || 'Punishment',
        })
      }

      if (wrongStreak === state.config.wrongStreakToChangeDealer) {
        const nextDealer = state.players[nextIndexCircular(state.dealerIndex, state.players.length)]
        prompts.push({ type: 'INFO', text: `Dealer changes to ${nextDealer.name}.` })
      }

      return {
        state: {
          ...state,
          deck,
          tableByRank,
          peekedCard: undefined,
          correctStreak,
          wrongStreak,
          phase: 'prompt',
          pendingPrompts: prompts,
          playerStats,
        },
        currentPrompt: prompts[0],
      }
    }

    case 'ACK_PROMPT': {
      if (state.phase !== 'prompt') return { state, currentPrompt: state.pendingPrompts[0] }
      if (state.pendingPrompts.length === 0) {
        const advanced = resolvePromptsAndAdvanceIfDone(state)
        return { state: advanced, currentPrompt: advanced.pendingPrompts[0] }
      }

      const [shown, ...rest] = state.pendingPrompts

      let nextState: GameState = {
        ...state,
        pendingPrompts: rest,
      }

      if (shown.type === 'PUNISHMENT' && state.config.resetCorrectStreakAfterPunishment) {
        nextState = { ...nextState, correctStreak: 0 }
      }

      // If we just cleared the last prompt, advance turn/dealer.
      if (rest.length === 0) {
        nextState = resolvePromptsAndAdvanceIfDone({ ...nextState, pendingPrompts: [] })
      }

      return { state: nextState, currentPrompt: nextState.pendingPrompts[0] }
    }

    default: {
      const _exhaustive: never = action
      return { state, currentPrompt: state.pendingPrompts[0] }
    }
  }
}

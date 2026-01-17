import type { Card, Rank } from '../engine/cards'

export type Player = {
  id: string
  name: string
}

export type Phase = 'dealerPeek' | 'guess' | 'prompt'

export type Guess = Rank

export type PlayerStats = {
  drinksTaken: number
  correctGuesses: number
  incorrectGuesses: number
}

export type Prompt =
  | {
      type: 'RESULT'
      text: string
    }
  | {
      type: 'SHOT'
      text: string
    }
  | {
      type: 'PUNISHMENT'
      text: string
    }
  | {
      type: 'INFO'
      text: string
    }

export type TableRankPile = {
  rank: Rank
  cards: Card[]
  isComplete: boolean
}

export type GameConfig = {
  punishmentText: string
  wrongStreakToChangeDealer: number // default 3
  correctStreakForShot: number // default 5
  correctStreakForPunishment: number // default 7
  resetCorrectStreakAfterPunishment: boolean // default true
}

export type GameState = {
  players: Player[]
  leaderId: string

  playerStats: Record<string, PlayerStats>

  dealerIndex: number
  guesserIndex: number

  deck: Card[]
  tableByRank: Record<number, TableRankPile> // 1..13

  peekedCard?: Card

  correctStreak: number
  wrongStreak: number

  phase: Phase
  pendingPrompts: Prompt[]

  config: GameConfig

  // Mainly for debugging and later multiplayer reconciliation.
  seed: number
  turn: number
}

export type Action =
  | {
      type: 'START_GAME'
      players: Player[]
      leaderId?: string
      config?: Partial<GameConfig>
      seed?: number
      dealerIndex?: number
    }
  | {
      type: 'CONFIRM_DEALER_PEEK'
    }
  | {
      type: 'SUBMIT_GUESS'
      guess: Guess
    }
  | {
      type: 'ACK_PROMPT'
    }

export type ReducerResult = {
  state: GameState
  // Convenience: the next prompt UI should show (if any).
  currentPrompt?: Prompt
}

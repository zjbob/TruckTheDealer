export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export type Rank =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13

export type Card = {
  rank: Rank
  suit: Suit
}

export const SUITS: readonly Suit[] = [
  'hearts',
  'diamonds',
  'clubs',
  'spades',
] as const

export const RANKS: readonly Rank[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const

/**
 * Creates a standard 52-card deck in deterministic rank-then-suit order.
 * (Shuffle separately when starting a game.)
 */
export function createStandardDeck(): Card[] {
  const deck: Card[] = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/**
 * Returns true when two cards have the same rank and suit.
 */
export function cardEquals(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

/**
 * Converts a numeric rank to its short label (A, 2..10, J, Q, K).
 */
export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 1:
      return 'A'
    case 11:
      return 'J'
    case 12:
      return 'Q'
    case 13:
      return 'K'
    default:
      return String(rank)
  }
}

/**
 * Converts a suit to a single-character symbol.
 */
export function suitLabel(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
  }
}

/**
 * Converts a card to a compact display label (e.g. "Q♠").
 */
export function cardLabel(card: Card): string {
  return `${rankLabel(card.rank)}${suitLabel(card.suit)}`
}

export type LifetimeLeaderboardStats = {
  version: 1
  createdAt: number
  updatedAt: number

  gamesStarted: number
  gamesCompleted: number
  drinksTaken: number
  correctGuesses: number
  incorrectGuesses: number
}

export type LifetimeLeaderboardDelta = Partial<
  Pick<
    LifetimeLeaderboardStats,
    | 'gamesStarted'
    | 'gamesCompleted'
    | 'drinksTaken'
    | 'correctGuesses'
    | 'incorrectGuesses'
  >
>

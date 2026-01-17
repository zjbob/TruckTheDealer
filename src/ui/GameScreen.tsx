import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Action, GameState } from '../game'
import { cardLabel, type Rank } from '../engine/cards'
import { TableView } from './components/TableView'

type Props = {
  state: GameState
  dispatch: (action: Action) => void
  onReset: () => void
}

export function GameScreen({ state, dispatch, onReset }: Props) {
  const dealer = state.players[state.dealerIndex]
  const guesser = state.players[state.guesserIndex]

  const [dealerReveal, setDealerReveal] = useState(false)
  const [guess, setGuess] = useState<Rank | undefined>(undefined)
  const [statsDockHeight, setStatsDockHeight] = useState(0)
  const [statsVisible, setStatsVisible] = useState(true)

  useEffect(() => {
    if (state.phase !== 'dealerPeek') setDealerReveal(false)
    if (state.phase !== 'guess') setGuess(undefined)
  }, [state.phase])

  const header = useMemo(() => {
    return `Dealer: ${dealer.name}  •  Guesser: ${guesser.name}`
  }, [dealer.name, guesser.name])

  const prompt = state.pendingPrompts[0]

  const statsRows = useMemo(() => {
    return state.players.map(p => {
      const stats = state.playerStats[p.id] ?? {
        drinksTaken: 0,
        correctGuesses: 0,
        incorrectGuesses: 0,
      }
      const total = stats.correctGuesses + stats.incorrectGuesses
      const pct = total === 0 ? 0 : (stats.correctGuesses / total) * 100

      return {
        playerId: p.id,
        name: p.name,
        drinksTaken: stats.drinksTaken,
        correctGuesses: stats.correctGuesses,
        incorrectGuesses: stats.incorrectGuesses,
        correctPctText: `${pct.toFixed(0)}%`,
      }
    })
  }, [state.players, state.playerStats])

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + statsDockHeight }]}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.topRow}>
        <Text style={styles.header}>{header}</Text>
        <Pressable style={styles.reset} onPress={onReset}>
          <Text style={styles.resetText}>New game</Text>
        </Pressable>
      </View>

      {state.phase === 'dealerPeek' ? (
        <View style={styles.card}>
          <Text style={styles.phaseTitle}>{dealer.name} the Dealer, peek</Text>
          <Text style={styles.phaseHint}>Dealer only: tap to reveal, then tap again to pass the phone</Text>

          <Pressable
            style={styles.primary}
            onPress={() => {
              if (!dealerReveal) {
                setDealerReveal(true)
                return
              }
              dispatch({ type: 'CONFIRM_DEALER_PEEK' })
            }}
          >
            <Text style={styles.primaryText}>{dealerReveal ? 'Done (pass phone)' : 'Reveal card'}</Text>
          </Pressable>

          {dealerReveal && state.peekedCard ? (
            <View style={styles.revealBox}>
              <Text style={styles.revealText}>{cardLabel(state.peekedCard)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {state.phase === 'guess' ? (
        <View style={styles.card}>
          <Text style={styles.phaseTitle}>{guesser.name}, tap a rank on the table</Text>
          <Text style={styles.phaseHint}>Selected: {guess ? guess : '—'}</Text>

          <Pressable
            style={[styles.primary, !guess && styles.disabled]}
            disabled={!guess}
            onPress={() => {
              if (!guess) return
              dispatch({ type: 'SUBMIT_GUESS', guess })
            }}
          >
            <Text style={styles.primaryText}>Submit guess</Text>
          </Pressable>
        </View>
      ) : null}

      {state.phase === 'prompt' ? (
        <View style={styles.card}>
          <Text style={styles.phaseTitle}>Result</Text>
          <Text style={styles.promptText}>{prompt?.text ?? ''}</Text>

          <Pressable style={styles.primary} onPress={() => dispatch({ type: 'ACK_PROMPT' })}>
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
      ) : null}

      <TableView
        state={state}
        selectedRank={guess}
        onRankPress={state.phase === 'guess' ? setGuess : undefined}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Correct streak: {state.correctStreak}</Text>
        <Text style={styles.footerText}>Wrong streak: {state.wrongStreak}</Text>
        <Text style={styles.footerText}>Turn: {state.turn}</Text>
      </View>

      </ScrollView>

      <View
        style={styles.statsDock}
        onLayout={e => {
          const height = e.nativeEvent.layout.height
          if (height !== statsDockHeight) setStatsDockHeight(height)
        }}
      >
        {statsVisible ? (
          <View style={styles.statsCard}>
            <View style={styles.statsHeaderRow}>
              <Text style={styles.phaseTitle}>Stats</Text>
              <Pressable style={styles.statsToggleButton} onPress={() => setStatsVisible(false)}>
                <Text style={styles.statsToggleButtonText}>Hide</Text>
              </Pressable>
            </View>

            <Text style={[styles.phaseHint, styles.statsColumnsHint]}>
              <Text style={styles.statsDrink}>Drinks</Text>
              <Text style={styles.statsSeparator}> • </Text>
              <Text style={styles.statsCorrect}>Correct</Text>
              <Text style={styles.statsSeparator}> • </Text>
              <Text style={styles.statsIncorrect}>Incorrect</Text>
              <Text style={styles.statsSeparator}> • </Text>
              <Text>Correct %</Text>
            </Text>

            <View style={styles.statsList}>
              {statsRows.map(row => (
                <View key={row.playerId} style={styles.statsRow}>
                  <Text style={styles.statsName}>{row.name}</Text>
                  <Text style={styles.statsValues}>
                    <Text style={styles.statsDrink}>{row.drinksTaken}</Text>
                    <Text style={styles.statsSeparator}> • </Text>
                    <Text style={styles.statsCorrect}>{row.correctGuesses}</Text>
                    <Text style={styles.statsSeparator}> • </Text>
                    <Text style={styles.statsIncorrect}>{row.incorrectGuesses}</Text>
                    <Text style={styles.statsSeparator}> • </Text>
                    <Text>{row.correctPctText}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Pressable style={styles.showStatsButton} onPress={() => setStatsVisible(true)}>
            <Text style={styles.showStatsButtonText}>Show stats</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  header: {
    flex: 1,
    color: '#cfe0f7',
    fontWeight: '800',
  },
  reset: {
    backgroundColor: '#223146',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetText: {
    color: '#f2f6ff',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#121a24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2b3a',
    marginBottom: 14,
  },
  statsDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#121a24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsToggleButton: {
    backgroundColor: '#223146',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsToggleButtonText: {
    color: '#f2f6ff',
    fontWeight: '900',
  },
  showStatsButton: {
    backgroundColor: '#223146',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  showStatsButtonText: {
    color: '#f2f6ff',
    fontWeight: '900',
    fontSize: 16,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f2f6ff',
  },
  phaseHint: {
    marginTop: 6,
    color: '#9fb0c5',
    fontWeight: '600',
  },
  primary: {
    marginTop: 14,
    backgroundColor: '#4a7dff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#08101a',
    fontWeight: '900',
    fontSize: 16,
  },
  secondary: {
    marginTop: 12,
    backgroundColor: '#223146',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#f2f6ff',
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.45,
  },
  revealBox: {
    marginTop: 14,
    backgroundColor: '#0b0f14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2b3a',
    paddingVertical: 18,
    alignItems: 'center',
  },
  revealText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#f2f6ff',
  },
  promptText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#f2f6ff',
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerText: {
    color: '#9fb0c5',
    fontWeight: '700',
    marginBottom: 8,
  },

  statsList: {
    marginTop: 12,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsName: {
    flex: 1,
    color: '#f2f6ff',
    fontWeight: '900',
  },
  statsValues: {
    color: '#cfe0f7',
    fontWeight: '800',
  },

  statsSeparator: {
    color: '#9fb0c5',
  },
  statsDrink: {
    color: '#0080ff',
  },
  statsCorrect: {
    color: '#57e389',
  },
  statsIncorrect: {
    color: '#ff6b6b',
  },

  statsColumnsHint: {
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
})

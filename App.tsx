import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { reduce, type Action, type GameState } from './src/game'
import { GameScreen, SetupScreen } from './src/ui'
import { recordGameCompletedFromState, recordProfilesFromTransition } from './src/leaderboard'

export default function App() {
  const [state, setState] = useState<GameState | undefined>(undefined)

  const dispatch = useCallback((action: Action) => {
    setState(prev => {
      const next = reduce(prev, action).state
      recordProfilesFromTransition(prev, action, next)
      return next
    })
  }, [])

  const resetGame = useCallback(() => {
    setState(prev => {
      if (prev) recordGameCompletedFromState(prev)
      return undefined
    })
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        {!state ? (
          <SetupScreen
            onStart={({ players, punishmentText }) =>
              dispatch({
                type: 'START_GAME',
                players,
                config: { punishmentText },
              })
            }
          />
        ) : (
          <GameScreen state={state} dispatch={dispatch} onReset={resetGame} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
})

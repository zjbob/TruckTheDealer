import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  correctGuessPercent,
  listLeaderboardProfiles,
  resetLeaderboardProfiles,
  type LeaderboardProfile,
} from '../leaderboard'

type Props = {
  onClose: () => void
}

export function LeaderboardScreen({ onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<LeaderboardProfile[]>([])
  const [resetting, setResetting] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const list = await listLeaderboardProfiles()
      setProfiles(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const rows = useMemo(() => {
    return profiles.map(p => {
      const pct = correctGuessPercent(p.stats)
      return {
        key: p.key,
        name: p.name,
        gamesStarted: p.stats.gamesStarted,
        gamesCompleted: p.stats.gamesCompleted,
        drinksTaken: p.stats.drinksTaken,
        correctGuesses: p.stats.correctGuesses,
        incorrectGuesses: p.stats.incorrectGuesses,
        pctText: `${pct.toFixed(0)}%`,
      }
    })
  }, [profiles])

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Leaderboard</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Per-name stats saved on this device</Text>

      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.smallButton, resetting && styles.buttonDisabled]}
          disabled={resetting}
          onPress={async () => {
            setResetting(true)
            try {
              await resetLeaderboardProfiles()
              await refresh()
            } finally {
              setResetting(false)
            }
          }}
        >
          <Text style={styles.smallButtonText}>Reset all</Text>
        </Pressable>

        <Pressable
          style={styles.smallButton}
          onPress={() => {
            void refresh()
          }}
        >
          <Text style={styles.smallButtonText}>Refresh</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No profiles yet.</Text>
          <Text style={styles.emptyHint}>Start a game to create names.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.columnsHint}>
            Games started • completed • drinks • correct • wrong • %
          </Text>

          {rows.map(r => (
            <View key={r.key} style={styles.rowCard}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.values}>
                <Text style={styles.valueMuted}>{r.gamesStarted}</Text>
                <Text style={styles.sep}> • </Text>
                <Text style={styles.valueMuted}>{r.gamesCompleted}</Text>
                <Text style={styles.sep}> • </Text>
                <Text style={styles.valueDrink}>{r.drinksTaken}</Text>
                <Text style={styles.sep}> • </Text>
                <Text style={styles.valueCorrect}>{r.correctGuesses}</Text>
                <Text style={styles.sep}> • </Text>
                <Text style={styles.valueWrong}>{r.incorrectGuesses}</Text>
                <Text style={styles.sep}> • </Text>
                <Text style={styles.valueMuted}>{r.pctText}</Text>
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f14',
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f2f6ff',
  },
  subtitle: {
    marginTop: 6,
    color: '#9fb0c5',
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#223146',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#f2f6ff',
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#223146',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  smallButtonText: {
    color: '#f2f6ff',
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loading: {
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#9fb0c5',
    fontWeight: '700',
  },
  empty: {
    marginTop: 34,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    color: '#f2f6ff',
    fontWeight: '900',
    fontSize: 18,
  },
  emptyHint: {
    color: '#9fb0c5',
    fontWeight: '700',
  },
  list: {
    paddingBottom: 20,
    gap: 10,
  },
  columnsHint: {
    color: '#9fb0c5',
    fontWeight: '700',
    alignSelf: 'flex-end',
  },
  rowCard: {
    backgroundColor: '#121a24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  name: {
    color: '#f2f6ff',
    fontWeight: '900',
    fontSize: 18,
  },
  values: {
    marginTop: 8,
    color: '#cfe0f7',
    fontWeight: '800',
  },
  sep: {
    color: '#9fb0c5',
  },
  valueMuted: {
    color: '#cfe0f7',
  },
  valueDrink: {
    color: '#0080ff',
  },
  valueCorrect: {
    color: '#57e389',
  },
  valueWrong: {
    color: '#ff6b6b',
  },
})

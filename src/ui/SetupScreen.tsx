import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import type { Player } from '../game'
import { listLeaderboardProfiles } from '../leaderboard'
import { LeaderboardScreen } from './LeaderboardScreen'
import { ProfilePickerModal } from './components/ProfilePickerModal'

type StartArgs = {
  players: Player[]
  punishmentText: string
}

type Props = {
  onStart: (args: StartArgs) => void
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 8

function createPlayer(index: number): Player {
  return {
    id: `p_${Date.now()}_${index}`,
    name: '',
  }
}

export function SetupScreen({ onStart }: Props) {
  const [players, setPlayers] = useState<Player[]>(() => [createPlayer(0), createPlayer(1)])
  const [punishmentText, setPunishmentText] = useState('Bottoms up!')
  const [leaderboardVisible, setLeaderboardVisible] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerTargetId, setPickerTargetId] = useState<string | undefined>(undefined)
  const [savedNames, setSavedNames] = useState<string[]>([])

  const canAdd = players.length < MAX_PLAYERS
  const canRemove = players.length > MIN_PLAYERS

  const isValid = useMemo(() => {
    if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) return false
    return players.every(p => p.name.trim().length > 0)
  }, [players])

  useEffect(() => {
    // Load saved profile names for the Smash-style picker.
    void (async () => {
      const profiles = await listLeaderboardProfiles()
      setSavedNames(profiles.map(p => p.name))
    })()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Truck the Dealer</Text>
      <Text style={styles.subtitle}>Pass-and-play</Text>

      <View style={[styles.row, styles.topButtonsRow]}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => {
            setLeaderboardVisible(true)
          }}
        >
          <Text style={styles.smallButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={async () => {
            const profiles = await listLeaderboardProfiles()
            setSavedNames(profiles.map(p => p.name))
          }}
        >
          <Text style={styles.smallButtonText}>Refresh names</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add up to {MAX_PLAYERS} players!</Text>

        {players.map((player, idx) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerLabel}>#{idx + 1}</Text>
            <TextInput
              value={player.name}
              onChangeText={text => {
                setPlayers(prev =>
                  prev.map(p => (p.id === player.id ? { ...p, name: text } : p)),
                )
              }}
              placeholder={`Player ${idx + 1} name`}
              placeholderTextColor="#666"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.pickButton}
              onPress={() => {
                setPickerTargetId(player.id)
                setPickerVisible(true)
              }}
            >
              <Text style={styles.pickButtonText}>Pick</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.smallButton, !canAdd && styles.buttonDisabled]}
            disabled={!canAdd}
            onPress={() => setPlayers(prev => prev.concat(createPlayer(prev.length)))}
          >
            <Text style={styles.smallButtonText}>+ Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, !canRemove && styles.buttonDisabled]}
            disabled={!canRemove}
            onPress={() => setPlayers(prev => prev.slice(0, -1))}
          >
            <Text style={styles.smallButtonText}>- Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Punishment (7 correct)</Text>
        <TextInput
          value={punishmentText}
          onChangeText={setPunishmentText}
          placeholder="Enter punishment"
          placeholderTextColor="#666"
          style={[styles.input, styles.multiline]}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !isValid && styles.buttonDisabled]}
        disabled={!isValid}
        onPress={() => onStart({ players, punishmentText })}
      >
        <Text style={styles.primaryButtonText}>Start Game</Text>
      </TouchableOpacity>

      {!isValid ? (
        <Text style={styles.hint}>Add at least 2 players and fill their names</Text>
      ) : null}

      <Modal visible={leaderboardVisible} animationType="slide" onRequestClose={() => setLeaderboardVisible(false)}>
        <LeaderboardScreen onClose={() => setLeaderboardVisible(false)} />
      </Modal>

      <ProfilePickerModal
        visible={pickerVisible}
        title="Choose a saved name"
        names={savedNames}
        onClose={() => setPickerVisible(false)}
        onPick={name => {
          if (!pickerTargetId) return
          setPlayers(prev => prev.map(p => (p.id === pickerTargetId ? { ...p, name } : p)))
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#0b0f14',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f2f6ff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9fb0c5',
    marginTop: 6,
    marginBottom: 18,
  },
  section: {
    backgroundColor: '#121a24',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cfe0f7',
    marginBottom: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  playerLabel: {
    width: 34,
    textAlign: 'center',
    fontWeight: '700',
    color: '#9fb0c5',
  },
  input: {
    flex: 1,
    backgroundColor: '#0b0f14',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f2f6ff',
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  pickButton: {
    backgroundColor: '#223146',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  pickButtonText: {
    color: '#f2f6ff',
    fontWeight: '900',
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  topButtonsRow: {
    marginBottom: 14,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#223146',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#f2f6ff',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#4a7dff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#08101a',
    fontWeight: '900',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  hint: {
    marginTop: 10,
    color: '#9fb0c5',
    textAlign: 'center',
  },
})

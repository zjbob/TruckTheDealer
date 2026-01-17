import { useMemo } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
  visible: boolean
  title: string
  names: string[]
  onClose: () => void
  onPick: (name: string) => void
}

export function ProfilePickerModal({ visible, title, names, onClose, onPick }: Props) {
  const rows = useMemo(() => {
    const unique = Array.from(new Set(names.map(n => n.trim()).filter(Boolean)))
    unique.sort((a, b) => a.localeCompare(b))
    return unique
  }, [names])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>

        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved names yet.</Text>
            <Text style={styles.emptyHint}>Play a game to create profiles.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {rows.map(name => (
              <Pressable
                key={name}
                style={styles.row}
                onPress={() => {
                  onPick(name)
                  onClose()
                }}
              >
                <Text style={styles.rowText}>{name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
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
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f2f6ff',
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
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
  },
  row: {
    backgroundColor: '#121a24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2b3a',
  },
  rowText: {
    color: '#f2f6ff',
    fontWeight: '900',
    fontSize: 18,
  },
})

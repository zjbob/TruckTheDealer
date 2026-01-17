import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Rank } from '../../engine/cards'
import { RANKS, rankLabel } from '../../engine/cards'

type Props = {
  selected?: Rank
  onChange: (rank: Rank) => void
}

export function GuessPicker({ selected, onChange }: Props) {
  const selectedRank = selected

  const rankButtons = useMemo(
    () =>
      RANKS.map(rank => {
        const isSelected = rank === selectedRank
        return (
          <Pressable
            key={rank}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onChange(rank)}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{rankLabel(rank)}</Text>
          </Pressable>
        )
      }),
    [onChange, selectedRank],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rank</Text>
      <View style={styles.wrap}>{rankButtons}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  label: {
    fontWeight: '700',
    color: '#cfe0f7',
    marginBottom: 8,
  },
  labelSpacer: {
    marginTop: 12,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0b0f14',
    borderWidth: 1,
    borderColor: '#1f2b3a',
    minWidth: 44,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#4a7dff',
    borderColor: '#4a7dff',
  },
  pillText: {
    color: '#f2f6ff',
    fontWeight: '800',
  },
  pillTextSelected: {
    color: '#08101a',
  },
})

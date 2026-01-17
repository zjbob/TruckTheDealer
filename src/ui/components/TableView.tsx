import { memo, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { GameState } from '../../game'
import { type Rank, rankLabel, suitLabel } from '../../engine/cards'

type Props = {
  state: GameState
  selectedRank?: Rank
  onRankPress?: (rank: Rank) => void
}

export const TableView = memo(function TableView({ state, selectedRank, onRankPress }: Props) {
  const piles = useMemo(() => {
    const ranks = Object.keys(state.tableByRank)
      .map(r => Number(r))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b)

    return ranks.map(rank => state.tableByRank[rank])
  }, [state.tableByRank])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Table</Text>
      <View style={styles.grid}>
        {piles.map(pile => {
          const suits = pile.cards.map(c => suitLabel(c.suit)).join(' ')
          const isSelected = pile.rank === selectedRank
          return (
            <Pressable
              key={pile.rank}
              disabled={!onRankPress}
              onPress={() => onRankPress?.(pile.rank)}
              style={({ pressed }) => [
                styles.cell,
                pile.isComplete && styles.cellComplete,
                isSelected && styles.cellSelected,
                pressed && !!onRankPress && styles.cellPressed,
              ]}
            >
              <Text style={styles.rank}>{rankLabel(pile.rank)}</Text>
              <Text style={styles.suits}>{suits || '—'}</Text>
              {pile.isComplete ? <Text style={styles.complete}>complete</Text> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    backgroundColor: '#121a24',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2b3a',
    padding: 12,
  },
  title: {
    fontWeight: '800',
    color: '#cfe0f7',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 66,
    backgroundColor: '#0b0f14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2b3a',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cellPressed: {
    opacity: 0.85,
  },
  cellSelected: {
    borderColor: '#4a7dff',
    backgroundColor: '#0f1d34',
  },
  cellComplete: {
    opacity: 0.65,
  },
  rank: {
    fontWeight: '900',
    color: '#f2f6ff',
    fontSize: 16,
  },
  suits: {
    marginTop: 4,
    color: '#9fb0c5',
    fontWeight: '700',
  },
  complete: {
    marginTop: 6,
    fontSize: 10,
    color: '#9fb0c5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
})

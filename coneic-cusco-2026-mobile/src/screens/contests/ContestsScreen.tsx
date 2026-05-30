import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ContestCard } from '../../components/cards/ContestCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips } from '../../components/ui/FilterChips';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { contests } from '../../mocks/contests';
import type { Contest } from '../../types';

type ContestFilter = 'all' | 'academic' | 'sport' | 'sociocultural';

const options: { label: string; value: ContestFilter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Académicos', value: 'academic' },
  { label: 'Deportivos', value: 'sport' },
  { label: 'Socioculturales', value: 'sociocultural' },
];

export function ContestsScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<ContestFilter>('all');
  const [selected, setSelected] = useState<Contest | null>(null);

  const filtered = useMemo(() => contests.filter((contest) => filter === 'all' || contest.category === filter), [filter]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Concursos" subtitle="Académicos, deportivos y socioculturales" onBack={navigation.goBack} />
      <FilterChips options={options} value={filter} onChange={setFilter} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Sin concursos" description="No hay concursos para esta categoría." />}
        renderItem={({ item }) => <ContestCard contest={item} onPress={() => setSelected(item)} />}
      />

      <BottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{selected.name}</Text>
            <Text style={styles.sheetText}>{selected.description}</Text>
            <Text style={styles.sectionTitle}>Reglas resumidas</Text>
            {selected.rulesSummary.map((rule) => (
              <Text key={rule} style={styles.sheetText}>• {rule}</Text>
            ))}
            <Text style={styles.sectionTitle}>Ranking mock</Text>
            {selected.ranking.map((rank) => (
              <View key={rank.id} style={styles.rankRow}>
                <Text style={styles.rankPosition}>#{rank.position}</Text>
                <Text style={styles.rankUniversity}>{rank.university}</Text>
                <Text style={styles.rankScore}>{rank.score}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  sheetContent: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  sheetText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rankPosition: {
    color: colors.gold,
    width: 38,
    fontSize: typography.body,
    fontWeight: '900',
  },
  rankUniversity: {
    flex: 1,
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '800',
  },
  rankScore: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '900',
  },
});

import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { VisitCard } from '../../components/cards/VisitCard';
import { InlineFeedback } from '../../components/feedback/InlineFeedback';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips } from '../../components/ui/FilterChips';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, spacing } from '../../constants/theme';
import { visits as visitMocks } from '../../mocks/visits';
import type { Visit } from '../../types';

type VisitFilter = 'technical' | 'tourism';

const options: { label: string; value: VisitFilter }[] = [
  { label: 'Visitas técnicas', value: 'technical' },
  { label: 'Visitas turísticas', value: 'tourism' },
];

export function VisitsScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<VisitFilter>('technical');
  const [visits, setVisits] = useState<Visit[]>(visitMocks);
  const [feedback, setFeedback] = useState('');

  const filtered = useMemo(() => visits.filter((visit) => visit.kind === filter), [filter, visits]);

  const reserve = async (visitId: string) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVisits((items) => items.map((visit) => (visit.id === visitId && visit.status !== 'full' ? { ...visit, status: 'reserved' } : visit)));
    setFeedback('Cupo reservado en modo demo.');
    setTimeout(() => setFeedback(''), 2200);
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Visitas" subtitle="Técnicas y turísticas" onBack={navigation.goBack} />
      <FilterChips options={options} value={filter} onChange={setFilter} />
      {feedback ? <InlineFeedback tone="success" message={feedback} /> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Sin visitas" description="No hay visitas para esta categoría." />}
        renderItem={({ item }) => <VisitCard visit={item} onReserve={() => reserve(item.id)} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
});

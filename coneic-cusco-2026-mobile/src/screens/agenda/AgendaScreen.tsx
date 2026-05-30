import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EventCard } from '../../components/cards/EventCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips } from '../../components/ui/FilterChips';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { colors, spacing } from '../../constants/theme';
import { agendaService } from '../../services/agendaService';
import { useAgendaStore } from '../../store/agendaStore';
import type { AgendaDay, Event, EventType } from '../../types';

type AgendaFilter = 'all' | EventType;

const filterOptions: { label: string; value: AgendaFilter }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Ponencias', value: 'talk' },
  { label: 'Concursos', value: 'contest' },
  { label: 'Visitas técnicas', value: 'technicalVisit' },
  { label: 'Visitas turísticas', value: 'tourismVisit' },
  { label: 'Ferias', value: 'fair' },
  { label: 'Sociocultural', value: 'sociocultural' },
  { label: 'Deportivo', value: 'sport' },
];

export function AgendaScreen() {
  const navigation = useNavigation<any>();
  const [days, setDays] = useState<AgendaDay[]>([]);
  const [items, setItems] = useState<Event[]>([]);
  const [selectedDay, setSelectedDay] = useState('day-2026-08-10');
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addEvent = useAgendaStore((state) => state.addEvent);
  const isInAgenda = useAgendaStore((state) => state.isInAgenda);

  const loadAgenda = async () => {
    const [nextDays, nextEvents] = await Promise.all([agendaService.getAgendaDays(), agendaService.getEvents()]);
    setDays(nextDays);
    setItems(nextEvents);
    setLoading(false);
  };

  useEffect(() => {
    loadAgenda();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgenda();
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    return items
      .filter((event) => event.dayId === selectedDay)
      .filter((event) => (filter === 'all' ? true : event.type === filter))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [items, selectedDay, filter]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Agenda" subtitle="5 días de actividades CONEIC" />
      <FilterChips
        options={days.map((day) => ({ label: day.shortLabel, value: day.id }))}
        value={selectedDay}
        onChange={setSelectedDay}
      />
      <FilterChips options={filterOptions} value={filter} onChange={setFilter} />

      {loading ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl tintColor={colors.gold} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState title="Sin actividades" description="No hay eventos para este filtro. Prueba con otro día o categoría." />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              inAgenda={isInAgenda(item.id)}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              onAdd={() => addEvent(item.id)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 130,
  },
});

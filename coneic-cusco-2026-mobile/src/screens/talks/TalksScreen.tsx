import { Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { SpeakerCard } from '../../components/cards/SpeakerCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterChips } from '../../components/ui/FilterChips';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { speakers } from '../../mocks/speakers';
import { useAgendaStore } from '../../store/agendaStore';

type ScopeFilter = 'all' | 'international' | 'national';
type TrackFilter = 'all' | 'BIM' | 'Estructuras' | 'Geotecnia' | 'Gestión de proyectos' | 'Sostenibilidad' | 'Infraestructura';

const scopeOptions: { label: string; value: ScopeFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Internacionales', value: 'international' },
  { label: 'Nacionales', value: 'national' },
];

const trackOptions: { label: string; value: TrackFilter }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'BIM', value: 'BIM' },
  { label: 'Estructuras', value: 'Estructuras' },
  { label: 'Geotecnia', value: 'Geotecnia' },
  { label: 'Gestión', value: 'Gestión de proyectos' },
  { label: 'Sostenibilidad', value: 'Sostenibilidad' },
  { label: 'Infraestructura', value: 'Infraestructura' },
];

export function TalksScreen() {
  const navigation = useNavigation<any>();
  const addEvent = useAgendaStore((state) => state.addEvent);
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [track, setTrack] = useState<TrackFilter>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return speakers.filter((speaker) => {
      const matchesScope = scope === 'all' || speaker.scope === scope;
      const matchesTrack = track === 'all' || speaker.track === track;
      const matchesQuery = `${speaker.name} ${speaker.topic} ${speaker.country}`.toLowerCase().includes(query.toLowerCase());
      return matchesScope && matchesTrack && matchesQuery;
    });
  }, [scope, track, query]);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Ponencias" subtitle="Nacionales e internacionales" onBack={navigation.goBack} />
      <View style={styles.searchBox}>
        <Search color={colors.textSecondary} size={18} />
        <TextInput
          accessibilityLabel="Buscar ponentes"
          placeholder="Buscar por ponente, país o tema"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>
      <FilterChips options={scopeOptions} value={scope} onChange={setScope} />
      <FilterChips options={trackOptions} value={track} onChange={setTrack} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl tintColor={colors.gold} refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={<EmptyState title="Sin ponentes" description="Ajusta la búsqueda o el filtro para ver más ponencias." />}
        renderItem={({ item }) => (
          <SpeakerCard
            speaker={item}
            onPress={() => navigation.navigate('SpeakerDetail', { speakerId: item.id })}
            onAdd={() => addEvent(item.eventId)}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: typography.body,
    minHeight: 50,
  },
  list: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
});

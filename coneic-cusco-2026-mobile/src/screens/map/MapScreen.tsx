import { Navigation, MapPin } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { FilterChips } from '../../components/ui/FilterChips';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { events } from '../../mocks/events';
import { venues } from '../../mocks/venues';
import type { Venue } from '../../types';

type VenueFilter = 'all' | Venue['category'];

const filters: { label: string; value: VenueFilter }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Auditorio', value: 'auditorium' },
  { label: 'Registro', value: 'registration' },
  { label: 'Ferias', value: 'fair' },
  { label: 'Salas', value: 'room' },
  { label: 'Transporte', value: 'transport' },
  { label: 'Alimentación', value: 'food' },
  { label: 'Visitas', value: 'visit' },
];

export function MapScreen() {
  const [filter, setFilter] = useState<VenueFilter>('all');
  const [selected, setSelected] = useState<Venue | null>(null);

  const visibleVenues = useMemo(() => venues.filter((venue) => filter === 'all' || venue.category === filter), [filter]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Mapa" subtitle="Campus UAC y puntos CONEIC" />
      <FilterChips options={filters} value={filter} onChange={setFilter} />
      <View style={styles.map}>
        <View style={styles.gridLineOne} />
        <View style={styles.gridLineTwo} />
        <View style={styles.mainPath} />
        <Text style={styles.mapLabel}>Universidad Andina del Cusco</Text>
        {visibleVenues.map((venue) => (
          <Pressable
            key={venue.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir punto ${venue.name}`}
            onPress={() => setSelected(venue)}
            style={[styles.pin, { left: `${venue.x}%`, top: `${venue.y}%` }]}
          >
            <MapPin color={colors.navyDeep} size={18} />
          </Pressable>
        ))}
      </View>

      <BottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selected.name}</Text>
            <Text style={styles.sheetText}>{selected.description}</Text>
            <Text style={styles.sheetMeta}>Horario: {selected.hours}</Text>
            <Text style={styles.sheetSection}>Eventos asociados</Text>
            {selected.associatedEventIds.map((eventId) => {
              const event = events.find((item) => item.id === eventId);
              return event ? (
                <Text key={event.id} style={styles.sheetText}>
                  • {event.startTime} · {event.title}
                </Text>
              ) : null;
            })}
            <SecondaryButton label="Cómo llegar" onPress={() => undefined} icon={<Navigation color={colors.white} size={17} />} />
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
  map: {
    flex: 1,
    minHeight: 520,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    backgroundColor: '#101D3D',
  },
  mapLabel: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.lg,
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
    maxWidth: 240,
  },
  gridLineOne: {
    position: 'absolute',
    left: '8%',
    top: '28%',
    width: '82%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '-8deg' }],
  },
  gridLineTwo: {
    position: 'absolute',
    left: '20%',
    top: '62%',
    width: '68%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '12deg' }],
  },
  mainPath: {
    position: 'absolute',
    left: '48%',
    top: '14%',
    width: 4,
    height: '76%',
    borderRadius: 4,
    backgroundColor: 'rgba(242,193,24,0.28)',
  },
  pin: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  sheet: {
    gap: spacing.md,
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
  sheetMeta: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  sheetSection: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
});

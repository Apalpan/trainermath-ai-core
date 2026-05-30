import { CalendarPlus, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography, typeLabels } from '../../constants/theme';
import type { Event } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusBadge } from '../ui/StatusBadge';

interface EventCardProps {
  event: Event;
  inAgenda?: boolean;
  compact?: boolean;
  onPress?: () => void;
  onAdd?: () => void;
}

export function EventCard({ event, inAgenda, compact, onPress, onAdd }: EventCardProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${event.title}`} onPress={onPress}>
      <GlassCard style={[styles.card, compact && styles.compact]}>
        <View style={styles.top}>
          <Text style={styles.time}>{event.startTime} - {event.endTime}</Text>
          {event.isNext ? <StatusBadge status="live" label="Próximo" /> : <StatusBadge status={inAgenda ? 'registered' : event.status} />}
        </View>
        <Text style={styles.type}>{typeLabels[event.type]}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.metaRow}>
          <MapPin color={colors.textSecondary} size={16} />
          <Text numberOfLines={1} style={styles.meta}>
            {event.venueName}
          </Text>
        </View>
        <Text style={styles.capacity}>{event.registered}/{event.capacity} participantes o cupos</Text>
        {!compact && onAdd ? (
          <SecondaryButton
            label={inAgenda ? 'En mi agenda' : 'Agregar a mi agenda'}
            onPress={onAdd}
            icon={<CalendarPlus color={colors.white} size={17} />}
          />
        ) : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  compact: {
    marginBottom: 0,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  time: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
  type: {
    color: colors.purple,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  capacity: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
});

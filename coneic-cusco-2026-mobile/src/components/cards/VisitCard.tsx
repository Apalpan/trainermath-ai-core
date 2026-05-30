import { MapPinned } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';
import type { Visit } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusBadge } from '../ui/StatusBadge';

interface VisitCardProps {
  visit: Visit;
  onReserve?: () => void;
}

export function VisitCard({ visit, onReserve }: VisitCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.kind}>{visit.kind === 'technical' ? 'Visita técnica' : 'Visita turística'}</Text>
        <StatusBadge status={visit.status} />
      </View>
      <Text style={styles.title}>{visit.name}</Text>
      <Text style={styles.place}>{visit.place} · {visit.time}</Text>
      <Text style={styles.meta}>Punto de encuentro: {visit.meetingPoint}</Text>
      <Text style={styles.meta}>Cupos: {visit.reserved}/{visit.capacity}</Text>
      <View style={styles.recommendations}>
        {visit.recommendations.map((item) => (
          <Text key={item} style={styles.recommendation}>
            {item}
          </Text>
        ))}
      </View>
      <SecondaryButton
        label={visit.status === 'full' ? 'Cupos llenos' : visit.status === 'reserved' ? 'Cupo reservado' : 'Reservar cupo'}
        disabled={visit.status === 'full'}
        onPress={onReserve ?? (() => undefined)}
        icon={<MapPinned color={colors.white} size={17} />}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  kind: {
    color: colors.purple,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  place: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '800',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  recommendations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recommendation: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

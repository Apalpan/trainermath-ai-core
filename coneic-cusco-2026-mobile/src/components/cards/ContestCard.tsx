import { Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';
import type { Contest } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusBadge } from '../ui/StatusBadge';

interface ContestCardProps {
  contest: Contest;
  onPress?: () => void;
}

export function ContestCard({ contest, onPress }: ContestCardProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir concurso ${contest.name}`} onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.category}>{contest.category === 'academic' ? 'Académico' : contest.category === 'sport' ? 'Deportivo' : 'Sociocultural'}</Text>
          <StatusBadge status={contest.status} />
        </View>
        <Text style={styles.title}>{contest.name}</Text>
        <Text style={styles.description}>{contest.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{contest.date}</Text>
          <Text style={styles.metaText}>{contest.teamsRegistered} equipos</Text>
          <Text style={styles.metaText}>{contest.venueName}</Text>
        </View>
        <SecondaryButton label="Ver ranking" onPress={onPress ?? (() => undefined)} icon={<Trophy color={colors.white} size={17} />} />
      </GlassCard>
    </Pressable>
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
    alignItems: 'center',
    gap: spacing.md,
  },
  category: {
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
  description: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  meta: {
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
});

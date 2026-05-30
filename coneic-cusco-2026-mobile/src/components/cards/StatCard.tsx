import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: ComponentType<{ color?: string; size?: number }>;
}

export function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.iconBox}>{Icon ? <Icon color={colors.gold} size={20} /> : null}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 132,
    gap: spacing.xs,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: 'rgba(242,193,24,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.white,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  helper: {
    color: colors.gold,
    fontSize: typography.tiny,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, statusLabels, typography } from '../../constants/theme';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusColor: Record<string, string> = {
  available: colors.success,
  registered: colors.gold,
  live: colors.danger,
  full: colors.warning,
  finished: colors.muted,
  inProgress: colors.gold,
  locked: colors.muted,
  availableCert: colors.success,
  reserved: colors.purple,
  validated: colors.success,
  pending: colors.warning,
  rejected: colors.danger,
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = statusColor[status] ?? colors.textSecondary;
  return (
    <View style={[styles.badge, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label ?? statusLabels[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

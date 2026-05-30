import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../constants/theme';
import { GlassCard } from './GlassCard';

export function SkeletonCard() {
  return (
    <GlassCard style={styles.card}>
      <View style={[styles.line, styles.short]} />
      <View style={styles.line} />
      <View style={[styles.line, styles.medium]} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  line: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: `${colors.white}18`,
  },
  short: {
    width: '36%',
  },
  medium: {
    width: '68%',
  },
});

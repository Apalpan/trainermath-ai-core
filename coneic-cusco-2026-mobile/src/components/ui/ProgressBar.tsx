import { StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, radius } from '../../constants/theme';

interface ProgressBarProps {
  value: number;
  color?: string;
}

export function ProgressBar({ value, color = colors.gold }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(100, value))}%` as DimensionValue;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

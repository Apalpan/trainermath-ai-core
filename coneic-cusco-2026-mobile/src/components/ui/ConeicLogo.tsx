import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';

interface ConeicLogoProps {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ConeicLogo({ compact, style }: ConeicLogoProps) {
  return (
    <View style={[styles.wrap, compact && styles.compactWrap, style]}>
      <View style={[styles.mark, compact && styles.compactMark]}>
        <Text style={[styles.markText, compact && styles.compactMarkText]}>C26</Text>
      </View>
      {!compact ? (
        <View style={styles.wordmark}>
          <Text style={styles.title}>XXXIII CONEIC</Text>
          <Text style={styles.subtitle}>Cusco 2026</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  compactWrap: {
    alignItems: 'flex-start',
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  compactMark: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
  },
  markText: {
    color: colors.navyDeep,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  compactMarkText: {
    fontSize: typography.h3,
  },
  wordmark: {
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: typography.h2,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.gold,
    fontSize: typography.h3,
    fontWeight: '900',
    textAlign: 'center',
  },
});

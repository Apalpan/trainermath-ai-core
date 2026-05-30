import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConeicLogo } from '../../components/ui/ConeicLogo';
import { colors, eventMeta, gradients, radius, spacing, typography } from '../../constants/theme';
import { onboardingFacts } from '../../mocks/demoExperience';

export function SplashScreen() {
  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ConeicLogo />
        <Text style={styles.title}>{eventMeta.fullName}</Text>
        <Text style={styles.subtitle}>{eventMeta.subtitle}</Text>
        <View style={styles.factsRow}>
          {onboardingFacts.map((fact) => (
            <View key={fact.id} style={styles.factPill}>
              <Text style={styles.factValue}>{fact.value}</Text>
              <Text style={styles.factLabel}>{fact.label}</Text>
            </View>
          ))}
        </View>
        <ActivityIndicator color={colors.gold} size="large" style={styles.loader} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  subtitle: {
    color: colors.offWhite,
    fontSize: typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  factPill: {
    minWidth: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  factValue: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
  factLabel: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '800',
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xxxl,
  },
});

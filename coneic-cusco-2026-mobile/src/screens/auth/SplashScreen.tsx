import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, eventMeta, gradients, radius, spacing, typography } from '../../constants/theme';

export function SplashScreen() {
  return (
    <LinearGradient colors={gradients.hero} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C26</Text>
        </View>
        <Text style={styles.title}>{eventMeta.fullName}</Text>
        <Text style={styles.subtitle}>{eventMeta.subtitle}</Text>
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
  logo: {
    width: 104,
    height: 104,
    borderRadius: radius.xl,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    color: colors.navyDeep,
    fontSize: typography.hero,
    fontWeight: '900',
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.offWhite,
    fontSize: typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xxxl,
  },
});

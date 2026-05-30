import { ChevronRight, MessageCircle, QrCode, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ConeicLogo } from '../../components/ui/ConeicLogo';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import { onboardingFacts, onboardingSlides } from '../../mocks/demoExperience';
import { useAuthStore } from '../../store/authStore';

const icons = [QrCode, ShieldCheck, MessageCircle];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const slide = onboardingSlides[index];
  const Icon = icons[index] ?? QrCode;
  const isLast = index === onboardingSlides.length - 1;
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fade.setValue(0);
    lift.setValue(16);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, damping: 15, stiffness: 110, useNativeDriver: true }),
    ]).start();
  }, [fade, index, lift]);

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.brand}>
        <ConeicLogo />
        <Text style={styles.meta}>{eventMeta.dates} · {eventMeta.location} · {eventMeta.venue}</Text>
      </View>

      <Animated.View style={[styles.animated, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <GlassCard style={styles.card}>
          <View style={styles.signalRow}>
            <View style={styles.iconBox}>
              <Icon color={colors.navyDeep} size={24} />
            </View>
            <Text style={styles.signal}>{slide.signal}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
          <View style={styles.dots}>
            {onboardingSlides.map((item, dotIndex) => (
              <View key={item.id} style={[styles.dot, dotIndex === index && styles.activeDot]} />
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <View style={styles.factGrid}>
        {onboardingFacts.map((fact) => (
          <View key={fact.id} style={styles.fact}>
            <Text style={styles.factValue}>{fact.value}</Text>
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text style={styles.factHelper}>{fact.helper}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Saltar onboarding" onPress={completeOnboarding}>
          <Text style={styles.skip}>Entrar directo al demo</Text>
        </Pressable>
        <PrimaryButton
          label={isLast ? 'Ingresar al evento' : 'Continuar'}
          onPress={handleNext}
          icon={<ChevronRight color={colors.navyDeep} size={18} />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  animated: {
    width: '100%',
  },
  card: {
    minHeight: 258,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signal: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    lineHeight: 34,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  activeDot: {
    width: 34,
    backgroundColor: colors.gold,
  },
  factGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fact: {
    flex: 1,
    minHeight: 104,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  factValue: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  factLabel: {
    color: colors.gold,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  factHelper: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    lineHeight: 15,
  },
  footer: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  skip: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
});

import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const slides = [
  {
    title: 'Todo el CONEIC en tu bolsillo',
    body: 'Tu experiencia CONEIC empieza aquí, con agenda, credencial y avisos en un solo lugar.',
  },
  {
    title: 'Tu QR, agenda, certificados y asistencia en tiempo real',
    body: 'Horas acumuladas verificables y certificados disponibles al cumplir los requisitos del evento.',
  },
  {
    title: 'Explora Cusco, participa y no te pierdas ninguna actividad',
    body: 'Ponencias, concursos, visitas técnicas, ferias y networking organizados para decidir rápido.',
  },
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

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
        <View style={styles.logo}>
          <Text style={styles.logoText}>C26</Text>
        </View>
        <Text style={styles.event}>{eventMeta.fullName}</Text>
        <Text style={styles.meta}>{eventMeta.dates} · {eventMeta.location}</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <View style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View key={item.title} style={[styles.dot, dotIndex === index && styles.activeDot]} />
          ))}
        </View>
      </GlassCard>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Saltar onboarding" onPress={completeOnboarding}>
          <Text style={styles.skip}>Saltar</Text>
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
    paddingTop: spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: radius.xl,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    color: colors.navyDeep,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  event: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  card: {
    minHeight: 250,
    justifyContent: 'center',
    gap: spacing.lg,
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
    width: 28,
    backgroundColor: colors.gold,
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

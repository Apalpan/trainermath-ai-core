import { useNavigation } from '@react-navigation/native';
import { Globe2, Headphones, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const languages = ['Español', 'English', 'Português'];

const settings = [
  { label: 'Mi cuenta', icon: UserRound },
  { label: 'Soporte', icon: Headphones },
  { label: 'Términos y condiciones', icon: ShieldCheck },
];

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);
  const [language, setLanguage] = useState('Español');

  return (
    <ScreenContainer scroll>
      <AppHeader title="Configuración" subtitle="Cuenta y preferencias" onBack={navigation.goBack} />
      <GlassCard style={styles.card}>
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <View key={item.label} style={styles.settingRow}>
              <View style={styles.iconBox}>
                <Icon color={colors.gold} size={18} />
              </View>
              <Text style={styles.settingText}>{item.label}</Text>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.iconBox}>
            <Globe2 color={colors.gold} size={18} />
          </View>
          <Text style={styles.settingText}>Cambiar idioma</Text>
        </View>
        <View style={styles.languages}>
          {languages.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Seleccionar idioma ${item}`}
              onPress={() => setLanguage(item)}
              style={[styles.language, language === item && styles.languageSelected]}
            >
              <Text style={[styles.languageText, language === item && styles.languageSelectedText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.helper}>Selector visual mock. La traducción completa queda para producción.</Text>
      </GlassCard>

      <SecondaryButton label="Cerrar sesión" onPress={logout} icon={<LogOut color={colors.white} size={17} />} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  settingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(242,193,24,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '800',
  },
  languages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  language: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  languageSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  languageText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  languageSelectedText: {
    color: colors.navyDeep,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
});

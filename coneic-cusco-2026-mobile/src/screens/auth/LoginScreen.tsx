import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, LogIn } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { InlineFeedback } from '../../components/feedback/InlineFeedback';
import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  passcode: z.string().min(8, 'El DNI o clave debe tener mínimo 8 caracteres.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'apalpan@coneic.com',
      passcode: '12345678',
    },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.passcode);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
      });
    }
  };

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <AppHeader title="Ingreso" subtitle={eventMeta.subtitle} />
        <View style={styles.hero}>
          <Text style={styles.title}>Gestiona tu agenda, QR, asistencia y certificados desde un solo lugar.</Text>
          <Text style={styles.subtitle}>No te pierdas ninguna ponencia, concurso o visita técnica.</Text>
        </View>

        <GlassCard style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  accessibilityLabel="Correo"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="apalpan@coneic.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={value}
                />
              )}
            />
            {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DNI o contraseña</Text>
            <Controller
              control={control}
              name="passcode"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  accessibilityLabel="DNI o contraseña"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="12345678"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={styles.input}
                  value={value}
                />
              )}
            />
            {errors.passcode ? <Text style={styles.error}>{errors.passcode.message}</Text> : null}
          </View>

          {errors.root?.message ? <InlineFeedback tone="error" message={errors.root.message} /> : null}

          <PrimaryButton
            label="Ingresar"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            icon={<LogIn color={colors.navyDeep} size={18} />}
          />
          <SecondaryButton label="Verificar inscripción" onPress={() => undefined} icon={<Eye color={colors.white} size={17} />} />
        </GlassCard>

        <Text style={styles.credentials}>Credenciales demo: apalpan@coneic.com / 12345678</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
  },
  formCard: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '800',
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: colors.white,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: '700',
  },
  credentials: {
    color: colors.textSecondary,
    fontSize: typography.small,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import * as Haptics from 'expo-haptics';
import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { QRModal } from '../../components/ui/QRModal';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { maskDni } from '../../utils/format';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const [qrVisible, setQrVisible] = useState(false);

  if (!user) return null;

  const qrValue = `CONEIC-2026|USER:${user.participantCode}|DNI:${user.dni}`;

  const shareCredential = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `${user.fullName} · ${user.participantCode} · ${user.university}`,
    });
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title="Credencial" subtitle="QR oficial del participante" />

      <GlassCard style={styles.identityCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.firstName.slice(0, 1)}R</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.university}>{user.university}</Text>
            <StatusBadge status="available" label="Inscripción validada" />
          </View>
        </View>

        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={184} backgroundColor={colors.white} color={colors.navyDeep} />
        </View>

        <Text style={styles.code}>{user.participantCode}</Text>
        <Text style={styles.meta}>{user.role === 'participant' ? 'Participante general' : user.role} · {user.registrationStage}</Text>

        <View style={styles.actions}>
          <SecondaryButton label="Ampliar QR" onPress={() => setQrVisible(true)} />
          <SecondaryButton label="Compartir credencial" onPress={shareCredential} icon={<Share2 color={colors.white} size={17} />} />
        </View>
      </GlassCard>

      <GlassCard style={styles.dataCard}>
        <Text style={styles.sectionTitle}>Datos del participante</Text>
        {[
          ['Correo', user.email],
          ['DNI', maskDni(user.dni)],
          ['Celular', user.phone],
          ['Universidad', user.university],
        ].map(([label, value]) => (
          <View key={label} style={styles.dataRow}>
            <Text style={styles.dataLabel}>{label}</Text>
            <Text style={styles.dataValue}>{value}</Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Estado</Text>
        <StatusBadge status="validated" label="Pago confirmado" />
        <StatusBadge status="validated" label="Acceso habilitado" />
        <StatusBadge status="validated" label="QR activo" />
      </GlassCard>

      <QRModal visible={qrVisible} user={user} onClose={() => setQrVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  profileTop: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(242,193,24,0.18)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.gold,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  university: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  qrBox: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  code: {
    color: colors.gold,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  dataCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statusCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: spacing.md,
  },
  dataLabel: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  dataValue: {
    flex: 1,
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '800',
    textAlign: 'right',
  },
});

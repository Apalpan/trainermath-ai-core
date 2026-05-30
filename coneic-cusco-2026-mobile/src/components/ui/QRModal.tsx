import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import type { User } from '../../types';

interface QRModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
}

export function QRModal({ visible, user, onClose }: QRModalProps) {
  const qrValue = `CONEIC-2026|USER:${user.participantCode}|DNI:${user.dni}`;

  const handleShow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Modal visible={visible} animationType="fade" onShow={handleShow} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar QR" onPress={onClose} style={styles.close}>
          <X color={colors.white} size={24} />
        </Pressable>
        <View style={styles.content}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C26</Text>
          </View>
          <Text style={styles.title}>Mi QR de ingreso</Text>
          <Text style={styles.subtitle}>{eventMeta.fullName}</Text>

          <View style={styles.qrBox}>
            <QRCode value={qrValue} size={236} backgroundColor={colors.white} color={colors.navyDeep} />
          </View>

          <Text style={styles.code}>{user.participantCode}</Text>
          <Text style={styles.helper}>QR personal para acreditación y asistencia. No lo compartas si no es necesario.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  close: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: colors.navyDeep,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
  },
  qrBox: {
    marginVertical: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  code: {
    color: colors.gold,
    fontSize: typography.h3,
    fontWeight: '900',
    letterSpacing: 0,
  },
  helper: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});

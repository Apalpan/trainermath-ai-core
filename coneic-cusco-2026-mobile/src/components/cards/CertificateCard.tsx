import { Download } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, radius, spacing, typography } from '../../constants/theme';
import type { Certificate } from '../../types';
import { percent } from '../../utils/format';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusBadge } from '../ui/StatusBadge';

interface CertificateCardProps {
  certificate: Certificate;
  onDownload: () => void;
}

export function CertificateCard({ certificate, onDownload }: CertificateCardProps) {
  const progress = percent(certificate.hours, certificate.requiredHours);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{certificate.title}</Text>
          <Text style={styles.description}>{certificate.description}</Text>
        </View>
        <StatusBadge status={certificate.status} />
      </View>
      <View style={styles.progressBlock}>
        <View style={styles.progressTextRow}>
          <Text style={styles.meta}>{certificate.hours} / {certificate.requiredHours} horas</Text>
          <Text style={styles.meta}>{progress}%</Text>
        </View>
        <ProgressBar value={progress} color={certificate.status === 'locked' ? colors.muted : colors.gold} />
      </View>
      <View style={styles.qrRow}>
        <View style={styles.qrBox}>
          <QRCode value={certificate.verificationCode} size={58} backgroundColor={colors.white} color={colors.navyDeep} />
        </View>
        <View style={styles.codeBlock}>
          <Text style={styles.user}>{certificate.userName}</Text>
          <Text style={styles.code}>{certificate.verificationCode}</Text>
        </View>
      </View>
      <SecondaryButton
        label={certificate.status === 'available' ? 'Descargar PDF' : 'Ver estado'}
        onPress={onDownload}
        icon={<Download color={colors.white} size={17} />}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  qrBox: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  user: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '900',
  },
  code: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
  },
});

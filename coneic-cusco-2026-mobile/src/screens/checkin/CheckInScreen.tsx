import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StatCard } from '../../components/cards/StatCard';
import { InlineFeedback } from '../../components/feedback/InlineFeedback';
import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, spacing, typography } from '../../constants/theme';
import { attendanceRecords } from '../../mocks/attendance';
import { mockUser } from '../../mocks/users';
import { percent } from '../../utils/format';

export function CheckInScreen() {
  const navigation = useNavigation<any>();
  const [staffMessage, setStaffMessage] = useState('');
  const progress = percent(mockUser.accumulatedHours, mockUser.requiredHours);
  const remaining = mockUser.requiredHours - mockUser.accumulatedHours;

  const simulateScan = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStaffMessage(`${mockUser.fullName} validado. Asistencia lista para registrar.`);
  };

  const registerAttendance = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStaffMessage('Asistencia registrada en modo demo. En producción se validará contra backend.');
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title="Asistencia" subtitle="Horas y check-in" onBack={navigation.goBack} />
      <View style={styles.statsRow}>
        <StatCard label="Total" value={`${mockUser.accumulatedHours} h`} helper="validables" icon={CheckCircle2} />
        <StatCard label="Meta" value="30 h" helper={`faltan ${remaining} h`} icon={ScanLine} />
      </View>

      <GlassCard style={styles.progressCard}>
        <Text style={styles.title}>Estado por certificado</Text>
        <ProgressBar value={progress} />
        <Text style={styles.meta}>{mockUser.accumulatedHours} de {mockUser.requiredHours} horas acumuladas verificables.</Text>
      </GlassCard>

      <Text style={styles.sectionTitle}>Historial de asistencias</Text>
      {attendanceRecords.map((record) => (
        <GlassCard key={record.id} style={styles.record}>
          <View style={styles.recordInfo}>
            <Text style={styles.recordTitle}>{record.eventTitle}</Text>
            <Text style={styles.meta}>{record.date} · {record.hours} h</Text>
          </View>
          <StatusBadge status={record.status} />
        </GlassCard>
      ))}

      <GlassCard style={styles.staffCard}>
        <Text style={styles.title}>Modo staff demo</Text>
        <Text style={styles.meta}>Simula escaneo de QR y registro de asistencia. En producción requiere token firmado, backend y control de duplicidad.</Text>
        {staffMessage ? <InlineFeedback tone="success" message={staffMessage} /> : null}
        <SecondaryButton label="Escanear QR" onPress={simulateScan} icon={<ScanLine color={colors.white} size={17} />} />
        <SecondaryButton label="Registrar asistencia" onPress={registerAttendance} icon={<CheckCircle2 color={colors.white} size={17} />} />
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  recordInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  recordTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  staffCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});

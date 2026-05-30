import { Award, Bell, CalendarDays, CheckCircle2, Map, QrCode, Route, Sparkles, Trophy, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { EventCard } from '../../components/cards/EventCard';
import { StatCard } from '../../components/cards/StatCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { QRModal } from '../../components/ui/QRModal';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import { events } from '../../mocks/events';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { percent } from '../../utils/format';

const quickActions = [
  { label: 'Agenda', icon: CalendarDays, route: 'AgendaTab' },
  { label: 'Ponencias', icon: Users, route: 'Talks' },
  { label: 'Concursos', icon: Trophy, route: 'Contests' },
  { label: 'Visitas', icon: Route, route: 'Visits' },
  { label: 'Mapa', icon: Map, route: 'MapTab' },
  { label: 'Certificados', icon: Award, route: 'Certificates' },
  { label: 'Asistencia', icon: CheckCircle2, route: 'CheckIn' },
  { label: 'Stats', icon: Sparkles, route: 'Stats' },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const [qrVisible, setQrVisible] = useState(false);
  const nextEvent = events.find((event) => event.isNext) ?? events[0];
  const progress = user ? percent(user.accumulatedHours, user.requiredHours) : 0;

  if (!user) return null;

  const navigateQuick = (route: string) => {
    if (route === 'AgendaTab' || route === 'MapTab') {
      navigation.navigate(route);
      return;
    }
    navigation.navigate(route);
  };

  return (
    <ScreenContainer scroll>
      <AppHeader
        title={`Hola, ${user.firstName}`}
        subtitle={`${eventMeta.dates} · ${eventMeta.location}`}
        onNotifications={() => navigation.navigate('Notifications')}
      />

      <GlassCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>C26</Text>
          </View>
          <StatusBadge status="available" label="Participante verificado" />
        </View>
        <Text style={styles.heroTitle}>Tu experiencia CONEIC empieza aquí.</Text>
        <Text style={styles.heroSubtitle}>{eventMeta.venue}</Text>
      </GlassCard>

      <SectionHeader title="Tu próximo evento" />
      <EventCard event={nextEvent} compact onPress={() => navigation.navigate('EventDetail', { eventId: nextEvent.id })} />
      <PrimaryButton label="Ver detalle" onPress={() => navigation.navigate('EventDetail', { eventId: nextEvent.id })} />

      <View style={styles.metricsRow}>
        <StatCard label="Horas acumuladas" value={`${user.accumulatedHours}/${user.requiredHours}`} helper="verificables" icon={Award} />
        <StatCard label="Capacidad" value="6000" helper="participantes" icon={Users} />
      </View>

      <SectionHeader title="QR y certificación" />
      <GlassCard style={styles.qrCard}>
        <View style={styles.qrHeader}>
          <View>
            <Text style={styles.cardTitle}>Mi QR de ingreso</Text>
            <Text style={styles.cardText}>Código {user.participantCode}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mostrar QR" onPress={() => setQrVisible(true)} style={styles.qrButton}>
            <QrCode color={colors.navyDeep} size={25} />
          </Pressable>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.cardText}>Progreso de certificación</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <ProgressBar value={progress} />
          <Text style={styles.cardText}>18 / 30 horas acumuladas</Text>
        </View>
      </GlassCard>

      <SectionHeader title="Accesos rápidos" />
      <View style={styles.quickGrid}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${action.label}`}
              onPress={() => navigateQuick(action.route)}
              style={styles.quickAction}
            >
              <Icon color={colors.gold} size={22} />
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="Avisos importantes" action="Actualizado" />
      {notifications.slice(0, 3).map((notification) => (
        <GlassCard key={notification.id} style={styles.notice}>
          <Bell color={notification.read ? colors.textSecondary : colors.gold} size={18} />
          <View style={styles.noticeText}>
            <Text style={styles.noticeTitle}>{notification.title}</Text>
            <Text style={styles.noticeDescription}>{notification.description}</Text>
          </View>
        </GlassCard>
      ))}

      <QRModal visible={qrVisible} user={user} onClose={() => setQrVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.navyDeep,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  qrCard: {
    gap: spacing.lg,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  qrButton: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    width: '47.5%',
    minHeight: 88,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  quickLabel: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '800',
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    flex: 1,
    gap: spacing.xs,
  },
  noticeTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  noticeDescription: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
});

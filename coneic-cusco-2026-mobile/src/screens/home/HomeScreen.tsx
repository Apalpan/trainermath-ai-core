import { useNavigation } from '@react-navigation/native';
import {
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  Map,
  MessageCircle,
  QrCode,
  Route,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { EventCard } from '../../components/cards/EventCard';
import { StatCard } from '../../components/cards/StatCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { ConeicLogo } from '../../components/ui/ConeicLogo';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { QRModal } from '../../components/ui/QRModal';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, eventMeta, radius, spacing, typography } from '../../constants/theme';
import { demoTimeline, eventHighlights } from '../../mocks/demoExperience';
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
  { label: 'Asistente', icon: MessageCircle, route: 'AssistantTab' },
];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const [qrVisible, setQrVisible] = useState(false);
  const nextEvent = events.find((event) => event.isNext) ?? events[0];
  const progress = user ? percent(user.accumulatedHours, user.requiredHours) : 0;
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 0, damping: 16, stiffness: 100, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  if (!user) return null;

  const navigateQuick = (route: string) => {
    if (route === 'AgendaTab' || route === 'MapTab' || route === 'AssistantTab' || route === 'ProfileTab') {
      navigation.navigate(route);
      return;
    }
    navigation.navigate(route);
  };

  const navigateTimeline = (route: string) => {
    if (route === 'EventDetail') {
      navigation.navigate('EventDetail', { eventId: nextEvent.id });
      return;
    }
    navigateQuick(route);
  };

  return (
    <ScreenContainer scroll>
      <AppHeader
        title={`Hola, ${user.firstName}`}
        subtitle={`${eventMeta.dates} · ${eventMeta.location}`}
        onNotifications={() => navigation.navigate('Notifications')}
      />

      <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <ConeicLogo compact />
            <StatusBadge status="available" label="Participante verificado" />
          </View>
          <Text style={styles.heroTitle}>Centro de control CONEIC para {user.firstName}</Text>
          <Text style={styles.heroSubtitle}>{eventMeta.promise}</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>{eventMeta.capacity}</Text>
            <Text style={styles.heroMeta}>{eventMeta.venue}</Text>
          </View>
        </GlassCard>
      </Animated.View>

      <SectionHeader title="Tu proximo evento" />
      <EventCard event={nextEvent} compact onPress={() => navigation.navigate('EventDetail', { eventId: nextEvent.id })} />
      <PrimaryButton label="Ver detalle" onPress={() => navigation.navigate('EventDetail', { eventId: nextEvent.id })} />

      <SectionHeader title="Hoy en CONEIC" action="Demo live" />
      <View style={styles.timeline}>
        {demoTimeline.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.title}`}
            onPress={() => navigateTimeline(item.route)}
            style={styles.timelineItem}
          >
            <View style={[styles.timelineDot, item.status === 'now' && styles.timelineDotNow]} />
            <View style={styles.timelineBody}>
              <View style={styles.timelineTop}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <Text style={[styles.timelineStatus, item.status === 'now' && styles.timelineStatusNow]}>
                  {item.status === 'now' ? 'En curso' : item.status === 'next' ? 'Siguiente' : 'Abierto'}
                </Text>
              </View>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelinePlace}>{item.place}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.metricsRow}>
        <StatCard label="Horas acumuladas" value={`${user.accumulatedHours}/${user.requiredHours}`} helper="verificables" icon={Award} />
        <StatCard label="Capacidad" value="6000" helper="participantes" icon={Users} />
      </View>

      <SectionHeader title="Acciones sugeridas" />
      <View style={styles.highlightGrid}>
        {eventHighlights.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => navigateQuick(item.route)}
            style={({ pressed }) => [styles.highlightCard, pressed && styles.highlightPressed]}
          >
            <View style={styles.highlightTop}>
              <Text style={styles.highlightMetric}>{item.metric}</Text>
              {item.id === 'assistant' ? <MessageCircle color={colors.gold} size={18} /> : <Sparkles color={colors.gold} size={18} />}
            </View>
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightDescription}>{item.description}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="QR y certificacion" />
      <GlassCard style={styles.qrCard}>
        <View style={styles.qrHeader}>
          <View>
            <Text style={styles.cardTitle}>Mi QR de ingreso</Text>
            <Text style={styles.cardText}>Codigo {user.participantCode}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Mostrar QR" onPress={() => setQrVisible(true)} style={styles.qrButton}>
            <QrCode color={colors.navyDeep} size={25} />
          </Pressable>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.cardText}>Progreso de certificacion</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <ProgressBar value={progress} />
          <Text style={styles.cardText}>
            {user.accumulatedHours} / {user.requiredHours} horas acumuladas
          </Text>
        </View>
      </GlassCard>

      <SectionHeader title="Accesos rapidos" />
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
    lineHeight: 23,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroMeta: {
    color: colors.gold,
    fontSize: typography.tiny,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: 'rgba(242,193,24,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeline: {
    gap: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
    marginTop: 6,
  },
  timelineDotNow: {
    backgroundColor: colors.gold,
  },
  timelineBody: {
    flex: 1,
    gap: spacing.xs,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timelineTime: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
  timelineStatus: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  timelineStatusNow: {
    color: colors.gold,
  },
  timelineTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  timelinePlace: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  highlightCard: {
    width: '47.5%',
    minHeight: 148,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  highlightPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  highlightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightMetric: {
    color: colors.gold,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  highlightTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  highlightDescription: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    lineHeight: 16,
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

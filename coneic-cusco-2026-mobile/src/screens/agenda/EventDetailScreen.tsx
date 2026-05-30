import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CalendarPlus, MapPin, Timer, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, spacing, typography, typeLabels } from '../../constants/theme';
import { contests } from '../../mocks/contests';
import { events } from '../../mocks/events';
import { speakers } from '../../mocks/speakers';
import { visits } from '../../mocks/visits';
import { useAgendaStore } from '../../store/agendaStore';

export function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const event = useMemo(() => events.find((item) => item.id === route.params?.eventId), [route.params?.eventId]);
  const addEvent = useAgendaStore((state) => state.addEvent);
  const isInAgenda = useAgendaStore((state) => (event ? state.isInAgenda(event.id) : false));

  if (!event) {
    return (
      <ScreenContainer>
        <AppHeader title="Evento" subtitle="No encontrado" onBack={navigation.goBack} />
        <Text style={styles.notFound}>No encontramos este evento.</Text>
      </ScreenContainer>
    );
  }

  const speaker = event.speakerId ? speakers.find((item) => item.id === event.speakerId) : undefined;
  const contest = event.contestId ? contests.find((item) => item.id === event.contestId) : undefined;
  const visit = event.visitId ? visits.find((item) => item.id === event.visitId) : undefined;

  const remember = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title="Detalle" subtitle={typeLabels[event.type]} onBack={navigation.goBack} />

      <GlassCard style={styles.hero}>
        <StatusBadge status={isInAgenda ? 'registered' : event.status} />
        <Text style={styles.type}>{typeLabels[event.type]}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>
      </GlassCard>

      <GlassCard style={styles.details}>
        <View style={styles.detailRow}>
          <Timer color={colors.gold} size={18} />
          <Text style={styles.detailText}>{event.startTime} - {event.endTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin color={colors.gold} size={18} />
          <Text style={styles.detailText}>{event.venueName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Users color={colors.gold} size={18} />
          <Text style={styles.detailText}>{event.registered}/{event.capacity} inscritos estimados</Text>
        </View>
      </GlassCard>

      {speaker ? (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Ponente</Text>
          <Text style={styles.mainLine}>{speaker.name} · {speaker.country}</Text>
          <Text style={styles.detailText}>{speaker.topic}</Text>
          <Text style={styles.description}>{speaker.bio}</Text>
        </GlassCard>
      ) : null}

      {contest ? (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Concurso</Text>
          <Text style={styles.mainLine}>{contest.name}</Text>
          {contest.rulesSummary.map((rule) => (
            <Text key={rule} style={styles.bullet}>• {rule}</Text>
          ))}
          <Text style={styles.detailText}>Equipos inscritos: {contest.teamsRegistered}</Text>
        </GlassCard>
      ) : null}

      {visit ? (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Visita</Text>
          <Text style={styles.mainLine}>{visit.place}</Text>
          <Text style={styles.detailText}>Punto de encuentro: {visit.meetingPoint}</Text>
          {visit.recommendations.map((recommendation) => (
            <Text key={recommendation} style={styles.bullet}>• {recommendation}</Text>
          ))}
        </GlassCard>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label={isInAgenda ? 'Ya está en mi agenda' : 'Agregar a mi agenda'}
          onPress={() => addEvent(event.id)}
          icon={<CalendarPlus color={colors.navyDeep} size={18} />}
        />
        <SecondaryButton label="Ver ubicación" onPress={() => navigation.navigate('MapTab')} icon={<MapPin color={colors.white} size={17} />} />
        <SecondaryButton label="Recordarme 15 min antes" onPress={remember} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  type: {
    color: colors.purple,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
  },
  details: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  mainLine: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  bullet: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  notFound: {
    color: colors.white,
    fontSize: typography.body,
  },
});

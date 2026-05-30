import { useNavigation, useRoute } from '@react-navigation/native';
import { CalendarPlus, Globe2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { events } from '../../mocks/events';
import { speakers } from '../../mocks/speakers';
import { useAgendaStore } from '../../store/agendaStore';

export function SpeakerDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const speaker = speakers.find((item) => item.id === route.params?.speakerId);
  const addEvent = useAgendaStore((state) => state.addEvent);

  if (!speaker) return null;
  const event = events.find((item) => item.id === speaker.eventId);

  return (
    <ScreenContainer scroll>
      <AppHeader title="Ponente" subtitle={speaker.track} onBack={navigation.goBack} />
      <GlassCard style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{speaker.initials}</Text>
        </View>
        <StatusBadge status={speaker.scope === 'international' ? 'registered' : 'available'} label={speaker.scope === 'international' ? 'Internacional' : 'Nacional'} />
        <Text style={styles.name}>{speaker.name}</Text>
        <View style={styles.countryRow}>
          <Globe2 color={colors.gold} size={18} />
          <Text style={styles.country}>{speaker.country}</Text>
        </View>
        <Text style={styles.topic}>{speaker.topic}</Text>
        <Text style={styles.bio}>{speaker.bio}</Text>
      </GlassCard>

      {event ? (
        <GlassCard style={styles.eventCard}>
          <Text style={styles.sectionTitle}>Horario</Text>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.meta}>{speaker.schedule} · {speaker.room}</Text>
          <PrimaryButton
            label="Agregar a mi agenda"
            onPress={() => addEvent(speaker.eventId)}
            icon={<CalendarPlus color={colors.navyDeep} size={18} />}
          />
        </GlassCard>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(155,77,255,0.24)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.hero,
    fontWeight: '900',
  },
  name: {
    color: colors.white,
    fontSize: typography.h1,
    fontWeight: '900',
    textAlign: 'center',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  country: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  topic: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
    textAlign: 'center',
  },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 23,
  },
  eventCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  eventTitle: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
});

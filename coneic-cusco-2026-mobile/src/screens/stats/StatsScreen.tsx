import { useNavigation } from '@react-navigation/native';
import { Award, CalendarDays, Trophy, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { StatCard } from '../../components/cards/StatCard';
import { AppHeader } from '../../components/layout/AppHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { eventStats } from '../../mocks/stats';

export function StatsScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer scroll>
      <AppHeader title="Estadísticas" subtitle="Dashboard ejecutivo del evento" onBack={navigation.goBack} />
      <View style={styles.grid}>
        <StatCard label="Participantes activos" value={eventStats.activeParticipants.toString()} helper={`de ${eventStats.capacity}`} icon={Users} />
        <StatCard label="Universidades" value={eventStats.universities.toString()} helper="delegaciones" icon={Award} />
        <StatCard label="Concursos" value={eventStats.contests.toString()} helper="programados" icon={Trophy} />
        <StatCard label="Ponencias" value={eventStats.talks.toString()} helper="agenda" icon={CalendarDays} />
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>Capacidad esperada</Text>
        <ProgressBar value={(eventStats.activeParticipants / eventStats.capacity) * 100} />
        <Text style={styles.meta}>{eventStats.activeParticipants} participantes activos mock sobre capacidad de {eventStats.capacity}.</Text>
      </GlassCard>

      <Text style={styles.sectionTitle}>Ranking por universidad</Text>
      {eventStats.rankings.slice(0, 10).map((ranking) => (
        <View key={ranking.id} style={styles.barRow}>
          <Text style={styles.position}>#{ranking.position}</Text>
          <View style={styles.barContent}>
            <Text style={styles.university}>{ranking.university}</Text>
            <ProgressBar value={(ranking.score / eventStats.rankings[0].score) * 100} color={ranking.medal ? colors.gold : colors.purple} />
          </View>
          <Text style={styles.score}>{ranking.score}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Medallero</Text>
      <GlassCard style={styles.card}>
        {eventStats.medalTable.slice(0, 3).map((rank) => (
          <View key={rank.id} style={styles.medalRow}>
            <Text style={styles.medal}>{rank.medal === 'gold' ? 'Oro' : rank.medal === 'silver' ? 'Plata' : 'Bronce'}</Text>
            <Text style={styles.medalUniversity}>{rank.university}</Text>
          </View>
        ))}
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
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
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  position: {
    width: 36,
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  barContent: {
    flex: 1,
    gap: spacing.sm,
  },
  university: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: '800',
  },
  score: {
    width: 42,
    color: colors.textSecondary,
    textAlign: 'right',
    fontSize: typography.small,
    fontWeight: '900',
  },
  medalRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: spacing.md,
  },
  medal: {
    width: 58,
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: '900',
  },
  medalUniversity: {
    flex: 1,
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '800',
  },
});

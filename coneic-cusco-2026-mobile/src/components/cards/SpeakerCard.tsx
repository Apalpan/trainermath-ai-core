import { CalendarPlus, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';
import type { Speaker } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StatusBadge } from '../ui/StatusBadge';

interface SpeakerCardProps {
  speaker: Speaker;
  onPress?: () => void;
  onAdd?: () => void;
}

export function SpeakerCard({ speaker, onPress, onAdd }: SpeakerCardProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ponente ${speaker.name}`} onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{speaker.initials}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.badges}>
              <StatusBadge status={speaker.scope === 'international' ? 'registered' : 'available'} label={speaker.scope === 'international' ? 'Internacional' : 'Nacional'} />
            </View>
            <Text style={styles.name}>{speaker.name}</Text>
            <Text style={styles.topic}>{speaker.topic}</Text>
            <View style={styles.meta}>
              <MapPin color={colors.textSecondary} size={14} />
              <Text numberOfLines={1} style={styles.metaText}>
                {speaker.country} · {speaker.room}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.schedule}>{speaker.schedule}</Text>
        {onAdd ? <SecondaryButton label="Agregar a mi agenda" onPress={onAdd} icon={<CalendarPlus color={colors.white} size={17} />} /> : null}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(155,77,255,0.24)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  badges: {
    minHeight: 28,
  },
  name: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  topic: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  schedule: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
});

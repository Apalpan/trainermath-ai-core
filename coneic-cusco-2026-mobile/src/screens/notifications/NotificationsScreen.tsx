import { useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useNotificationStore } from '../../store/notificationStore';

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Notificaciones" subtitle="Avisos del comité" onBack={navigation.goBack} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Sin notificaciones" description="Los avisos importantes aparecerán aquí." />}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => markAsRead(item.id)}>
            <GlassCard style={[styles.card, !item.read && styles.unreadCard]}>
              <View style={[styles.iconBox, !item.read && styles.unreadIcon]}>
                <Bell color={!item.read ? colors.navyDeep : colors.textSecondary} size={18} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.time}>{item.createdAt.replace('T', ' · ').slice(0, 18)}</Text>
              </View>
            </GlassCard>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  unreadCard: {
    borderColor: 'rgba(242,193,24,0.42)',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIcon: {
    backgroundColor: colors.gold,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 20,
  },
  time: {
    color: colors.gold,
    fontSize: typography.tiny,
    fontWeight: '800',
  },
});

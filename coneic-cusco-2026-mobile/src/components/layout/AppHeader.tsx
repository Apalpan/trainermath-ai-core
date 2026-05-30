import { Bell, ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';
import { useNotificationStore } from '../../store/notificationStore';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNotifications?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, onBack, onNotifications, right }: AppHeaderProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={styles.iconButton}>
            <ChevronLeft color={colors.white} size={22} />
          </Pressable>
        ) : null}
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right ??
        (onNotifications ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir notificaciones"
            onPress={onNotifications}
            style={styles.iconButton}
          >
            <Bell color={colors.white} size={20} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.navyDeep,
    fontSize: 10,
    fontWeight: '900',
  },
});

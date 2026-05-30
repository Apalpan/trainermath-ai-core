import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radius, spacing, typography } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
}

export function PrimaryButton({ label, onPress, loading, disabled, icon, accessibilityLabel }: ButtonProps) {
  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {loading ? (
          <ActivityIndicator color={colors.navyDeep} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.navyDeep,
    fontSize: typography.body,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.58,
  },
});

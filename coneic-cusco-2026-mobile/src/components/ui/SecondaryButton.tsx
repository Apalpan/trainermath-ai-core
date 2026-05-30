import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
}

export function SecondaryButton({ label, onPress, disabled, icon, accessibilityLabel }: ButtonProps) {
  const handlePress = async () => {
    if (disabled) return;
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.content}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  disabled: {
    opacity: 0.55,
  },
});

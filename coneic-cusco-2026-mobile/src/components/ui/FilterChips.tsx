import * as Haptics from 'expo-haptics';
import { ScrollView, StyleSheet, Text, Pressable } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';

interface FilterChipsProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  const handleChange = async (next: T) => {
    await Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${option.label}`}
            onPress={() => handleChange(option.value)}
            style={[styles.chip, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  selected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  selectedLabel: {
    color: colors.navyDeep,
  },
});

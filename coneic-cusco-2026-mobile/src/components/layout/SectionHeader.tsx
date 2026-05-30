import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  action: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '800',
  },
});

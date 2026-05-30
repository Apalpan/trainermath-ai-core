import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../constants/theme';

interface InlineFeedbackProps {
  message: string;
  tone?: 'info' | 'success' | 'error';
}

const toneColor = {
  info: colors.purple,
  success: colors.success,
  error: colors.danger,
};

export function InlineFeedback({ message, tone = 'info' }: InlineFeedbackProps) {
  const color = toneColor[tone];
  return (
    <View style={[styles.container, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    fontSize: typography.small,
    fontWeight: '700',
  },
});

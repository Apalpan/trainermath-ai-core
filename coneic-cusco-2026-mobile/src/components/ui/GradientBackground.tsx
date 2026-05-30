import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';

import { gradients } from '../../constants/theme';

export function GradientBackground({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={gradients.app} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.background}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

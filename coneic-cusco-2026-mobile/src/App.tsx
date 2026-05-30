import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './navigation/AppNavigator';

export default function ConeicApp() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

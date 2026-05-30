import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { CertificateCard } from '../../components/cards/CertificateCard';
import { InlineFeedback } from '../../components/feedback/InlineFeedback';
import { AppHeader } from '../../components/layout/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, spacing } from '../../constants/theme';
import { certificates } from '../../mocks/certificates';
import type { Certificate } from '../../types';

export function CertificatesScreen() {
  const navigation = useNavigation<any>();
  const [feedback, setFeedback] = useState('');

  const download = async (certificate: Certificate) => {
    if (certificate.status !== 'available') {
      setFeedback('Certificado disponible al finalizar el evento o al cumplir requisitos.');
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeedback('Descarga simulada. En producción se generará PDF verificable.');
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Certificados" subtitle="Estados y verificación QR" onBack={navigation.goBack} />
      {feedback ? <InlineFeedback tone="info" message={feedback} /> : null}
      <FlatList
        data={certificates}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="Sin certificados" description="Los certificados aparecerán al iniciar el evento." />}
        renderItem={({ item }) => <CertificateCard certificate={item} onDownload={() => download(item)} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
});

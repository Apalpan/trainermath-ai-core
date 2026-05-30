import { SendHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { faqs } from '../../mocks/faqs';
import { assistantService } from '../../services/assistantService';
import type { ChatMessage } from '../../types';
import { shortId } from '../../utils/format';

export function AssistantScreen() {
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      from: 'assistant',
      text: 'Hola, soy CONEIC Assistant. Puedo ayudarte con agenda, QR, horas, certificados, visitas y ubicaciones.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const suggestions = useMemo(() => faqs.slice(0, 6), []);

  const routeTo = (route: string) => {
    if (route === 'AgendaTab' || route === 'MapTab' || route === 'ProfileTab') {
      navigation.navigate(route);
      return;
    }
    if (route === 'Profile') {
      navigation.navigate('ProfileTab');
      return;
    }
    navigation.navigate(route);
  };

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const userMessage: ChatMessage = {
      id: shortId('user'),
      from: 'user',
      text: clean,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    const response = await assistantService.sendMessage(clean);
    setMessages((current) => [...current, response]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Asistente" subtitle="CONEIC Assistant · en línea" />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.message, item.from === 'user' ? styles.userMessage : styles.assistantMessage]}>
            <Text style={[styles.messageText, item.from === 'user' ? styles.userText : styles.assistantText]}>{item.text}</Text>
            {item.actions?.map((action) => (
              <Pressable key={action.label} accessibilityRole="button" onPress={() => routeTo(action.route)} style={styles.actionPill}>
                <Text style={styles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      />

      <View style={styles.suggestions}>
        <FlatList
          horizontal
          data={suggestions}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionContent}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => send(item.question)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{item.question}</Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Mensaje para el asistente"
          placeholder="Pregunta sobre agenda, QR o certificados"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => send()}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Enviar mensaje" onPress={() => send()} style={styles.sendButton}>
          <SendHorizontal color={colors.navyDeep} size={20} />
        </Pressable>
      </View>
      {loading ? <Text style={styles.typing}>CONEIC Assistant está respondiendo...</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messages: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  message: {
    maxWidth: '86%',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.gold,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  messageText: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  userText: {
    color: colors.navyDeep,
    fontWeight: '800',
  },
  assistantText: {
    color: colors.white,
  },
  actionPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(242,193,24,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242,193,24,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: '900',
  },
  suggestions: {
    minHeight: 54,
    marginBottom: spacing.sm,
  },
  suggestionContent: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  suggestion: {
    minHeight: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    maxWidth: 220,
  },
  suggestionText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  inputRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 54,
    color: colors.white,
    fontSize: typography.body,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typing: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});

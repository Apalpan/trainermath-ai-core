import { useNavigation } from '@react-navigation/native';
import { Bot, SendHorizontal, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../../components/layout/AppHeader';
import { ConeicLogo } from '../../components/ui/ConeicLogo';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { assistantQuickPrompts } from '../../mocks/assistantKnowledge';
import { assistantService } from '../../services/assistantService';
import type { ChatMessage } from '../../types';
import { shortId } from '../../utils/format';

export function AssistantScreen() {
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      from: 'assistant',
      text:
        'Hola, soy CONEIC Assistant. Estoy conectado a la base demo del evento: agenda, QR, check-in, horas, certificados, visitas, mapa, pagos y soporte.',
      createdAt: new Date().toISOString(),
      intent: 'welcome',
      confidence: 1,
      sourceLabel: 'Demo knowledge base CONEIC',
      actions: [
        { label: 'Abrir agenda', route: 'AgendaTab' },
        { label: 'Mostrar QR', route: 'ProfileTab' },
      ],
    },
  ]);

  const suggestions = useMemo(() => assistantQuickPrompts, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const routeTo = (route: string) => {
    if (route === 'AgendaTab' || route === 'MapTab' || route === 'ProfileTab' || route === 'AssistantTab') {
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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    const response = await assistantService.sendMessage(clean);
    setMessages((current) => [...current, response]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <ScreenContainer contentStyle={styles.container}>
      <AppHeader title="Asistente IA" subtitle="CONEIC Assistant · demo avanzado" />

      <View style={styles.hero}>
        <ConeicLogo compact />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Chatbot 24/7 del evento</Text>
          <Text style={styles.heroSubtitle}>Respuestas inmediatas sin saturar al comite.</Text>
        </View>
        <Animated.View style={[styles.aiBadge, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}>
          <Bot color={colors.navyDeep} size={18} />
          <Text style={styles.aiBadgeText}>IA demo</Text>
        </Animated.View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.message, item.from === 'user' ? styles.userMessage : styles.assistantMessage]}>
            <Text style={[styles.messageText, item.from === 'user' ? styles.userText : styles.assistantText]}>{item.text}</Text>
            {item.from === 'assistant' && item.sourceLabel ? (
              <View style={styles.sourceRow}>
                <Sparkles color={colors.gold} size={13} />
                <Text style={styles.sourceText}>
                  {item.sourceLabel} · {Math.round((item.confidence ?? 0) * 100)}%
                </Text>
              </View>
            ) : null}
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
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionContent}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => send(item)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Mensaje para el asistente"
          placeholder="Pregunta sobre agenda, QR, pagos o certificados"
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
      {loading ? <Text style={styles.typing}>CONEIC Assistant esta analizando el contexto del evento...</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.small,
    lineHeight: 19,
  },
  aiBadge: {
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  aiBadgeText: {
    color: colors.navyDeep,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  messages: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  message: {
    maxWidth: '90%',
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
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
  },
  sourceText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '700',
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
    maxWidth: 240,
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

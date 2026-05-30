import { assistantKnowledge } from '../mocks/assistantKnowledge';
import type { AssistantKnowledgeItem, ChatMessage } from '../types';
import { shortId } from '../utils/format';
import { delay } from './delay';

const fallback: AssistantKnowledgeItem = {
  id: 'fallback',
  intent: 'fallback',
  title: 'Orientacion general',
  answer:
    'Puedo ayudarte con agenda, QR, check-in, horas, certificados, visitas, mapa, pagos y soporte. Si quieres, preguntame por tu proximo evento o por como funcionara el check-in del CONEIC.',
  keywords: [],
  sourceLabel: 'Demo knowledge base CONEIC',
  confidence: 0.62,
  actions: [
    { label: 'Abrir agenda', route: 'AgendaTab' },
    { label: 'Mostrar QR', route: 'ProfileTab' },
    { label: 'Soporte', route: 'Settings' },
  ],
};

function scoreKnowledge(input: string, item: AssistantKnowledgeItem) {
  const normalized = input.toLowerCase();
  return item.keywords.reduce((score, keyword) => {
    return normalized.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

function resolveKnowledge(input: string) {
  const ranked = assistantKnowledge
    .map((item) => ({ item, score: scoreKnowledge(input, item) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].item : fallback;
}

export const assistantService = {
  async sendMessage(input: string): Promise<ChatMessage> {
    const match = resolveKnowledge(input);

    return delay(
      {
        id: shortId('assistant'),
        from: 'assistant',
        text: match.answer,
        createdAt: new Date().toISOString(),
        actions: match.actions,
        intent: match.intent,
        confidence: match.confidence,
        sourceLabel: match.sourceLabel,
      },
      520,
      980,
    );
  },
};

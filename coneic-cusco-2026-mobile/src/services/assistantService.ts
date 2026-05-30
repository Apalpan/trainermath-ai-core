import { faqs } from '../mocks/faqs';
import type { ChatMessage } from '../types';
import { shortId } from '../utils/format';
import { delay } from './delay';

const fallback = {
  answer:
    'Puedo ayudarte con agenda, QR, certificados, visitas, mapa y asistencia. Prueba con una pregunta rápida para llevarte a la sección correcta.',
};

export const assistantService = {
  async sendMessage(input: string): Promise<ChatMessage> {
    const normalized = input.toLowerCase();
    const faq = faqs.find((item) => item.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())));
    const text = faq?.answer ?? fallback.answer;

    return delay(
      {
        id: shortId('assistant'),
        from: 'assistant',
        text,
        createdAt: new Date().toISOString(),
        actions: faq?.actionRoute && faq.actionLabel ? [{ label: faq.actionLabel, route: faq.actionRoute }] : undefined,
      },
      280,
      680,
    );
  },
};

import type { TrainingSession } from '../types';
import { categoryLabels, cepreBlockLabels, multiplicationTypeLabels } from '../types';

export const TARGET_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1FT7gKsw5UKavMafbbtJaRianQi-Lj529Nfecq9IbVcI/edit?gid=0#gid=0';
export const TARGET_SHEET_ID = '1FT7gKsw5UKavMafbbtJaRianQi-Lj529Nfecq9IbVcI';

const ENDPOINT_KEY = 'trainermath-v2:sheet-endpoint';
const QUEUE_KEY = 'trainermath-v2:sheet-sync-queue';

export interface SheetSessionRow {
  session_id: string;
  created_at: string;
  trainer: string;
  kind: string;
  level: string;
  block_or_category: string;
  mode: string;
  amount: number | string;
  total_time_ms: number;
  avg_time_ms: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  elo: number;
  level_tag: string;
  status: string;
  weakest_topic: string;
  best_topic: string;
  recommendation: string;
}

export interface SheetAnswerRow {
  session_id: string;
  question_index: number;
  trainer: string;
  category: string;
  block: string;
  topic: string;
  microtopic: string;
  question_type: string;
  prompt: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  error_type: string;
}

export interface SheetPayload {
  version: 'trainer-2.0';
  target_sheet_id: string;
  session: SheetSessionRow;
  answers: SheetAnswerRow[];
}

const safeRead = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const isAllowedSheetPayload = (payload: SheetPayload) => {
  const blockOrCategory = payload.session.block_or_category;
  const hasAllowedSession =
    payload.session.kind === 'flashAnzan'
    || payload.session.kind === 'multiplicationSprint'
    || blockOrCategory in categoryLabels
    || blockOrCategory in cepreBlockLabels
    || blockOrCategory in multiplicationTypeLabels;

  return (
    hasAllowedSession
    && payload.answers.every((answer) => (
      answer.category in categoryLabels
      && (!answer.block || answer.block in cepreBlockLabels)
      && answer.question_type !== 'lectura'
      && answer.error_type !== 'lectura'
    ))
  );
};

const readQueue = () => {
  const queue = safeRead<SheetPayload[]>(QUEUE_KEY, []);
  const cleanQueue = queue.filter(isAllowedSheetPayload);
  if (cleanQueue.length !== queue.length) safeWrite(QUEUE_KEY, cleanQueue);
  return cleanQueue;
};

const configValue = (session: TrainingSession, field: string) => {
  const config = session.config as unknown as Record<string, unknown>;
  const value = config[field];
  return value === undefined || value === null ? '' : String(value);
};

export const buildSheetPayload = (session: TrainingSession): SheetPayload => {
  const trainer = session.kind === 'cepreExam' ? 'Entrenador Examen CEPRE' : session.kind === 'flashAnzan' ? 'Flash Anzan' : session.kind === 'multiplicationSprint' ? 'Multiplicaciones rápidas' : 'Trainer Math 2.0';
  const blockOrCategory = configValue(session, 'block') || configValue(session, 'category') || configValue(session, 'multiplicationType') || 'flashAnzan';
  const amount = configValue(session, 'amount') || configValue(session, 'terms') || 1;

  return {
    version: 'trainer-2.0',
    target_sheet_id: TARGET_SHEET_ID,
    session: {
      session_id: session.id,
      created_at: session.createdAt,
      trainer,
      kind: session.kind,
      level: configValue(session, 'level'),
      block_or_category: blockOrCategory,
      mode: configValue(session, 'mode') || configValue(session, 'advanceMode'),
      amount,
      total_time_ms: Math.round(session.metrics.totalTimeMs),
      avg_time_ms: Math.round(session.metrics.averageTimeMs),
      accuracy: session.metrics.accuracy,
      correct: session.metrics.correct,
      incorrect: session.metrics.incorrect,
      elo: session.metrics.elo,
      level_tag: session.metrics.levelTag,
      status: session.metrics.status,
      weakest_topic: session.metrics.weakestCategory,
      best_topic: session.metrics.bestCategory,
      recommendation: session.metrics.recommendation,
    },
    answers: session.answers.map((answer, index) => ({
      session_id: session.id,
      question_index: index + 1,
      trainer: answer.trainer === 'cepre' ? 'Entrenador Examen CEPRE' : answer.trainer === 'math' ? trainer : trainer,
      category: answer.category,
      block: answer.block || '',
      topic: answer.topic || '',
      microtopic: answer.microtopic || '',
      question_type: answer.questionType || '',
      prompt: answer.prompt,
      selected_answer: answer.input,
      correct_answer: answer.correctAnswer,
      is_correct: answer.isCorrect,
      response_time_ms: Math.round(answer.responseTimeMs),
      error_type: answer.errorType || (answer.isCorrect ? 'ninguno' : 'calculo'),
    })),
  };
};

export const getSheetEndpoint = () => {
  try {
    return localStorage.getItem(ENDPOINT_KEY) || '';
  } catch {
    return '';
  }
};

export const setSheetEndpoint = (endpoint: string) => {
  localStorage.setItem(ENDPOINT_KEY, endpoint.trim());
};

export const getPendingSyncCount = () => readQueue().length;

export const queueSheetSync = (session: TrainingSession) => {
  const queue = readQueue();
  const payload = buildSheetPayload(session);
  if (!queue.some((item) => item.session.session_id === payload.session.session_id)) {
    queue.push(payload);
    safeWrite(QUEUE_KEY, queue);
  }
  return queue.length;
};

export const flushSheetSync = async () => {
  const endpoint = getSheetEndpoint();
  const queue = readQueue();
  if (!endpoint || queue.length === 0) {
    return { sent: 0, pending: queue.length, configured: Boolean(endpoint) };
  }

  const pending: SheetPayload[] = [];
  let sent = 0;

  for (const payload of queue) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      sent += 1;
    } catch {
      pending.push(payload);
    }
  }

  safeWrite(QUEUE_KEY, pending);
  return { sent, pending: pending.length, configured: true };
};

import type { TrainingSession, UserAnswer } from '../types';
import { categoryLabels, cepreBlockLabels, multiplicationTypeLabels } from '../types';

const STORAGE_KEY = 'math-sprint-coach:sessions';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const hasAllowedConfig = (session: TrainingSession) => {
  const config = session.config as unknown;
  if (!isRecord(config)) return false;
  if (session.kind === 'flashAnzan') return typeof config.terms === 'number' && typeof config.digits === 'number';
  if (session.kind === 'multiplicationSprint') return typeof config.multiplicationType === 'string' && config.multiplicationType in multiplicationTypeLabels;
  if (session.kind === 'doubleX2') return typeof config.start === 'number' && config.start > 0;
  if (session.kind === 'flashCards') return Array.isArray(config.decks) && typeof config.amount === 'number';
  if (session.kind === 'blitz') return typeof config.durationSec === 'number' && config.durationSec >= 30;
  if (session.kind === 'digitSpan') return typeof config.rounds === 'number' && config.rounds > 0;
  if ('category' in config) return typeof config.category === 'string' && config.category in categoryLabels;
  if ('block' in config) return typeof config.block === 'string' && config.block in cepreBlockLabels;
  return false;
};

const hasAllowedAnswer = (answer: UserAnswer) => (
  Boolean(answer)
  && typeof answer.category === 'string'
  && answer.category in categoryLabels
  && (!answer.block || answer.block in cepreBlockLabels)
  && (answer.questionType as string | undefined) !== 'lectura'
  && (answer.errorType as string | undefined) !== 'lectura'
);

const sanitizeSessions = (sessions: TrainingSession[]) => {
  const cleanSessions = sessions.filter((session) => (
    hasAllowedConfig(session)
    && Array.isArray(session.answers)
    && session.answers.length > 0
    && session.answers.every(hasAllowedAnswer)
  ));

  if (cleanSessions.length !== sessions.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanSessions));
  }

  return cleanSessions;
};

export const loadSessions = (): TrainingSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as TrainingSession[];
    return Array.isArray(sessions) ? sanitizeSessions(sessions) : [];
  } catch {
    return [];
  }
};

export const saveSession = (session: TrainingSession) => {
  const sessions = [session, ...loadSessions()].slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return sessions;
};

export const updateSessionSyncStatus = (sessionId: string, syncStatus: TrainingSession['syncStatus']) => {
  const sessions = loadSessions().map((session) => (session.id === sessionId ? { ...session, syncStatus } : session));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return sessions;
};

export const clearSessions = () => {
  localStorage.removeItem(STORAGE_KEY);
};

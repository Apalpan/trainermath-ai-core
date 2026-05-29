import type { TrainingSession } from '../types';

const STORAGE_KEY = 'math-sprint-coach:sessions';

export const loadSessions = (): TrainingSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as TrainingSession[];
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return [];
  }
};

export const saveSession = (session: TrainingSession) => {
  const sessions = [session, ...loadSessions()].slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return sessions;
};

export const clearSessions = () => {
  localStorage.removeItem(STORAGE_KEY);
};

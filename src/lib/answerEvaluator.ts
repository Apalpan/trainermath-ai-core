import type { Exercise } from '../types';

const parseAnswer = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.').toLowerCase();
  if (!normalized) return null;

  if (normalized.includes('/')) {
    const [top, bottom] = normalized.split('/').map((item) => Number(item.trim()));
    if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) return null;
    return top / bottom;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const evaluateAnswer = (exercise: Exercise, input: string) => {
  const normalizedText = input.trim().replace(/\s/g, '').toLowerCase();
  const acceptedText = exercise.acceptedText?.map((item) =>
    item.replace(/\s/g, '').toLowerCase(),
  );

  if (acceptedText?.includes(normalizedText)) {
    return true;
  }

  const parsed = parseAnswer(input);
  if (parsed === null) return false;

  return Math.abs(parsed - exercise.answer) < 0.001;
};

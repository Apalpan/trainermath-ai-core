export type Level = 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export type Category =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fractions'
  | 'powers'
  | 'roots'
  | 'algebra'
  | 'combined'
  | 'percentages'
  | 'series'
  | 'reasoning'
  | 'mixed';

export type TrainingMode = 'accuracy' | 'speed' | 'mixed';
export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export type DrillKind = 'operations' | 'flashAnzan';
export type AnzanOperationMode = 'addition' | 'additionSubtraction';
export type AnzanAdvanceMode = 'timed' | 'manual';
export type AnzanPreset = 'easy' | 'medium' | 'hard' | 'expert' | 'custom';

export interface TrainingConfig {
  level: Level;
  category: Category;
  amount: number;
  mode: TrainingMode;
  instantFeedback: boolean;
}

export interface AnzanConfig {
  digits: number;
  terms: number;
  displayMs: number;
  operationMode: AnzanOperationMode;
  advanceMode: AnzanAdvanceMode;
  instantFeedback: boolean;
  preset: AnzanPreset;
}

export interface AnswerChoice {
  key: ChoiceKey;
  label: string;
  value: number;
  isCorrect: boolean;
}

export interface Exercise {
  id: string;
  category: Exclude<Category, 'mixed'>;
  prompt: string;
  answer: number;
  answerLabel: string;
  choices: AnswerChoice[];
  acceptedText?: string[];
  explanation: string;
}

export interface AnzanTerm {
  id: string;
  value: number;
  signedValue: number;
  label: string;
}

export interface AnzanExercise {
  id: string;
  terms: AnzanTerm[];
  answer: number;
  answerLabel: string;
  choices: AnswerChoice[];
  prompt: string;
  explanation: string;
}

export interface UserAnswer {
  exerciseId: string;
  category: Exclude<Category, 'mixed'>;
  prompt: string;
  input: string;
  correctAnswer: string;
  isCorrect: boolean;
  answeredAtMs: number;
  responseTimeMs: number;
}

export interface SessionMetrics {
  totalTimeMs: number;
  averageTimeMs: number;
  fastestTimeMs: number;
  slowestTimeMs: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  speedScore: number;
  recommendation: string;
  analysis: string;
  weakestCategory: string;
  slowestPrompt: string;
  improvementFocus: string[];
  elo: number;
  levelTag: string;
  streakImpact: number;
  bestCategory: string;
  status: string;
  enduranceInsight: string;
}

export interface TrainingSession {
  id: string;
  createdAt: string;
  kind: DrillKind;
  config: TrainingConfig | AnzanConfig;
  metrics: SessionMetrics;
  answers: UserAnswer[];
}

export const categoryLabels: Record<Category, string> = {
  addition: 'Sumas',
  subtraction: 'Restas',
  multiplication: 'Multiplicaciones',
  division: 'Divisiones',
  fractions: 'Fracciones',
  powers: 'Potencias',
  roots: 'Raíces',
  algebra: 'Álgebra básica',
  combined: 'Combinadas',
  percentages: 'Porcentajes',
  series: 'Series',
  reasoning: 'Razonamiento',
  mixed: 'Todo operaciones',
};

export const levelLabels: Record<Level, string> = {
  level1: 'Nivel 1 · Base',
  level2: 'Nivel 2 · Rápido',
  level3: 'Nivel 3 · Intermedio',
  level4: 'Nivel 4 · Avanzado',
  level5: 'Nivel 5 · Experto',
};

export const modeLabels: Record<TrainingMode, string> = {
  accuracy: 'Precisión',
  speed: 'Velocidad',
  mixed: 'Reto mixto',
};

export const drillLabels: Record<DrillKind, string> = {
  operations: 'Operaciones',
  flashAnzan: 'Flash Anzan',
};

export const anzanOperationLabels: Record<AnzanOperationMode, string> = {
  addition: 'Solo sumas',
  additionSubtraction: 'Sumas y restas',
};

export const anzanAdvanceLabels: Record<AnzanAdvanceMode, string> = {
  timed: 'Aparición por tiempo',
  manual: 'Mover con flechas',
};

export const anzanPresetLabels: Record<AnzanPreset, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
  expert: 'Experto',
  custom: 'Manual',
};

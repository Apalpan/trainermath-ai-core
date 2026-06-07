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
  | 'ratios'
  | 'divisibility'
  | 'averages'
  | 'series'
  | 'mixed';

export type TrainingMode = 'accuracy' | 'speed' | 'mixed';
export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export type TrainerProduct = 'math' | 'cepre';
export type DrillKind = 'operations' | 'flashAnzan' | 'multiplicationSprint' | 'cepreExam';
export type AnzanOperationMode = 'addition' | 'additionSubtraction';
export type AnzanAdvanceMode = 'timed' | 'manual';
export type AnzanPreset = 'easy' | 'medium' | 'hard' | 'expert' | 'custom';
export type MultiplicationType = 'oneByOne' | 'oneByTwo' | 'twoByTwo' | 'chain' | 'doubleInfinity' | 'mixed';

export type CepreBlock = 'numbers' | 'algebra' | 'mixed';
export type CepreMode = 'diagnostic' | 'practice' | 'simulation' | 'errorReview';
export type CepreQuestionType = 'calculo' | 'problema' | 'simulacro';
export type ErrorType = 'calculo' | 'signo' | 'formula' | 'planteamiento' | 'tiempo' | 'ninguno';
export type SyncStatus = 'synced' | 'pending' | 'failed';

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

export interface MultiplicationConfig {
  level: Level;
  amount: number;
  mode: TrainingMode;
  multiplicationType: MultiplicationType;
  instantFeedback: boolean;
}

export interface CepreConfig {
  block: CepreBlock;
  level: Level;
  amount: number;
  mode: CepreMode;
  instantFeedback: boolean;
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
  trainer?: TrainerProduct;
  block?: CepreBlock;
  topic?: string;
  microtopic?: string;
  questionType?: CepreQuestionType;
  skill?: string;
  expectedError?: ErrorType;
  targetTimeSec?: number;
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
  trainer?: TrainerProduct;
  block?: CepreBlock;
  topic?: string;
  microtopic?: string;
  questionType?: CepreQuestionType;
  errorType?: ErrorType;
  explanation?: string;
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
  generalElo?: number;
  modeElo?: number;
  eloDelta?: number;
  modeEloDelta?: number;
  kFactor?: number;
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
  config: TrainingConfig | AnzanConfig | MultiplicationConfig | CepreConfig;
  metrics: SessionMetrics;
  answers: UserAnswer[];
  syncStatus?: SyncStatus;
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
  combined: 'Operaciones combinadas',
  percentages: 'Porcentajes',
  ratios: 'Razones y regla de tres',
  divisibility: 'MCD, MCM y divisibilidad',
  averages: 'Promedios',
  series: 'Series',
  mixed: 'Simulacro mixto',
};

export const levelLabels: Record<Level, string> = {
  level1: 'Nivel 1 - Base',
  level2: 'Nivel 2 - Rápido',
  level3: 'Nivel 3 - Intermedio',
  level4: 'Nivel 4 - Avanzado',
  level5: 'Nivel 5 - Experto',
};

export const modeLabels: Record<TrainingMode, string> = {
  accuracy: 'Precisión',
  speed: 'Velocidad',
  mixed: 'Reto mixto',
};

export const drillLabels: Record<DrillKind, string> = {
  operations: 'Operaciones diversas',
  flashAnzan: 'Flash Anzan',
  multiplicationSprint: 'Multiplicaciones rápidas',
  cepreExam: 'Entrenador Examen CEPRE',
};

export const multiplicationTypeLabels: Record<MultiplicationType, string> = {
  oneByOne: '1 x 1',
  oneByTwo: '1 x 2',
  twoByTwo: '2 x 2',
  chain: 'Multiplicación encadenada',
  doubleInfinity: 'Doble infinito',
  mixed: 'Mixto',
};

export const anzanOperationLabels: Record<AnzanOperationMode, string> = {
  addition: 'Solo sumas',
  additionSubtraction: 'Sumas y restas',
};

export const anzanAdvanceLabels: Record<AnzanAdvanceMode, string> = {
  timed: 'Aparición automática',
  manual: 'Mover con flechas',
};

export const anzanPresetLabels: Record<AnzanPreset, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
  expert: 'Experto',
  custom: 'Manual',
};

export const cepreBlockLabels: Record<CepreBlock, string> = {
  numbers: 'Números y operaciones',
  algebra: 'Álgebra',
  mixed: 'Números + álgebra',
};

export const cepreModeLabels: Record<CepreMode, string> = {
  diagnostic: 'Diagnóstico',
  practice: 'Práctica focalizada',
  simulation: 'Simulacro',
  errorReview: 'Reparación de errores',
};

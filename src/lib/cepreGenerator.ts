import type { AnswerChoice, CepreBlock, CepreConfig, ChoiceKey, Exercise, Level } from '../types';
import { fractionText, gcd, numericChoices, pick, rand, shuffle } from './exerciseGenerator';

const choiceKeys: ChoiceKey[] = ['A', 'B', 'C', 'D'];

const levelScale: Record<Level, number> = {
  level1: 1,
  level2: 1.35,
  level3: 1.75,
  level4: 2.25,
  level5: 2.8,
};

const assignChoices = (labels: string[], correctIndex: number): AnswerChoice[] =>
  shuffle(labels.map((label, index) => ({ label, value: index, isCorrect: index === correctIndex })))
    .slice(0, 4)
    .map((choice, index) => ({ ...choice, key: choiceKeys[index] }));

const createCepreExercise = (exercise: Omit<Exercise, 'id' | 'trainer'>): Exercise => ({
  ...exercise,
  id: crypto.randomUUID(),
  trainer: 'cepre',
});

const numberProblem = (level: Level): Exercise => {
  const scale = levelScale[level];
  const type = pick(['fraction', 'percentage', 'sets', 'mcm', 'combined'] as const);

  if (type === 'fraction') {
    const denominator = rand(6, Math.round(12 * scale));
    const numerator = rand(2, denominator - 2);
    const value = rand(24, Math.round(80 * scale));
    const answer = (value * numerator) / denominator;
    const rounded = Math.round(answer);
    return createCepreExercise({
      category: 'fractions',
      block: 'numbers',
      topic: 'Fracciones',
      microtopic: 'Parte de un total',
      questionType: 'problema',
      skill: 'Traducir fracción a operación directa',
      expectedError: 'planteamiento',
      targetTimeSec: 70,
      prompt: `De ${value} estudiantes, ${fractionText(numerator, denominator)} aprobó. ¿Cuántos aprobaron?`,
      answer: rounded,
      answerLabel: String(rounded),
      choices: numericChoices(rounded, String(rounded), 3),
      explanation: `${value} × ${numerator}/${denominator} = ${rounded}.`,
    });
  }

  if (type === 'percentage') {
    const base = rand(12, Math.round(45 * scale)) * 10;
    const percent = pick([10, 12, 15, 20, 25, 30, 40, 50]);
    const answer = (base * percent) / 100;
    return createCepreExercise({
      category: 'percentages',
      block: 'numbers',
      topic: 'Porcentajes',
      microtopic: 'Porcentaje de una cantidad',
      questionType: 'calculo',
      skill: 'Calcular porcentaje mentalmente',
      expectedError: 'calculo',
      targetTimeSec: 55,
      prompt: `¿Cuál es el ${percent}% de ${base}?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 5),
      explanation: `${base} × ${percent}/100 = ${answer}.`,
    });
  }

  if (type === 'sets') {
    const a = rand(20, Math.round(50 * scale));
    const b = rand(18, Math.round(45 * scale));
    const both = rand(5, Math.min(a, b, 22));
    const answer = a + b - both;
    return createCepreExercise({
      category: 'reasoning',
      block: 'numbers',
      topic: 'Conjuntos',
      microtopic: 'Unión de dos conjuntos',
      questionType: 'problema',
      skill: 'Usar inclusión-exclusión',
      expectedError: 'formula',
      targetTimeSec: 85,
      prompt: `En un grupo, ${a} prefieren A, ${b} prefieren B y ${both} ambos. ¿Cuántos prefieren al menos una opción?`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 4),
      explanation: `A ∪ B = ${a} + ${b} - ${both} = ${answer}.`,
    });
  }

  if (type === 'mcm') {
    const a = pick([6, 8, 9, 10, 12, 15]);
    const b = pick([8, 12, 14, 15, 18, 20]);
    const answer = Math.abs(a * b) / gcd(a, b);
    return createCepreExercise({
      category: 'divisibility',
      block: 'numbers',
      topic: 'Divisibilidad',
      microtopic: 'MCM',
      questionType: 'calculo',
      skill: 'Identificar múltiplos comunes',
      expectedError: 'calculo',
      targetTimeSec: 60,
      prompt: `MCM(${a}, ${b})`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 6),
      explanation: `El menor múltiplo común de ${a} y ${b} es ${answer}.`,
    });
  }

  const a = rand(8, Math.round(30 * scale));
  const b = rand(3, 12);
  const c = rand(6, Math.round(35 * scale));
  const answer = a * b + c;
  return createCepreExercise({
    category: 'combined',
    block: 'numbers',
    topic: 'Operaciones combinadas',
    microtopic: 'Jerarquía de operaciones',
    questionType: 'calculo',
    skill: 'Aplicar prioridad de multiplicación',
    expectedError: 'calculo',
    targetTimeSec: 50,
    prompt: `${c} + ${a} × ${b}`,
    answer,
    answerLabel: String(answer),
    choices: numericChoices(answer, String(answer), 5),
    explanation: `Primero ${a} × ${b} = ${a * b}; luego + ${c} = ${answer}.`,
  });
};

const algebraProblem = (level: Level): Exercise => {
  const scale = levelScale[level];
  const type = pick(['linear', 'system', 'notable', 'factor', 'polynomial'] as const);

  if (type === 'linear') {
    const x = rand(2, Math.round(12 * scale));
    const a = rand(2, Math.round(6 * scale));
    const b = rand(3, Math.round(18 * scale));
    const total = a * x + b;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Ecuaciones de primer grado',
      microtopic: 'Despeje lineal',
      questionType: 'calculo',
      skill: 'Despejar x',
      expectedError: 'signo',
      targetTimeSec: 65,
      prompt: `${a}x + ${b} = ${total}. Halla x.`,
      answer: x,
      answerLabel: String(x),
      choices: numericChoices(x, String(x), 2),
      explanation: `x = (${total} - ${b}) ÷ ${a} = ${x}.`,
    });
  }

  if (type === 'system') {
    const x = rand(1, Math.round(8 * scale));
    const y = rand(1, Math.round(8 * scale));
    const sum = x + y;
    const diff = x - y;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Sistemas de ecuaciones',
      microtopic: 'Suma y diferencia',
      questionType: 'problema',
      skill: 'Resolver sistema rápido',
      expectedError: 'planteamiento',
      targetTimeSec: 95,
      prompt: `x + y = ${sum} y x - y = ${diff}. Halla x.`,
      answer: x,
      answerLabel: String(x),
      choices: numericChoices(x, String(x), 2),
      explanation: `Sumando ecuaciones: 2x = ${sum + diff}; x = ${x}.`,
    });
  }

  if (type === 'notable') {
    const a = rand(4, Math.round(12 * scale));
    const b = rand(2, Math.round(8 * scale));
    const answer = a * a - b * b;
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Productos notables',
      microtopic: 'Diferencia de cuadrados',
      questionType: 'calculo',
      skill: 'Aplicar (a+b)(a-b)',
      expectedError: 'formula',
      targetTimeSec: 60,
      prompt: `(${a}+${b})(${a}-${b})`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 6),
      explanation: `a² - b² = ${a}² - ${b}² = ${answer}.`,
    });
  }

  if (type === 'factor') {
    const root = rand(2, Math.round(8 * scale));
    return createCepreExercise({
      category: 'algebra',
      block: 'algebra',
      topic: 'Factorización',
      microtopic: 'Raíz de factor lineal',
      questionType: 'calculo',
      skill: 'Leer factor igualado a cero',
      expectedError: 'signo',
      targetTimeSec: 55,
      prompt: `Si (x - ${root})(x + 3) = 0, una raíz positiva es`,
      answer: root,
      answerLabel: String(root),
      choices: numericChoices(root, String(root), 2),
      explanation: `x - ${root} = 0, por tanto x = ${root}.`,
    });
  }

  const a = rand(2, Math.round(7 * scale));
  const x = rand(2, 5);
  const answer = a * x * x + 2 * x - 1;
  return createCepreExercise({
    category: 'algebra',
    block: 'algebra',
    topic: 'Polinomios',
    microtopic: 'Evaluación polinómica',
    questionType: 'calculo',
    skill: 'Sustituir y operar',
    expectedError: 'calculo',
    targetTimeSec: 75,
    prompt: `P(x) = ${a}x² + 2x - 1. Halla P(${x}).`,
    answer,
    answerLabel: String(answer),
    choices: numericChoices(answer, String(answer), 5),
    explanation: `${a}(${x})² + 2(${x}) - 1 = ${answer}.`,
  });
};

const geometryProblem = (level: Level): Exercise => {
  const scale = levelScale[level];
  const type = pick(['angles', 'parallel', 'pythagoras', 'area', 'similarity'] as const);

  if (type === 'angles') {
    const a = rand(35, 80);
    const b = rand(35, 80);
    const answer = 180 - a - b;
    return createCepreExercise({
      category: 'geometry',
      block: 'geometry',
      topic: 'Triángulos',
      microtopic: 'Suma de ángulos internos',
      questionType: 'visual',
      skill: 'Completar ángulo faltante',
      expectedError: 'formula',
      targetTimeSec: 60,
      prompt: `En un triángulo, dos ángulos miden ${a}° y ${b}°. El tercero mide`,
      answer,
      answerLabel: `${answer}°`,
      choices: numericChoices(answer, `${answer}°`, 4),
      explanation: `180° - ${a}° - ${b}° = ${answer}°.`,
    });
  }

  if (type === 'parallel') {
    const angle = rand(35, 140);
    const answer = 180 - angle;
    return createCepreExercise({
      category: 'geometry',
      block: 'geometry',
      topic: 'Ángulos entre paralelas',
      microtopic: 'Suplementarios',
      questionType: 'visual',
      skill: 'Reconocer pares suplementarios',
      expectedError: 'formula',
      targetTimeSec: 70,
      prompt: `Dos ángulos interiores consecutivos entre paralelas suman 180°. Si uno mide ${angle}°, el otro mide`,
      answer,
      answerLabel: `${answer}°`,
      choices: numericChoices(answer, `${answer}°`, 4),
      explanation: `180° - ${angle}° = ${answer}°.`,
    });
  }

  if (type === 'pythagoras') {
    const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25]];
    const [a, b, c] = pick(triples);
    return createCepreExercise({
      category: 'geometry',
      block: 'geometry',
      topic: 'Teorema de Pitágoras',
      microtopic: 'Hipotenusa',
      questionType: 'visual',
      skill: 'Reconocer terna pitagórica',
      expectedError: 'formula',
      targetTimeSec: 70,
      prompt: `Catetos ${a} y ${b}. ¿Hipotenusa?`,
      answer: c,
      answerLabel: String(c),
      choices: numericChoices(c, String(c), 2),
      explanation: `${a}² + ${b}² = ${c}².`,
    });
  }

  if (type === 'area') {
    const base = rand(6, Math.round(18 * scale));
    const height = rand(4, Math.round(14 * scale));
    const answer = (base * height) / 2;
    return createCepreExercise({
      category: 'geometry',
      block: 'geometry',
      topic: 'Áreas de regiones triangulares',
      microtopic: 'Base por altura',
      questionType: 'calculo',
      skill: 'Aplicar fórmula de área',
      expectedError: 'formula',
      targetTimeSec: 60,
      prompt: `Área de un triángulo con b=${base} y h=${height}`,
      answer,
      answerLabel: String(answer),
      choices: numericChoices(answer, String(answer), 3),
      explanation: `A = ${base} × ${height} ÷ 2 = ${answer}.`,
    });
  }

  const small = rand(3, 8);
  const ratio = rand(2, Math.round(4 * scale));
  const answer = small * ratio;
  return createCepreExercise({
    category: 'geometry',
    block: 'geometry',
    topic: 'Semejanza de triángulos',
    microtopic: 'Razón de semejanza',
    questionType: 'problema',
    skill: 'Escalar lados proporcionales',
    expectedError: 'planteamiento',
    targetTimeSec: 85,
    prompt: `Dos triángulos son semejantes con razón ${ratio}:1. Si un lado menor mide ${small}, el correspondiente mayor mide`,
    answer,
    answerLabel: String(answer),
    choices: numericChoices(answer, String(answer), 2),
    explanation: `${small} × ${ratio} = ${answer}.`,
  });
};

const readingProblem = (block: Extract<CepreBlock, 'readingComprehension' | 'readingInterpretive' | 'readingCritical'>): Exercise => {
  const items = {
    readingComprehension: [
      {
        text: 'Un estudiante mejora su rendimiento cuando revisa sus errores inmediatamente después de practicar, porque transforma fallas aisladas en patrones corregibles.',
        question: 'La idea central del texto es que',
        correct: 'revisar errores permite convertir fallas en aprendizaje.',
        wrong: ['la práctica sin revisión siempre es suficiente.', 'los errores deben evitarse por completo.', 'el rendimiento depende solo del tiempo estudiado.'],
        topic: 'Análisis y síntesis',
        microtopic: 'Idea principal',
        explanation: 'El texto enfatiza la revisión de errores como mecanismo de mejora.',
      },
      {
        text: 'La velocidad sin precisión produce una ilusión de dominio: se responde rápido, pero se consolidan errores que luego son difíciles de corregir.',
        question: 'Según el texto, el riesgo principal de priorizar solo velocidad es',
        correct: 'reforzar errores por falta de precisión.',
        wrong: ['reducir el número de preguntas.', 'eliminar la necesidad de practicar.', 'mejorar automáticamente la memoria.'],
        topic: 'Análisis y síntesis',
        microtopic: 'Idea explícita',
        explanation: 'El riesgo señalado es consolidar errores al responder rápido sin control.',
      },
    ],
    readingInterpretive: [
      {
        text: 'Aunque el simulacro no predice todo el examen, revela hábitos invisibles: distracciones, fatiga y temas que parecen dominados hasta que aparece presión.',
        question: 'Se puede inferir que el simulacro sirve para',
        correct: 'detectar hábitos y debilidades bajo condiciones reales.',
        wrong: ['garantizar el resultado final.', 'evitar estudiar teoría.', 'memorizar todas las respuestas posibles.'],
        topic: 'Inferencias',
        microtopic: 'Inferencia contextual',
        explanation: 'El texto dice que revela hábitos invisibles cuando hay presión.',
      },
      {
        text: 'Un argumento sólido no se mide por su extensión, sino por la relación entre evidencia, conclusión y ausencia de contradicciones.',
        question: 'El criterio defendido por el texto es',
        correct: 'coherencia entre evidencia y conclusión.',
        wrong: ['cantidad de palabras utilizadas.', 'uso de frases complejas.', 'opinión de la mayoría.'],
        topic: 'Inferencias',
        microtopic: 'Criterio implícito',
        explanation: 'La fortaleza argumentativa se vincula con coherencia y evidencia.',
      },
    ],
    readingCritical: [
      {
        text: '“Todos usan esta técnica, por lo tanto debe ser la mejor”.',
        question: 'El razonamiento anterior presenta principalmente',
        correct: 'apelación a la popularidad.',
        wrong: ['generalización estadística válida.', 'definición precisa.', 'analogía demostrativa.'],
        topic: 'Paráfrasis y argumentación',
        microtopic: 'Falacia',
        explanation: 'Se asume que algo es mejor solo porque muchas personas lo usan.',
      },
      {
        text: 'Tesis: La práctica debe medirse. Razón: sin medición, el estudiante no distingue entre avance real y sensación de avance.',
        question: 'La función de la razón es',
        correct: 'justificar la necesidad de medir la práctica.',
        wrong: ['contradecir la tesis.', 'presentar un ejemplo ajeno.', 'definir qué es un examen.'],
        topic: 'Tesis, argumentos y síntesis',
        microtopic: 'Relación tesis-argumento',
        explanation: 'La razón sostiene directamente la tesis propuesta.',
      },
    ],
  };

  const item = pick(items[block]);
  const labels = [item.correct, ...item.wrong];
  return createCepreExercise({
    category: 'reasoning',
    block,
    topic: item.topic,
    microtopic: item.microtopic,
    questionType: 'lectura',
    skill: block === 'readingCritical' ? 'Evaluar argumento' : 'Leer con evidencia',
    expectedError: 'lectura',
    targetTimeSec: 115,
    prompt: `${item.text}\n\n${item.question}`,
    answer: 0,
    answerLabel: item.correct,
    choices: assignChoices(labels, 0),
    explanation: item.explanation,
  });
};

const createByBlock = (block: CepreBlock, level: Level): Exercise => {
  if (block === 'numbers') return numberProblem(level);
  if (block === 'algebra') return algebraProblem(level);
  if (block === 'geometry') return geometryProblem(level);
  if (block === 'readingComprehension' || block === 'readingInterpretive' || block === 'readingCritical') return readingProblem(block);

  return pick([
    () => numberProblem(level),
    () => algebraProblem(level),
    () => geometryProblem(level),
    () => readingProblem('readingComprehension'),
    () => readingProblem('readingInterpretive'),
    () => readingProblem('readingCritical'),
  ])();
};

export const generateCepreExercises = (config: CepreConfig): Exercise[] =>
  Array.from({ length: config.amount }, () => createByBlock(config.block, config.level));

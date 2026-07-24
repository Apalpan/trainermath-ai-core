// Reglas de calidad numérica del motor v3: los números deben "sentirse bien".

/** Bases válidas por porcentaje para que el resultado sea SIEMPRE entero. */
export const percentDivisor: Record<number, number> = {
  5: 20,
  10: 10,
  12.5: 8,
  15: 20,
  20: 5,
  25: 4,
  30: 10,
  35: 20,
  40: 5,
  50: 2,
  75: 4,
};

/** Firma conmutativa: «12×7» y «7×12» colisionan. */
export const commutativeSignature = (category: string, operands: number[]) =>
  `${category}|${[...operands].sort((a, b) => a - b).join(',')}`;

/** Ventana anti-repetición perceptual: el mismo par de operandos no reaparece en N ejercicios. */
export class RecencyWindow {
  private readonly size: number;
  private readonly items: string[] = [];

  constructor(size = 8) {
    this.size = size;
  }

  seen(signature: string) {
    return this.items.includes(signature);
  }

  push(signature: string) {
    this.items.push(signature);
    if (this.items.length > this.size) this.items.shift();
  }
}

/** Intercambia decenas y unidades del valor (73 → 37). Devuelve null si no produce un valor distinto. */
export const transposeDigits = (value: number): number | null => {
  if (!Number.isInteger(value) || Math.abs(value) < 10) return null;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const tens = Math.floor(abs / 10) % 10;
  const units = abs % 10;
  if (tens === units) return null;
  const transposed = abs - tens * 10 - units + units * 10 + tens;
  return transposed === abs ? null : sign * transposed;
};

/** true si la suma de unidades de los operandos genera acarreo. */
export const hasCarry = (a: number, b: number) => (a % 10) + (b % 10) >= 10;

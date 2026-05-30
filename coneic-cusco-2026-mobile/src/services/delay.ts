export function delay<T>(data: T, min = 300, max = 800): Promise<T> {
  const duration = Math.round(min + Math.random() * (max - min));
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), duration);
  });
}

export function rejectAfter(message: string, min = 300, max = 800): Promise<never> {
  const duration = Math.round(min + Math.random() * (max - min));
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), duration);
  });
}

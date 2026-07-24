export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const pick = <T,>(items: T[]): T => items[rand(0, items.length - 1)];

export const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = rand(0, index);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

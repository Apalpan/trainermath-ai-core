import type { Ranking } from '../types';

export const universityRankings: Ranking[] = [
  { id: 'rank-uni', university: 'Universidad Nacional de Ingeniería', score: 982, position: 1, medal: 'gold' },
  { id: 'rank-uac', university: 'Universidad Andina del Cusco', score: 941, position: 2, medal: 'silver' },
  { id: 'rank-unsa', university: 'Universidad Nacional de San Agustín', score: 904, position: 3, medal: 'bronze' },
  { id: 'rank-pucp', university: 'Pontificia Universidad Católica del Perú', score: 870, position: 4 },
  { id: 'rank-unmsm', university: 'Universidad Nacional Mayor de San Marcos', score: 842, position: 5 },
  { id: 'rank-unt', university: 'Universidad Nacional de Trujillo', score: 816, position: 6 },
  { id: 'rank-ucsm', university: 'Universidad Católica de Santa María', score: 790, position: 7 },
  { id: 'rank-unap', university: 'Universidad Nacional del Altiplano', score: 752, position: 8 },
  { id: 'rank-unh', university: 'Universidad Nacional de Huancavelica', score: 719, position: 9 },
  { id: 'rank-unfv', university: 'Universidad Nacional Federico Villarreal', score: 688, position: 10 },
];

export const bridgeContestRanking: Ranking[] = [
  { id: 'bridge-1', university: 'Universidad Nacional de Ingeniería', score: 96, position: 1, medal: 'gold' },
  { id: 'bridge-2', university: 'Universidad Andina del Cusco', score: 92, position: 2, medal: 'silver' },
  { id: 'bridge-3', university: 'Universidad Nacional de San Agustín', score: 87, position: 3, medal: 'bronze' },
];

export const projectContestRanking: Ranking[] = [
  { id: 'project-1', university: 'Pontificia Universidad Católica del Perú', score: 94, position: 1, medal: 'gold' },
  { id: 'project-2', university: 'Universidad Nacional de Ingeniería', score: 91, position: 2, medal: 'silver' },
  { id: 'project-3', university: 'Universidad Nacional de Trujillo', score: 85, position: 3, medal: 'bronze' },
];

export const sportsRanking: Ranking[] = [
  { id: 'sports-1', university: 'Universidad Nacional de San Agustín', score: 18, position: 1, medal: 'gold' },
  { id: 'sports-2', university: 'Universidad Andina del Cusco', score: 15, position: 2, medal: 'silver' },
  { id: 'sports-3', university: 'Universidad Nacional del Altiplano', score: 12, position: 3, medal: 'bronze' },
];

import type { EventStats } from '../types';
import { universityRankings } from './rankings';

export const eventStats: EventStats = {
  capacity: 6000,
  activeParticipants: 1847,
  universities: 42,
  contests: 64,
  talks: 24,
  visits: 18,
  rankings: universityRankings,
  medalTable: universityRankings.slice(0, 6),
};

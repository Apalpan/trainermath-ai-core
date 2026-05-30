import { eventStats } from '../mocks/stats';
import type { EventStats } from '../types';
import { delay } from './delay';

export const statsService = {
  async getStats(): Promise<EventStats> {
    return delay(eventStats);
  },
};

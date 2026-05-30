import { contests } from '../mocks/contests';
import { speakers } from '../mocks/speakers';
import { venues } from '../mocks/venues';
import { visits } from '../mocks/visits';
import type { Contest, Speaker, Venue, Visit } from '../types';
import { delay } from './delay';

export const catalogService = {
  async getSpeakers(): Promise<Speaker[]> {
    return delay(speakers);
  },

  async getSpeakerById(speakerId: string): Promise<Speaker | undefined> {
    return delay(speakers.find((speaker) => speaker.id === speakerId));
  },

  async getContests(): Promise<Contest[]> {
    return delay(contests);
  },

  async getVisits(): Promise<Visit[]> {
    return delay(visits);
  },

  async reserveVisit(visitId: string): Promise<string> {
    return delay(visitId, 250, 520);
  },

  async getVenues(): Promise<Venue[]> {
    return delay(venues);
  },
};

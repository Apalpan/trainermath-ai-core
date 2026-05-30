import { agendaDays, events } from '../mocks/events';
import type { AgendaDay, Event } from '../types';
import { delay } from './delay';

export const agendaService = {
  async getAgendaDays(): Promise<AgendaDay[]> {
    return delay(agendaDays);
  },

  async getEvents(): Promise<Event[]> {
    return delay(events);
  },

  async getEventById(eventId: string): Promise<Event | undefined> {
    return delay(events.find((event) => event.id === eventId));
  },

  async addToMyAgenda(eventId: string): Promise<string> {
    return delay(eventId, 250, 500);
  },
};

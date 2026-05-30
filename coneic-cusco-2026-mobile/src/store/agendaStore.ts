import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { agendaService } from '../services/agendaService';

interface AgendaState {
  myAgendaIds: string[];
  addEvent: (eventId: string) => Promise<void>;
  removeEvent: (eventId: string) => void;
  isInAgenda: (eventId: string) => boolean;
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  myAgendaIds: ['evt-bim-transformacion'],

  async addEvent(eventId: string) {
    await agendaService.addToMyAgenda(eventId);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set((state) => ({
      myAgendaIds: state.myAgendaIds.includes(eventId) ? state.myAgendaIds : [...state.myAgendaIds, eventId],
    }));
  },

  removeEvent(eventId: string) {
    set((state) => ({ myAgendaIds: state.myAgendaIds.filter((id) => id !== eventId) }));
  },

  isInAgenda(eventId: string) {
    return get().myAgendaIds.includes(eventId);
  },
}));

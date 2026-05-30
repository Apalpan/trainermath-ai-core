import { notifications } from '../mocks/notifications';
import type { Notification } from '../types';
import { delay } from './delay';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return delay(notifications);
  },
};

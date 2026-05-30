import { create } from 'zustand';

import { notifications as initialNotifications } from '../mocks/notifications';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  markAsRead: (notificationId: string) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialNotifications,

  markAsRead(notificationId: string) {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }));
  },

  unreadCount() {
    return get().notifications.filter((notification) => !notification.read).length;
  },
}));

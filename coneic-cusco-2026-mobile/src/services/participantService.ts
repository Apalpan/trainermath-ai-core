import { attendanceRecords } from '../mocks/attendance';
import { mockUser } from '../mocks/users';
import type { AttendanceRecord, User } from '../types';
import { delay } from './delay';

export const participantService = {
  async getProfile(): Promise<User> {
    return delay(mockUser);
  },

  async getAttendance(): Promise<AttendanceRecord[]> {
    return delay(attendanceRecords);
  },
};

export type EventType =
  | 'talk'
  | 'contest'
  | 'technicalVisit'
  | 'tourismVisit'
  | 'fair'
  | 'sociocultural'
  | 'sport'
  | 'networking'
  | 'checkin';

export type EventStatus = 'available' | 'full' | 'registered' | 'live' | 'finished';

export type UserRole = 'participant' | 'delegation' | 'staff';

export interface User {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  dni: string;
  phone: string;
  university: string;
  participantCode: string;
  role: UserRole;
  registrationStage: string;
  verified: boolean;
  paymentConfirmed: boolean;
  accessEnabled: boolean;
  accumulatedHours: number;
  requiredHours: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  dayId: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  venueName: string;
  capacity: number;
  registered: number;
  status: EventStatus;
  speakerId?: string;
  contestId?: string;
  visitId?: string;
  track?: string;
  isNext?: boolean;
  tags: string[];
  recommendations?: string[];
}

export interface Speaker {
  id: string;
  name: string;
  country: string;
  scope: 'international' | 'national';
  topic: string;
  track: string;
  bio: string;
  eventId: string;
  schedule: string;
  room: string;
  initials: string;
}

export interface AgendaDay {
  id: string;
  date: string;
  label: string;
  shortLabel: string;
  eventIds: string[];
}

export interface Contest {
  id: string;
  name: string;
  category: 'academic' | 'sport' | 'sociocultural';
  description: string;
  rulesSummary: string[];
  date: string;
  venueId: string;
  venueName: string;
  status: EventStatus;
  teamsRegistered: number;
  ranking: Ranking[];
}

export interface Visit {
  id: string;
  name: string;
  kind: 'technical' | 'tourism';
  place: string;
  time: string;
  meetingPoint: string;
  capacity: number;
  reserved: number;
  status: 'available' | 'reserved' | 'full';
  recommendations: string[];
}

export interface Venue {
  id: string;
  name: string;
  category: 'auditorium' | 'registration' | 'fair' | 'room' | 'transport' | 'food' | 'visit';
  description: string;
  hours: string;
  x: number;
  y: number;
  associatedEventIds: string[];
}

export interface Certificate {
  id: string;
  title: string;
  status: 'locked' | 'inProgress' | 'available';
  userName: string;
  hours: number;
  requiredHours: number;
  verificationCode: string;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  eventTitle: string;
  date: string;
  hours: number;
  status: 'validated' | 'pending' | 'rejected';
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: 'roomChange' | 'reminder' | 'contest' | 'visit' | 'certificate' | 'system';
  read: boolean;
}

export interface Ranking {
  id: string;
  university: string;
  score: number;
  position: number;
  medal?: 'gold' | 'silver' | 'bronze';
}

export interface Sponsor {
  id: string;
  name: string;
  tier: 'organizer' | 'gold' | 'silver' | 'partner';
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  actionLabel?: string;
  actionRoute?: string;
}

export interface ChatAction {
  label: string;
  route: string;
}

export interface ChatMessage {
  id: string;
  from: 'user' | 'assistant';
  text: string;
  createdAt: string;
  actions?: ChatAction[];
}

export interface EventStats {
  capacity: number;
  activeParticipants: number;
  universities: number;
  contests: number;
  talks: number;
  visits: number;
  rankings: Ranking[];
  medalTable: Ranking[];
}

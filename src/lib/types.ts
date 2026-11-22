export type CategoryId = 'lighting' | 'harassment' | 'abandoned' | 'route' | 'flooding' | 'other';
export type Status = 'pending' | 'approved' | 'rejected' | 'flagged';
export type TimeOfDay = 'day' | 'evening' | 'night';
export type GroupId = 'everyone' | 'girls' | 'lgbtq' | 'pwd' | 'osy';
export type Feeling = 'safe' | 'mostly_safe' | 'sometimes_unsafe' | 'unsafe';
export type Lang = 'en' | 'fil';

export interface Localized {
  en: string;
  fil: string;
}

export interface ModerationEntry {
  at: string;
  action: Status | 'edited' | 'submitted';
  note?: string;
}

export interface Report {
  id: string;
  category: CategoryId;
  severity: number; // 1-5
  barangay: string;
  timeOfDay: TimeOfDay;
  group: GroupId;
  description: string;
  lat: number;
  lng: number;
  status: Status;
  /** "Me too" count from other young people (approved reports only). */
  confirmations?: number;
  createdAt: string;
  log: ModerationEntry[];
}

export interface SurveyResponse {
  id: string;
  barangay: string;
  feeling: Feeling;
  timeOfDay: TimeOfDay;
  group: GroupId;
  comment: string;
  wants: string[];
  createdAt: string;
}

export interface Barangay {
  name: string;
  lat: number;
  lng: number;
}

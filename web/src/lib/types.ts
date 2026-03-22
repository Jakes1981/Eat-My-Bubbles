// ── Core domain types for Eat My Bubbles PWA ──

export interface Swimmer {
  id: string;
  name: string;
  birthYear: number;
  club: string;
  province: string;
  country: string;
  gender: 'M' | 'F';
}

export interface SwimEvent {
  slug: string;        // e.g. "100-free"
  name: string;        // e.g. "100 Freestyle"
  distance: number;
  stroke: string;
  shortName: string;   // e.g. "100 Free"
}

export interface SwimmerResult {
  eventSlug: string;
  timeSeconds: number;
  timeText: string;
  date: string;
  meet: string;
}

export interface EliteSwimmer {
  name: string;
  country: string;
  birthYear: number;
  currentPB: number; // seconds
}

export interface TrajectoryPoint {
  age: number;
  timeSeconds: number;
  meet?: string;
  date?: string;
}

export interface WorldTop3Entry {
  eventSlug: string;
  gender: 'M' | 'F';
  swimmers: Array<{
    swimmer: EliteSwimmer;
    trajectory: TrajectoryPoint[];
  }>;
}

// ── App-level types ──

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalyticsEvent {
  userId: string;
  screen: string;
  eventSlug?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

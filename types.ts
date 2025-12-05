
export enum Tab {
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  GYM = 'GYM',
  JOURNAL = 'JOURNAL',
  APPS = 'APPS',
  AI = 'ai'
}

export interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category: 'WORK' | 'GYM' | 'PERSONAL' | 'SCHOOL' | 'SYSTEM';
  dueDate?: string;
  user_id?: string;
}

export interface GymSession {
  day: string;
  focus: string;
  completed: boolean;
}

export interface Biometrics {
  weight: number;
  weightHistory: number[]; // Array of last 7 entries
}

export type Mood = 'FLOW' | 'ZEN' | 'CHAOS' | 'IDEA';

export interface Note {
  id: string;
  title: string;
  content: string; // HTML string
  date: string; // ISO Date
  mood: Mood;
  isEncrypted: boolean;
  user_id?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserStats {
  id?: string;
  user_id?: string;
  xp: number;
  level: number;
  streak: number;
  focusTime: number; // in seconds
  lastVisit: string;
  hydration: number; // Current daily hydration in ml
}

export interface ScheduleBlock {
  id: string;
  title: string;
  startTime: string; // Format "HH:00"
  type: 'WORK' | 'GYM' | 'SCHOOL' | 'PERSONAL';
  date?: string; // YYYY-MM-DD
  user_id?: string;
}

// Football Types
export interface FootballTeam {
  id: number;
  name: string;
  crest: string;
  shortName: string;
}

export interface FootballScore {
  fullTime: { home: number | null; away: number | null };
}

export interface FootballMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED';
  minute?: number;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  score: FootballScore;
  competition: { name: string; emblem: string };
}

// --- GYM TYPES ---
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  target: string;
}

export interface PersonalRecord {
  name: string;
  weight: number;
  date: string;
}

export interface WorkoutLog {
  id?: string;
  user_id?: string;
  date: string;
  sessionName: string;
  totalVolume: number;
  exercises: {
    name: string;
    weight: number;
    reps: number;
  }[];
}

export interface WorkoutHistoryItem {
  date: string; // ISO timestamp
  sessionName: string;
}

export interface PhysiqueEntry {
  id: string;
  user_id?: string;
  date: string;
  imageUrl: string;
  stats: {
    weight: number;
    bench: number;
    squat: number;
    deadlift: number;
  };
}

// --- TIMER TYPES ---
export type FocusMode = 'DEEP' | 'STANDARD' | 'QUICK';

export interface PomoState {
  mode: FocusMode;
  timeLeft: number;
  initialTime: number;
  isActive: boolean;
  status: 'IDLE' | 'ENGAGED' | 'PAUSED' | 'COMPLETE';
}

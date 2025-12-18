
import { Task, GymSession, Note, WorkoutExercise, PersonalRecord, FootballMatch } from './types';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Dumbbell, Book, Smartphone, Bot } from 'lucide-react';

// --- SYSTEM CONFIGURATION ---
// PASTE YOUR BACKGROUND IMAGE URL HERE
export const WALLPAPER_URL = "https://4kwallpapers.com/images/walls/thumbs_3t/16958.png";

export const DEFAULT_ANCHOR_URL = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHg1ZHAxNjBpNjJkNjcxdzMweWplcmwzcWpjOXJ2YzJhNWxvNTNpdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lsdd32H2EqjXGRhWu4/giphy.gif";

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'TASKS', label: 'Protocol', icon: CheckSquare },
  { id: 'CALENDAR', label: 'Schedule', icon: CalendarIcon },
  { id: 'GYM', label: 'Training', icon: Dumbbell },
  { id: 'JOURNAL', label: 'Log', icon: Book },
  { id: 'APPS', label: 'Network', icon: Smartphone },
  { id: 'ai', label: 'Unit-01', icon: Bot },
];

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Complete system architecture', status: 'IN_PROGRESS', category: 'WORK', frequency: 'WEEKLY', dueDate: 'Today' },
  { id: '2', title: 'Heavy Leg Day', status: 'TODO', category: 'GYM', frequency: 'DAILY', dueDate: '19:00' },
];

export const WEEKLY_WORKOUTS: GymSession[] = [
  { day: 'Mon', focus: 'Push A', completed: false },
  { day: 'Tue', focus: 'Pull A', completed: false },
  { day: 'Wed', focus: 'Legs A', completed: false },
  { day: 'Thu', focus: 'Rest', completed: false },
  { day: 'Fri', focus: 'Push B', completed: false },
  { day: 'Sat', focus: 'Pull B', completed: false },
  { day: 'Sun', focus: 'Legs B', completed: false },
];

export const WORKOUT_PLAN: Record<string, WorkoutExercise[]> = {
  'Push A': [{ id: 'bp_flat', name: 'Flat Bench Press', sets: 3, reps: '5-8', target: 'Chest' }],
  'Rest': [{ id: 'cardio', name: 'Light Cardio', sets: 1, reps: '30 mins', target: 'Recovery' }]
};

export const INITIAL_PRS: PersonalRecord[] = [
  { name: 'Bench Press', weight: 100, date: 'Oct 12' },
  { name: 'Squat', weight: 140, date: 'Sep 28' },
  { name: 'Deadlift', weight: 180, date: 'Oct 05' },
];

export const QUOTES = [
  "Discipline is doing what you hate to do, but doing it like you love it.",
  "Focus, Ilyasuu.",
  "The only easy day was yesterday."
];

export const WARFARE_QUOTES = [
  "Dedication requires no mood.",
  "No one cares about your story until you win.",
  "Discipline equals freedom.",
  "Stay hard."
];


import { Task, GymSession, Note, WorkoutExercise, PersonalRecord, FootballMatch } from './types';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Dumbbell, Book, Smartphone } from 'lucide-react';

// PASTE YOUR IMAGE OR VIDEO URL HERE
export const WALLPAPER_URL = "https://4kwallpapers.com/images/walls/thumbs_3t/16958.png";
export const DEFAULT_ANCHOR_URL = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHg1ZHAxNjBpNjJkNjcxdzMweWplcmwzcWpjOXJ2YzJhNWxvNTNpdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lsdd32H2EqjXGRhWu4/giphy.gif";

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'TASKS', label: 'Protocol', icon: CheckSquare },
  { id: 'CALENDAR', label: 'Schedule', icon: CalendarIcon },
  { id: 'GYM', label: 'Training', icon: Dumbbell },
  { id: 'JOURNAL', label: 'Log', icon: Book },
  { id: 'APPS', label: 'Network', icon: Smartphone },
];

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Complete system architecture', status: 'IN_PROGRESS', category: 'WORK', frequency: 'WEEKLY', dueDate: 'Today' },
  { id: '2', title: 'Heavy Leg Day', status: 'TODO', category: 'GYM', frequency: 'DAILY', dueDate: '19:00' },
  { id: '3', title: 'Review quarterly goals', status: 'DONE', category: 'PERSONAL', frequency: 'MONTHLY' },
  { id: '4', title: 'Meditation (20m)', status: 'TODO', category: 'PERSONAL', frequency: 'DAILY', dueDate: '22:00' },
];

// UPDATED WEEKLY SCHEDULE
export const WEEKLY_WORKOUTS: GymSession[] = [
  { day: 'Mon', focus: 'Upper Body A', completed: false },
  { day: 'Tue', focus: 'Lower Body A', completed: false },
  { day: 'Wed', focus: 'Cardio', completed: false },
  { day: 'Thu', focus: 'Upper Body B', completed: false },
  { day: 'Fri', focus: 'Lower Body B', completed: false },
  { day: 'Sat', focus: 'Cardio Challenge', completed: false },
  { day: 'Sun', focus: 'Active Recovery', completed: false },
];

// UPDATED EXERCISE DATABASE
export const WORKOUT_PLAN: Record<string, WorkoutExercise[]> = {
  'Upper Body A': [
    { id: 'bp_flat', name: 'Bench Press', sets: 3, reps: '5-8', target: 'Strength' },
    { id: 'bb_row', name: 'Bent Over Barbell Rows', sets: 3, reps: '6-8', target: 'Back' },
    { id: 'ohp', name: 'Overhead Press', sets: 3, reps: '6-10', target: 'Shoulders' },
    { id: 'pull_up', name: 'Pull-ups / Lat Pulldowns', sets: 3, reps: '8-10', target: 'Lats' },
    { id: 'face_pull', name: 'Face Pulls', sets: 3, reps: '15', target: 'Shoulder Health' }
  ],
  'Lower Body A': [
    { id: 'squat', name: 'Barbell Squats', sets: 3, reps: '5-8', target: 'Quads/Core' },
    { id: 'rdl', name: 'Romanian Deadlifts', sets: 3, reps: '8-10', target: 'Hamstrings' },
    { id: 'lunge', name: 'Walking Lunges', sets: 3, reps: '10/leg', target: 'Glutes/Quads' },
    { id: 'calf', name: 'Calf Raises', sets: 4, reps: '15', target: 'Calves' },
    { id: 'plank', name: 'Plank', sets: 3, reps: '60s', target: 'Core Stability' }
  ],
  'Cardio': [
    { id: 'run_60', name: 'Running (Zone 2)', sets: 1, reps: '60 min', target: 'Mitochondria' },
    { id: 'stretch', name: 'Dynamic Stretching', sets: 1, reps: '10 min', target: 'Mobility' }
  ],
  'Upper Body B': [
    { id: 'inc_db', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', target: 'Upper Chest' },
    { id: 'cable_row', name: 'Seated Cable Row', sets: 3, reps: '10-12', target: 'Mid Back' },
    { id: 'lat_raise', name: 'Lateral Raises', sets: 4, reps: '12-15', target: 'Side Delts' },
    { id: 'tri_push', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', target: 'Triceps' },
    { id: 'curl', name: 'Bicep Curls', sets: 3, reps: '12-15', target: 'Biceps' }
  ],
  'Lower Body B': [
    { id: 'dl', name: 'Deadlifts', sets: 3, reps: '5', target: 'Posterior Chain' },
    { id: 'leg_press', name: 'Leg Press', sets: 3, reps: '10-12', target: 'Quads' },
    { id: 'leg_curl', name: 'Leg Curls (Machine)', sets: 3, reps: '12-15', target: 'Hamstrings' },
    { id: 'leg_ext', name: 'Leg Extensions', sets: 3, reps: '12-15', target: 'Quads' },
    { id: 'abs', name: 'Hanging Leg Raises', sets: 3, reps: '10-15', target: 'Abs' }
  ],
  'Cardio Challenge': [
    { id: 'run_int', name: 'Interval Run', sets: 1, reps: '60 min', target: 'Heart Rate Spike' },
    { id: 'cool', name: 'Cooldown Walk', sets: 1, reps: '10 min', target: 'Recovery' }
  ],
  'Active Recovery': [
    { id: 'low_impact', name: 'Elliptical / Bike / Incline Walk', sets: 1, reps: '60 min', target: 'Joint Health' },
    { id: 'mobility', name: 'Full Body Mobility', sets: 1, reps: '20 min', target: 'Flexibility' }
  ]
};

export const INITIAL_PRS: PersonalRecord[] = [
  { name: 'Bench Press', weight: 100, date: 'Oct 12' },
  { name: 'Squat', weight: 140, date: 'Sep 28' },
  { name: 'Deadlift', weight: 180, date: 'Oct 05' },
];

export const MOCK_NOTES: Note[] = [
  { id: '1', title: 'Focus Log #42', content: 'Felt strong today. Deep work session was productive.', mood: 'FLOW', date: '2023-10-24', isEncrypted: false },
];

export const QUOTES = [
  "Discipline is doing what you hate to do, but doing it like you love it.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Pain is temporary. Quitting lasts forever.",
  "Focus, Ilyasuu.",
  "The only easy day was yesterday."
];

export const WARFARE_QUOTES = [
  "You must be at your strongest when you are feeling at your weakest.",
  "Dedication requires no mood.",
  "No one cares about your story until you win. So win.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "Light weight, baby!",
  "Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.",
  "The man who loves walking will walk further than the man who loves the destination.",
  "If it was easy, everyone would do it.",
  "Conquer your inner bitch.",
  "Discipline equals freedom.",
  "Stay hard.",
  "Don't stop when you're tired. Stop when you're done."
];

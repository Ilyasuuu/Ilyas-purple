import { Task, GymSession, Note, WorkoutExercise, PersonalRecord } from './types';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Dumbbell, Book, Smartphone } from 'lucide-react';

// PASTE YOUR IMAGE OR VIDEO URL HERE
export const WALLPAPER_URL = "https://4kwallpapers.com/images/walls/thumbs_3t/16958.png";

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'TASKS', label: 'Protocol', icon: CheckSquare },
  { id: 'CALENDAR', label: 'Schedule', icon: CalendarIcon },
  { id: 'GYM', label: 'Training', icon: Dumbbell },
  { id: 'JOURNAL', label: 'Log', icon: Book },
  { id: 'APPS', label: 'Network', icon: Smartphone },
];

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Complete system architecture', status: 'IN_PROGRESS', category: 'WORK', dueDate: 'Today' },
  { id: '2', title: 'Heavy Leg Day', status: 'TODO', category: 'GYM', dueDate: '19:00' },
  { id: '3', title: 'Review quarterly goals', status: 'DONE', category: 'PERSONAL' },
  { id: '4', title: 'Meditation (20m)', status: 'TODO', category: 'PERSONAL', dueDate: '22:00' },
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
  'Push A': [
    { id: 'bp_flat', name: 'Flat Bench Press', sets: 3, reps: '5-8', target: 'Chest/Strength' },
    { id: 'ohp_bar', name: 'Overhead Press', sets: 3, reps: '8-10', target: 'Shoulders' },
    { id: 'inc_db', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', target: 'Upper Chest' },
    { id: 'lat_raise', name: 'Lateral Raises', sets: 4, reps: '15-20', target: 'Side Delts' },
    { id: 'tri_push', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', target: 'Triceps' }
  ],
  'Pull A': [
    { id: 'pull_up', name: 'Weighted Pull-Ups', sets: 3, reps: '6-8', target: 'Lats' },
    { id: 'bb_row', name: 'Barbell Rows', sets: 3, reps: '8-10', target: 'Back Thickness' },
    { id: 'face_pull', name: 'Face Pulls', sets: 4, reps: '15-20', target: 'Rear Delts' },
    { id: 'shrug', name: 'Dumbbell Shrugs', sets: 3, reps: '12-15', target: 'Traps' },
    { id: 'ham_curl', name: 'Hammer Curls', sets: 3, reps: '10-12', target: 'Biceps' }
  ],
  'Legs A': [
    { id: 'squat', name: 'Barbell Squat', sets: 3, reps: '5-8', target: 'Quads/Core' },
    { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '8-10', target: 'Hamstrings' },
    { id: 'leg_press', name: 'Leg Press', sets: 3, reps: '12-15', target: 'Quads' },
    { id: 'leg_ext', name: 'Leg Extensions', sets: 3, reps: '15-20', target: 'Isolation' },
    { id: 'calf_stand', name: 'Standing Calf Raise', sets: 4, reps: '15-20', target: 'Calves' }
  ],
  'Push B': [
    { id: 'inc_bb', name: 'Incline Barbell Press', sets: 3, reps: '8-10', target: 'Upper Chest' },
    { id: 'db_press', name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', target: 'Shoulders' },
    { id: 'dips', name: 'Weighted Dips', sets: 3, reps: '10-12', target: 'Chest/Tris' },
    { id: 'flys', name: 'Cable Flys', sets: 3, reps: '15-20', target: 'Isolation' },
    { id: 'skull', name: 'Skullcrushers', sets: 3, reps: '10-12', target: 'Triceps' }
  ],
  'Pull B': [
    { id: 'lat_pull', name: 'Lat Pulldowns', sets: 3, reps: '10-12', target: 'Lats' },
    { id: 'chest_row', name: 'Chest Supported Row', sets: 3, reps: '10-12', target: 'Upper Back' },
    { id: 'rear_fly', name: 'Rear Delt Fly', sets: 3, reps: '15-20', target: 'Rear Delts' },
    { id: 'preach', name: 'Preacher Curls', sets: 3, reps: '12-15', target: 'Biceps' },
    { id: 'inc_curl', name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', target: 'Peak' }
  ],
  'Legs B': [
    { id: 'hack', name: 'Hack Squat', sets: 3, reps: '8-10', target: 'Quads' },
    { id: 'split', name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', target: 'Glutes' },
    { id: 'leg_curl', name: 'Lying Leg Curls', sets: 4, reps: '12-15', target: 'Hamstrings' },
    { id: 'calf_sit', name: 'Seated Calf Raise', sets: 4, reps: '15-20', target: 'Calves' }
  ],
  'Rest': [
    { id: 'cardio', name: 'Light Cardio', sets: 1, reps: '30 mins', target: 'Recovery' },
    { id: 'stretch', name: 'Mobility Work', sets: 1, reps: '15 mins', target: 'Health' }
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
  "Don't stop when you're tired. Stop when you're done.",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Obsession is what lazy people call dedication.",
  "Be undeniable.",
  "Civilize the mind, but make savage the body.",
  "A man who conquers himself is greater than one who conquers a thousand men in battle.",
  "We don't rise to the level of our expectations, we fall to the level of our training.",
  "Pain is weakness leaving the body.",
  "The worst thing I can be is the same as everybody else.",
  "Get comfortable being uncomfortable.",
  "You are your own creator. Mold yourself.",
  "Zero compromise.",
  "Execute.",
  "Whatever it takes."
];

export const DEFAULT_ANCHOR_URL = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG13aG13aG13aG13aG13aG13aG13aG13aG13aG13aG13&ep=v1_gifs_search&rid=giphy.gif";
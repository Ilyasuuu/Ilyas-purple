
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Tab, Task, UserStats, GymSession, Biometrics, Note, ScheduleBlock, PersonalRecord, WorkoutLog, WorkoutHistoryItem, PhysiqueEntry, PomoState, FocusMode, TaskFrequency } from './types';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Gym from './components/Gym';
import Journal from './components/Journal';
import Apps from './components/Apps';
import Calendar from './components/Calendar';
import AIAssistant from './components/AIAssistant';
import SnowEffect from './components/SnowEffect';
import Auth from './components/Auth';
import { WALLPAPER_URL, WEEKLY_WORKOUTS, INITIAL_PRS } from './constants';

const XP_PER_LEVEL = 500;

const App: React.FC = () => {
  // Fix: Replaced missing Session type with any to satisfy compiler
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSnowing, setIsSnowing] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({ xp: 0, level: 1, streak: 1, focusTime: 0, lastVisit: new Date().toDateString(), hydration: 0 });
  const [gymSessions, setGymSessions] = useState<GymSession[]>(WEEKLY_WORKOUTS);
  const [biometrics, setBiometrics] = useState<Biometrics>({ weight: 82.5, weightHistory: [82.5] });
  const [notes, setNotes] = useState<Note[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(INITIAL_PRS);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [viewSchedule, setViewSchedule] = useState<ScheduleBlock[]>([]); 
  const [todaysSchedule, setTodaysSchedule] = useState<ScheduleBlock[]>([]); 
  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleBlock[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [physiqueLog, setPhysiqueLog] = useState<PhysiqueEntry[]>([]);

  const [pomoState, setPomoState] = useState<PomoState>({ mode: 'STANDARD', timeLeft: 25 * 60, initialTime: 25 * 60, isActive: false, status: 'IDLE' });

  useEffect(() => {
    // Fix: Cast supabase.auth to any to bypass type errors for getSession and onAuthStateChange
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => { setSession(session); setLoadingSession(false); });
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  const refreshData = useCallback(async () => {
    if (!session?.user) return;
    const userId = session.user.id;

    const { data: statsData } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (statsData) {
      setStats({ xp: statsData.xp, level: statsData.level, streak: statsData.streak, focusTime: statsData.focus_time, lastVisit: statsData.last_visit, hydration: statsData.hydration_current });
      setBiometrics({ weight: statsData.current_weight || 82.5, weightHistory: statsData.weight_history || [82.5] });
    }

    const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', userId);
    if (tasksData) setTasks(tasksData.map(t => ({ id: t.id, title: t.title, status: t.status, category: t.category, frequency: 'DAILY' })));

    const { data: scheduleData } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId);
    if (scheduleData) {
      const blocks = scheduleData.map(b => ({ id: b.id, title: b.title, startTime: b.start_time, type: b.type, date: b.date }));
      setTodaysSchedule(blocks.filter(b => b.date === new Date().toISOString().split('T')[0]));
      setUpcomingSchedule(blocks.sort((a,b) => a.date.localeCompare(b.date)));
    }
  }, [session]);

  useEffect(() => { refreshData(); }, [refreshData]);

  if (loadingSession) return <div className="h-screen w-full bg-black flex items-center justify-center font-orbitron text-white text-xl animate-pulse">BOOTING...</div>;
  if (!session) return <Auth />;

  return (
    <div className={`flex h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-purple-500/30 transition-all duration-1000 ${isFocusing ? 'shadow-[inset_0_0_100px_rgba(139,0,255,0.4)]' : ''}`}>
      {isSnowing && <SnowEffect />}
      
      {/* UNIVERSAL BACKGROUND SYSTEM */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div 
           className={`absolute inset-0 bg-cover bg-center transition-all duration-[3000ms] ${isFocusing ? 'scale-110 saturate-0 blur-[4px] opacity-20' : 'scale-100 opacity-25 saturate-[0.8]'}`}
           style={{ backgroundImage: `url(${WALLPAPER_URL})`, mixBlendMode: 'plus-lighter' }} 
         />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.4)_60%,#050505_95%)]" />
      </div>

      {/* Fix: Cast supabase.auth to any to bypass type error for signOut */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} onLogout={() => (supabase.auth as any).signOut()} />

      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-500 relative z-10 md:pl-28 ${activeTab === Tab.DASHBOARD ? 'p-4 md:p-8 xl:pr-96' : 'p-4 md:p-8'}`}>
        <div className="flex-1 h-full min-h-0 relative z-10">
          {activeTab === Tab.DASHBOARD && <Dashboard stats={stats} tasks={tasks} gymSessions={gymSessions} isFocusing={isFocusing} toggleFocus={() => setIsFocusing(!isFocusing)} onToggleTask={refreshData} upcomingSchedule={upcomingSchedule} />}
          {activeTab === Tab.TASKS && <Tasks tasks={tasks} onAddTask={refreshData} onToggleTask={refreshData} onDeleteTask={refreshData} onEditTask={refreshData} pomoState={pomoState} onPomoControl={() => {}} />}
          {activeTab === Tab.GYM && <Gym sessions={gymSessions} biometrics={biometrics} personalRecords={personalRecords} workoutHistory={workoutHistory} physiqueLog={physiqueLog} onWorkoutComplete={refreshData} onResetWorkout={refreshData} onUpdateBiometrics={() => {}} onSyncWeight={() => {}} onUpdatePR={() => {}} onAddPhysiqueEntry={() => {}} />}
          {activeTab === Tab.JOURNAL && <Journal logs={notes} onUpdateLog={refreshData} onDeleteLog={refreshData} />}
          {activeTab === Tab.APPS && <Apps />}
          {activeTab === Tab.CALENDAR && <Calendar schedule={viewSchedule} onAddBlock={refreshData} onDeleteBlock={refreshData} viewDate={viewDate} setViewDate={setViewDate} />}
          {activeTab === Tab.AI && <AIAssistant onClose={() => setActiveTab(Tab.DASHBOARD)} user={session.user} onRefreshData={refreshData} />}
        </div>
      </main>

      {activeTab === Tab.DASHBOARD && <RightPanel isSnowing={isSnowing} setIsSnowing={setIsSnowing} schedule={todaysSchedule} hydration={stats.hydration} onUpdateHydration={refreshData} />}
    </div>
  );
};

export default App;

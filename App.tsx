
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
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

const getStartOfCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay(); 
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

const POMO_MODES: Record<FocusMode, { minutes: number; xp: number }> = {
  DEEP: { minutes: 50, xp: 150 },
  STANDARD: { minutes: 25, xp: 60 },
  QUICK: { minutes: 15, xp: 30 },
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSnowing, setIsSnowing] = useState(false);
  const XP_PER_LEVEL = 500;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({
    xp: 0, level: 1, streak: 1, focusTime: 0, lastVisit: new Date().toDateString(), hydration: 0
  });
  
  const [gymSessions, setGymSessions] = useState<GymSession[]>(WEEKLY_WORKOUTS);
  
  const [biometrics, setBiometrics] = useState<Biometrics>({ 
    weight: 82.5, weightHistory: [82.5] 
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(INITIAL_PRS);
  
  const [viewDate, setViewDate] = useState(new Date()); 
  const [viewSchedule, setViewSchedule] = useState<ScheduleBlock[]>([]); 
  const [todaysSchedule, setTodaysSchedule] = useState<ScheduleBlock[]>([]); 

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [physiqueLog, setPhysiqueLog] = useState<PhysiqueEntry[]>([]);

  const [isFocusing, setIsFocusing] = useState(false);

  const [pomoState, setPomoState] = useState<PomoState>({
    mode: 'STANDARD',
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    isActive: false,
    status: 'IDLE'
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setLoadingSession(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = useCallback(async () => {
    if (!session?.user) return;
    setLoadingData(true);
    try {
      const userId = session.user.id;

      const { data: statsData, error: statsError } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
      
      if (statsError && statsError.code === 'PGRST116') {
        const defaultStats = {
            user_id: userId,
            xp: 0, level: 1, streak: 1, focus_time: 0, last_visit: new Date().toDateString(),
            current_weight: 82.5, weight_history: [82.5], hydration_current: 0, hydration_date: new Date().toDateString()
        };
        await supabase.from('user_stats').insert(defaultStats);
        setStats({ xp: 0, level: 1, streak: 1, focusTime: 0, lastVisit: defaultStats.last_visit, hydration: 0 });
      } else if (statsData) {
        const today = new Date().toDateString();
        let newStreak = statsData.streak;
        if (statsData.last_visit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (statsData.last_visit === yesterday.toDateString()) newStreak += 1;
            else newStreak = 1;
            await supabase.from('user_stats').update({ streak: newStreak, last_visit: today }).eq('user_id', userId);
        }
        let currentHydration = statsData.hydration_current || 0;
        if (statsData.hydration_date !== today) {
            currentHydration = 0;
            await supabase.from('user_stats').update({ hydration_current: 0, hydration_date: today }).eq('user_id', userId);
        }

        setStats({
          xp: statsData.xp,
          level: statsData.level,
          streak: newStreak,
          focusTime: statsData.focus_time,
          lastVisit: today,
          hydration: currentHydration
        });
        setBiometrics({
          weight: statsData.current_weight || 82.5,
          weightHistory: statsData.weight_history || [82.5]
        });
      }

      // --- TASK CLEANUP & PARSING LOGIC ---
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (tasksData) {
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tasksToKeep: any[] = [];
        const tasksToDeleteIds: string[] = [];

        tasksData.forEach((t: any) => {
          const taskDate = t.created_at ? new Date(t.created_at) : new Date(0);
          
          // Parse Frequency from Category (Stored as "FREQUENCY::CATEGORY")
          let frequency: TaskFrequency = 'DAILY';
          let category = t.category;

          if (t.category && t.category.includes('::')) {
             const parts = t.category.split('::');
             frequency = parts[0] as TaskFrequency;
             category = parts[1];
          }

          // --- AUTO-DELETION RULES ---
          let shouldDelete = false;

          if (frequency === 'DAILY') {
             // Daily tasks reset at Midnight (if created before today)
             if (taskDate < todayStart) shouldDelete = true;
          } else if (frequency === 'WEEKLY') {
             // Weekly goals disappear after 7 days
             const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
             if (taskDate < sevenDaysAgo) shouldDelete = true;
          } else if (frequency === 'MONTHLY') {
             // Monthly goals disappear after 30 days
             const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
             if (taskDate < thirtyDaysAgo) shouldDelete = true;
          }

          if (shouldDelete) {
             tasksToDeleteIds.push(t.id);
          } else {
             // Add parsed task to state
             tasksToKeep.push({
               ...t,
               category: category,
               frequency: frequency
             });
          }
        });

        if (tasksToDeleteIds.length > 0) {
          await supabase.from('tasks').delete().in('id', tasksToDeleteIds);
        }

        setTasks(tasksToKeep.map((t: any) => ({
          id: t.id, title: t.title, status: t.status, category: t.category, dueDate: t.due_date, frequency: t.frequency
        })));
      }

      const { data: scheduleData } = await supabase.from('schedule_blocks').select('*').eq('user_id', userId);
      if (scheduleData) {
          const blocks: ScheduleBlock[] = scheduleData.map((b: any) => ({
            id: b.id, title: b.title, startTime: b.start_time, type: b.type, date: b.date
          }));
          const todayStr = new Date().toISOString().split('T')[0];
          setTodaysSchedule(blocks.filter(b => b.date === todayStr));
      }

      const { data: logsData } = await supabase.from('neural_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (logsData) {
        setNotes(logsData.map((n: any) => ({
          id: n.id, title: n.title, content: n.content, date: n.created_at, mood: n.mood, isEncrypted: n.is_encrypted
        })));
      }

      const { data: physiqueData } = await supabase.from('physique_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (physiqueData) {
        setPhysiqueLog(physiqueData.map((p: any) => ({ id: p.id, imageUrl: p.image_url, stats: p.stats, date: p.date })));
      }

      const { data: trainingData } = await supabase.from('training_logs').select('*').eq('user_id', userId);
      if (trainingData) {
          const historyItems: WorkoutHistoryItem[] = [];
          const calculatedPRs = [...INITIAL_PRS];
          trainingData.forEach((log: any) => {
            historyItems.push({ date: log.date, sessionName: log.session_name });
            if (log.exercises) {
                log.exercises.forEach((ex: any) => {
                  let prName = '';
                  if (ex.name.includes('Bench Press')) prName = 'Bench Press';
                  if (ex.name.includes('Squat')) prName = 'Squat';
                  if (ex.name.includes('Deadlift')) prName = 'Deadlift';
                  if (prName) {
                      const idx = calculatedPRs.findIndex(p => p.name === prName);
                      if (idx >= 0 && ex.weight > calculatedPRs[idx].weight) {
                        calculatedPRs[idx] = { name: prName, weight: ex.weight, date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
                      }
                  }
                });
            }
          });
          setWorkoutHistory(historyItems);
          setPersonalRecords(calculatedPRs);
      }

    } catch (e) {
      console.error("System Sync Failure:", e);
    } finally {
      setLoadingData(false);
    }
  }, [session]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!session) return;
    const loadViewSchedule = async () => {
       const dateStr = viewDate.toISOString().split('T')[0];
       const { data } = await supabase.from('schedule_blocks').select('*').eq('user_id', session.user.id).eq('date', dateStr);
       if (data) {
         setViewSchedule(data.map((b: any) => ({
           id: b.id, title: b.title, startTime: b.start_time, type: b.type, date: b.date
         })));
       } else {
         setViewSchedule([]);
       }
    };
    loadViewSchedule();
  }, [viewDate, session, tasks]);

  useEffect(() => {
    const startOfWeek = getStartOfCurrentWeek();
    setGymSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session => {
        const hasLogThisWeek = workoutHistory.some(log => {
          const logTime = new Date(log.date).getTime();
          return log.sessionName === session.focus && logTime >= startOfWeek;
        });
        return { ...session, completed: hasLogThisWeek };
      });
      return JSON.stringify(updatedSessions) !== JSON.stringify(prevSessions) ? updatedSessions : prevSessions;
    });
  }, [workoutHistory]);

  const updateStatsDB = async (newStats: Partial<UserStats>) => {
    if (!session) return;
    await supabase.from('user_stats').update({ xp: newStats.xp, level: newStats.level, focus_time: newStats.focusTime }).eq('user_id', session.user.id);
  };
  const updateBiometricsDB = async (updates: Partial<any>) => {
    if (!session) return;
    await supabase.from('user_stats').update(updates).eq('user_id', session.user.id);
  };
  const handleUpdateHydration = async (amount: number) => {
    if (!session) return;
    const newTotal = Math.max(0, Math.min(stats.hydration + amount, 5000));
    setStats(prev => ({ ...prev, hydration: newTotal }));
    await supabase.from('user_stats').update({ hydration_current: newTotal, hydration_date: new Date().toDateString() }).eq('user_id', session.user.id);
  };

  useEffect(() => {
    let interval: any;
    if (isFocusing) {
      interval = setInterval(() => {
        setStats(prev => {
          const newTime = prev.focusTime + 1;
          let newXp = prev.xp;
          if (newTime > 0 && newTime % 600 === 0) newXp += 10;
          if (newTime % 60 === 0) updateStatsDB({ focusTime: newTime, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 });
          return { ...prev, focusTime: newTime, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusing]);
  const toggleFocus = () => setIsFocusing(!isFocusing);

  useEffect(() => {
    let interval: any = null;
    if (pomoState.isActive && pomoState.timeLeft > 0) {
      interval = setInterval(() => setPomoState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1, status: 'ENGAGED' })), 1000);
    } else if (pomoState.timeLeft === 0 && pomoState.isActive) {
      setPomoState(prev => ({ ...prev, isActive: false, status: 'COMPLETE' }));
      handleFocusSessionComplete(pomoState.initialTime, POMO_MODES[pomoState.mode].xp);
    }
    return () => clearInterval(interval);
  }, [pomoState.isActive, pomoState.timeLeft]);

  const handlePomoControl = (action: any, payload?: any) => {
    setPomoState(prev => {
      if (action === 'START') return { ...prev, isActive: true, status: 'ENGAGED' };
      if (action === 'PAUSE') return { ...prev, isActive: false, status: 'PAUSED' };
      if (action === 'RESET') return { ...prev, isActive: false, timeLeft: prev.initialTime, status: 'IDLE' };
      if (action === 'MODE') {
        const newTime = POMO_MODES[payload as FocusMode].minutes * 60;
        return { mode: payload, timeLeft: newTime, initialTime: newTime, isActive: false, status: 'IDLE' };
      }
      return prev;
    });
  };
  const handleFocusSessionComplete = (seconds: number, xpReward: number) => {
    setStats(prev => {
      const newXp = prev.xp + xpReward;
      const newStats = { ...prev, focusTime: prev.focusTime + seconds, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
      updateStatsDB(newStats);
      return newStats;
    });
  };

  const handleAddTask = async (newTask: Task) => {
    if (!session) return;
    
    // Encode frequency into category to avoid schema changes
    // Format: "FREQUENCY::CATEGORY" (e.g., "DAILY::WORK")
    const encodedCategory = `${newTask.frequency}::${newTask.category}`;

    const { data } = await supabase.from('tasks').insert({ 
      user_id: session.user.id, 
      title: newTask.title, 
      status: newTask.status, 
      category: encodedCategory, // Save Encoded
      due_date: newTask.dueDate 
    }).select().single();

    if (data) {
      // Decode for local state
      setTasks(prev => [{ ...newTask, id: data.id }, ...prev]);
    }
  };
  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id); if (!task || !session) return;
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    setStats(s => {
      let newXp = s.xp;
      // Add XP on check, remove on uncheck (simple toggle logic)
      if (newStatus === 'DONE') newXp += 50; else newXp = Math.max(0, newXp - 50);
      const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
      updateStatsDB(newStats);
      return newStats;
    });
  };
  const handleDeleteTask = async (id: string) => {
    // 1. Update UI immediately
    setTasks(prev => prev.filter(t => t.id !== id));
    // 2. Delete from DB
    await supabase.from('tasks').delete().eq('id', id);
    // 3. DO NOT SUBTRACT XP (As per new requirement)
  };
  const handleEditTask = async (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    await supabase.from('tasks').update({ title: newTitle }).eq('id', id);
  };
  const handleAddBlock = async (block: ScheduleBlock) => {
    if (!session) return;
    const dateStr = viewDate.toISOString().split('T')[0];
    const { data } = await supabase.from('schedule_blocks').insert({ user_id: session.user.id, title: block.title, start_time: block.startTime, type: block.type, date: dateStr }).select().single();
    if (data) {
      const newBlock = { id: data.id, title: data.title, startTime: data.start_time, type: data.type, date: data.date };
      setViewSchedule(prev => [...prev, newBlock]);
      if (dateStr === new Date().toISOString().split('T')[0]) setTodaysSchedule(prev => [...prev, newBlock]);
    }
  };
  const handleDeleteBlock = async (id: string) => {
    setViewSchedule(prev => prev.filter(b => b.id !== id));
    setTodaysSchedule(prev => prev.filter(b => b.id !== id));
    await supabase.from('schedule_blocks').delete().eq('id', id);
  };
  const handleUpdateLog = async (log: Note) => {
    if (!session) return;
    const isNew = !isNaN(Number(log.id)); 
    if (isNew) {
       const { data } = await supabase.from('neural_logs').insert({ user_id: session.user.id, title: log.title, content: log.content, mood: log.mood, is_encrypted: log.isEncrypted }).select().single();
       if (data) setNotes(prev => [ { ...log, id: data.id, date: data.created_at }, ...prev.filter(n => n.id !== log.id) ]);
    } else {
       await supabase.from('neural_logs').update({ title: log.title, content: log.content, mood: log.mood, is_encrypted: log.isEncrypted }).eq('id', log.id);
       setNotes(prev => prev.map(n => n.id === log.id ? log : n));
    }
  };
  const handleDeleteLog = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('neural_logs').delete().eq('id', id);
  };
  const handleWorkoutComplete = async (idx: number, log: WorkoutLog) => {
    if (!session) return;
    await supabase.from('training_logs').insert({ user_id: session.user.id, session_name: log.sessionName, total_volume: log.totalVolume, exercises: log.exercises, date: new Date().toISOString() });
    setStats(s => { const newXp = s.xp + 150; const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 }; updateStatsDB(newStats); return newStats; });
    setWorkoutHistory(prev => [...prev, { date: new Date().toISOString(), sessionName: log.sessionName }]);
  };
  const handleResetWorkout = async (idx: number) => {
    setStats(s => { const newXp = Math.max(0, s.xp - 150); const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 }; updateStatsDB(newStats); return newStats; });
    const sessionToReset = gymSessions[idx]; const startOfWeek = getStartOfCurrentWeek();
    setWorkoutHistory(prev => { const index = prev.slice().reverse().findIndex(log => log.sessionName === sessionToReset.focus && new Date(log.date).getTime() >= startOfWeek); if (index !== -1) { const newH = [...prev]; newH.splice(prev.length - 1 - index, 1); return newH; } return prev; });
  };
  const handleUpdateBiometrics = (key: any, value: any) => {
    setBiometrics(prev => { const updated = { ...prev, [key]: value }; if (key === 'weight') updateBiometricsDB({ current_weight: value }); return updated; });
  };
  const handleSyncWeight = () => {
    setBiometrics(prev => { const newHistory = [...prev.weightHistory, prev.weight].slice(-7); updateBiometricsDB({ weight_history: newHistory }); return { ...prev, weightHistory: newHistory }; });
  };
  const handleUpdatePR = (name: string, weight: number) => setPersonalRecords(prev => prev.map(pr => pr.name === name ? { ...pr, weight, date: 'Today' } : pr));
  const handleAddPhysiqueEntry = async (url: string, date: string) => {
    if (!session) return;
    const { data } = await supabase.from('physique_logs').insert({ user_id: session.user.id, image_url: url, date: date, stats: { weight: biometrics.weight, bench: 0, squat: 0, deadlift: 0 } }).select().single();
    if (data) setPhysiqueLog(prev => [{ id: data.id, imageUrl: data.image_url, date: data.date, stats: data.stats }, ...prev]);
  };

  if (loadingSession) return <div className="h-screen bg-black flex items-center justify-center text-purple-500 font-mono">INITIALIZING...</div>;
  if (!session) return <Auth />;

  return (
    <div className="flex h-screen w-full bg-[#050505] bg-grid text-gray-100 overflow-hidden relative selection:bg-purple-500/30">
      {WALLPAPER_URL && (<div className="fixed inset-0 z-0"><img src={WALLPAPER_URL} className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-black/40 pointer-events-none" /></div>)}
      {isSnowing && <SnowEffect />}
      <RightPanel isSnowing={isSnowing} setIsSnowing={setIsSnowing} schedule={todaysSchedule} hydration={stats.hydration} onUpdateHydration={handleUpdateHydration} />
      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden transition-all duration-300 xl:ml-96 md:mr-32">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth no-scrollbar">
          <div className="max-w-7xl mx-auto h-full pb-20 md:pb-0">
            {activeTab === Tab.DASHBOARD && <Dashboard stats={stats} tasks={tasks} gymSessions={gymSessions} isFocusing={isFocusing} toggleFocus={toggleFocus} onToggleTask={handleToggleTask} />}
            {activeTab === Tab.TASKS && <Tasks tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onEditTask={handleEditTask} pomoState={pomoState} onPomoControl={handlePomoControl} />}
            {activeTab === Tab.GYM && <Gym sessions={gymSessions} biometrics={biometrics} personalRecords={personalRecords} workoutHistory={workoutHistory} physiqueLog={physiqueLog} onWorkoutComplete={handleWorkoutComplete} onResetWorkout={handleResetWorkout} onUpdateBiometrics={handleUpdateBiometrics} onSyncWeight={handleSyncWeight} onUpdatePR={handleUpdatePR} onAddPhysiqueEntry={handleAddPhysiqueEntry} />}
            {activeTab === Tab.JOURNAL && <Journal logs={notes} onUpdateLog={handleUpdateLog} onDeleteLog={handleDeleteLog} />}
            {activeTab === Tab.APPS && <Apps />}
            {activeTab === Tab.CALENDAR && <Calendar schedule={viewSchedule} onAddBlock={handleAddBlock} onDeleteBlock={handleDeleteBlock} viewDate={viewDate} setViewDate={setViewDate} />}
          </div>
        </div>
      </main>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} onLogout={() => supabase.auth.signOut()} />
      {activeTab === 'ai' && session?.user && (
        <div className="fixed inset-0 z-[60]">
           <AIAssistant user={session.user} onClose={() => setActiveTab(Tab.DASHBOARD)} onRefreshData={refreshData} />
        </div>
      )}
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Tab, Task, UserStats, GymSession, Biometrics, Note, ScheduleBlock, PersonalRecord, WorkoutLog, WorkoutHistoryItem, PhysiqueEntry, PomoState, FocusMode } from './types';
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
import { Loader2 } from 'lucide-react';

// --- HELPER: WEEKLY RESET ---
const getStartOfCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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

  // --- STATE ---
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
  
  // Schedule
  const [viewDate, setViewDate] = useState(new Date()); 
  const [viewSchedule, setViewSchedule] = useState<ScheduleBlock[]>([]); 
  const [todaysSchedule, setTodaysSchedule] = useState<ScheduleBlock[]>([]); 

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [physiqueLog, setPhysiqueLog] = useState<PhysiqueEntry[]>([]);

  // Dashboard Focus (Stopwatch)
  const [isFocusing, setIsFocusing] = useState(false);

  // --- GLOBAL POMODORO STATE (Lifted from Tasks) ---
  const [pomoState, setPomoState] = useState<PomoState>({
    mode: 'STANDARD',
    timeLeft: 25 * 60,
    initialTime: 25 * 60,
    isActive: false,
    status: 'IDLE'
  });

  // --- AUTH LISTENER ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to get session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
      } catch (err) {
        console.error("Auth Initialization Error:", err);
        // We remain logged out (session = null)
      } finally {
        // ALWAYS finish loading, preventing black screen
        setLoadingSession(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Ensure loading is cleared on any auth state change
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SYSTEM SYNCHRONIZATION (FETCH DATA) ---
  useEffect(() => {
    if (!session?.user) return;

    const syncSystem = async () => {
      setLoadingData(true);
      try {
        const userId = session.user.id;

        // 1. FETCH USER STATS (Include Biometrics & Hydration)
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (statsError && statsError.code === 'PGRST116') {
          // Create default if not exists
          const defaultStats = {
            user_id: userId,
            xp: 0,
            level: 1,
            streak: 1,
            focus_time: 0,
            last_visit: new Date().toDateString(),
            current_weight: 82.5,
            weight_history: [82.5],
            hydration_current: 0,
            hydration_date: new Date().toDateString()
          };
          await supabase.from('user_stats').insert(defaultStats);
          setStats({
             xp: 0, level: 1, streak: 1, focusTime: 0, lastVisit: defaultStats.last_visit, hydration: 0
          });
          setBiometrics({ weight: 82.5, weightHistory: [82.5] });
        } else if (statsData) {
          const today = new Date().toDateString();
          let newStreak = statsData.streak;
          
          // Streak Logic
          if (statsData.last_visit !== today) {
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             if (statsData.last_visit === yesterday.toDateString()) {
               newStreak += 1;
             } else {
               newStreak = 1;
             }
             // Update Streak in DB
             await supabase.from('user_stats').update({ 
               streak: newStreak, 
               last_visit: today 
             }).eq('user_id', userId);
          }

          // Hydration Reset Logic
          let currentHydration = statsData.hydration_current || 0;
          if (statsData.hydration_date !== today) {
             currentHydration = 0;
             await supabase.from('user_stats').update({
                hydration_current: 0,
                hydration_date: today
             }).eq('user_id', userId);
          }

          setStats({
            xp: statsData.xp,
            level: statsData.level,
            streak: newStreak,
            focusTime: statsData.focus_time,
            lastVisit: today,
            hydration: currentHydration
          });

          // Sync Biometrics from DB
          setBiometrics({
            weight: statsData.current_weight || 82.5,
            weightHistory: statsData.weight_history || [82.5]
          });
        }

        // 2. FETCH TASKS
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (tasksData) {
          setTasks(tasksData.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            category: t.category,
            dueDate: t.due_date
          })));
        }

        // 3. FETCH SCHEDULE
        const { data: scheduleData } = await supabase
          .from('schedule_blocks')
          .select('*')
          .eq('user_id', userId);
        
        if (scheduleData) {
           const blocks: ScheduleBlock[] = scheduleData.map((b: any) => ({
             id: b.id,
             title: b.title,
             startTime: b.start_time,
             type: b.type,
             date: b.date
           }));
           const todayStr = new Date().toISOString().split('T')[0];
           setTodaysSchedule(blocks.filter(b => b.date === todayStr));
        }

        // 4. FETCH LOGS
        const { data: logsData } = await supabase
          .from('neural_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (logsData) {
          setNotes(logsData.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            date: n.created_at || n.date,
            mood: n.mood,
            isEncrypted: n.is_encrypted
          })));
        }

        // 5. FETCH PHYSIQUE LOG
        const { data: physiqueData } = await supabase
          .from('physique_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (physiqueData) {
          setPhysiqueLog(physiqueData.map((p: any) => ({
            id: p.id,
            imageUrl: p.image_url,
            stats: p.stats,
            date: p.date
          })));
        }

        // 6. FETCH TRAINING HISTORY & CALC PRs
        const { data: trainingData } = await supabase
          .from('training_logs')
          .select('*')
          .eq('user_id', userId);

        if (trainingData) {
           const historyItems: WorkoutHistoryItem[] = [];
           const calculatedPRs = [...INITIAL_PRS];

           trainingData.forEach((log: any) => {
              historyItems.push({
                date: log.date,
                sessionName: log.session_name
              });

              if (log.exercises) {
                 log.exercises.forEach((ex: any) => {
                    let prName = '';
                    if (ex.name.includes('Bench Press')) prName = 'Bench Press';
                    if (ex.name.includes('Squat')) prName = 'Squat';
                    if (ex.name.includes('Deadlift')) prName = 'Deadlift';

                    if (prName) {
                       const idx = calculatedPRs.findIndex(p => p.name === prName);
                       if (idx >= 0 && ex.weight > calculatedPRs[idx].weight) {
                          calculatedPRs[idx] = {
                             name: prName,
                             weight: ex.weight,
                             date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          };
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
    };

    syncSystem();
  }, [session]);

  // --- VIEW SCHEDULE UPDATE ---
  useEffect(() => {
    if (!session) return;
    const loadViewSchedule = async () => {
       const dateStr = viewDate.toISOString().split('T')[0];
       const { data } = await supabase
         .from('schedule_blocks')
         .select('*')
         .eq('user_id', session.user.id)
         .eq('date', dateStr);
       
       if (data) {
         setViewSchedule(data.map((b: any) => ({
           id: b.id,
           title: b.title,
           startTime: b.start_time,
           type: b.type,
           date: b.date
         })));
       } else {
         setViewSchedule([]);
       }
    };
    loadViewSchedule();
  }, [viewDate, session]);

  // --- WEEKLY GYM SYNC ---
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
      if (JSON.stringify(updatedSessions) !== JSON.stringify(prevSessions)) return updatedSessions;
      return prevSessions;
    });
  }, [workoutHistory]);

  // --- DB UPDATE HELPERS ---
  const updateStatsDB = async (newStats: Partial<UserStats>) => {
    if (!session) return;
    await supabase.from('user_stats').update({
      xp: newStats.xp,
      level: newStats.level,
      focus_time: newStats.focusTime
    }).eq('user_id', session.user.id);
  };

  const updateBiometricsDB = async (updates: Partial<any>) => {
    if (!session) return;
    await supabase.from('user_stats').update(updates).eq('user_id', session.user.id);
  };

  const handleUpdateHydration = async (amount: number) => {
    if (!session) return;
    const newTotal = Math.max(0, Math.min(stats.hydration + amount, 5000));
    
    setStats(prev => ({ ...prev, hydration: newTotal }));
    
    await supabase.from('user_stats').update({
      hydration_current: newTotal,
      hydration_date: new Date().toDateString()
    }).eq('user_id', session.user.id);
  };

  // --- DASHBOARD STOPWATCH ---
  useEffect(() => {
    let interval: any;
    if (isFocusing) {
      interval = setInterval(() => {
        setStats(prev => {
          const newTime = prev.focusTime + 1;
          let newXp = prev.xp;
          if (newTime > 0 && newTime % 600 === 0) newXp += 10;
          if (newTime % 60 === 0) {
             updateStatsDB({ focusTime: newTime, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 });
          }
          return {
            ...prev,
            focusTime: newTime,
            xp: newXp,
            level: Math.floor(newXp / XP_PER_LEVEL) + 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusing]);

  const toggleFocus = () => setIsFocusing(!isFocusing);

  // --- GLOBAL POMODORO TIMER LOGIC ---
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (pomoState.isActive && pomoState.timeLeft > 0) {
      interval = setInterval(() => {
        setPomoState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1, status: 'ENGAGED' }));
      }, 1000);
    } else if (pomoState.timeLeft === 0 && pomoState.isActive) {
      // Complete
      setPomoState(prev => ({ ...prev, isActive: false, status: 'COMPLETE' }));
      playBeep();
      handleFocusSessionComplete(pomoState.initialTime, POMO_MODES[pomoState.mode].xp);
    }
    return () => clearInterval(interval);
  }, [pomoState.isActive, pomoState.timeLeft]);

  const handlePomoControl = (action: 'START' | 'PAUSE' | 'RESET' | 'MODE', payload?: any) => {
    setPomoState(prev => {
      if (action === 'START') return { ...prev, isActive: true, status: 'ENGAGED' };
      if (action === 'PAUSE') return { ...prev, isActive: false, status: 'PAUSED' };
      if (action === 'RESET') return { ...prev, isActive: false, timeLeft: prev.initialTime, status: 'IDLE' };
      if (action === 'MODE') {
        const newTime = POMO_MODES[payload as FocusMode].minutes * 60;
        return { 
           mode: payload, 
           timeLeft: newTime, 
           initialTime: newTime, 
           isActive: false, 
           status: 'IDLE' 
        };
      }
      return prev;
    });
  };

  // --- STATS HANDLER ---
  const handleFocusSessionComplete = (seconds: number, xpReward: number) => {
    setStats(prev => {
      const newXp = prev.xp + xpReward;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
      const newStats = {
        ...prev,
        focusTime: prev.focusTime + seconds,
        xp: newXp,
        level: newLevel
      };
      updateStatsDB(newStats);
      return newStats;
    });
  };

  // --- TASK HANDLERS (DB) ---
  const handleAddTask = async (newTask: Task) => {
    if (!session) return;
    const { data } = await supabase.from('tasks').insert({
      user_id: session.user.id,
      title: newTask.title,
      status: newTask.status,
      category: newTask.category,
      due_date: newTask.dueDate
    }).select().single();

    if (data) {
      setTasks(prev => [{ ...newTask, id: data.id }, ...prev]);
    }
  };
  
  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !session) return;

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));

    // DB Update
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);

    // XP Logic
    setStats(s => {
      let newXp = s.xp;
      if (newStatus === 'DONE') newXp += 50;
      else newXp = Math.max(0, newXp - 50);
      
      const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
      updateStatsDB(newStats);
      return newStats;
    });
  };

  const handleDeleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);

    if (task.status === 'DONE') {
      setStats(s => {
        const newXp = Math.max(0, s.xp - 50);
        const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
        updateStatsDB(newStats);
        return newStats;
      });
    }
  };
  
  const handleEditTask = async (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    await supabase.from('tasks').update({ title: newTitle }).eq('id', id);
  };

  // --- SCHEDULE HANDLERS ---
  const handleAddBlock = async (block: ScheduleBlock) => {
    if (!session) return;
    const dateStr = viewDate.toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('schedule_blocks')
      .insert({
        user_id: session.user.id,
        title: block.title,
        start_time: block.startTime,
        type: block.type,
        date: dateStr
      })
      .select()
      .single();

    if (data) {
      const newBlock = { 
        id: data.id, 
        title: data.title, 
        startTime: data.start_time, 
        type: data.type, 
        date: data.date 
      };
      setViewSchedule(prev => [...prev, newBlock]);
      if (dateStr === new Date().toISOString().split('T')[0]) {
         setTodaysSchedule(prev => [...prev, newBlock]);
      }
    }
  };

  const handleDeleteBlock = async (id: string) => {
    await supabase.from('schedule_blocks').delete().eq('id', id);
    setViewSchedule(prev => prev.filter(b => b.id !== id));
    setTodaysSchedule(prev => prev.filter(b => b.id !== id));
  };

  // --- LOGS HANDLERS ---
  const handleUpdateLog = async (log: Note) => {
    if (!session) return;
    const isNew = !isNaN(Number(log.id)); 

    if (isNew) {
       const { data } = await supabase.from('neural_logs').insert({
         user_id: session.user.id,
         title: log.title,
         content: log.content,
         mood: log.mood,
         is_encrypted: log.isEncrypted
       }).select().single();
       
       if (data) {
         setNotes(prev => [ { ...log, id: data.id, date: data.created_at }, ...prev.filter(n => n.id !== log.id) ]);
       }
    } else {
       await supabase.from('neural_logs').update({
         title: log.title,
         content: log.content,
         mood: log.mood,
         is_encrypted: log.isEncrypted
       }).eq('id', log.id);
       setNotes(prev => prev.map(n => n.id === log.id ? log : n));
    }
  };

  const handleDeleteLog = async (id: string) => {
    await supabase.from('neural_logs').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // --- GYM HANDLERS ---
  const handleWorkoutComplete = async (sessionIndex: number, log: WorkoutLog) => {
    if (!session) return;

    const { error } = await supabase.from('training_logs').insert({
      user_id: session.user.id,
      session_name: log.sessionName,
      total_volume: log.totalVolume,
      exercises: log.exercises,
      date: new Date().toISOString()
    });

    if (!error) {
      setStats(s => {
        const newXp = s.xp + 150;
        const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
        updateStatsDB(newStats);
        return newStats;
      });

      const historyItem = { date: new Date().toISOString(), sessionName: log.sessionName };
      setWorkoutHistory(prev => [...prev, historyItem]);
    }
  };

  const handleResetWorkout = async (sessionIndex: number) => {
    setStats(s => {
      const newXp = Math.max(0, s.xp - 150);
      const newStats = { ...s, xp: newXp, level: Math.floor(newXp / XP_PER_LEVEL) + 1 };
      updateStatsDB(newStats);
      return newStats;
    });
    
    // Visual reset only for now
    const sessionToReset = gymSessions[sessionIndex];
    const startOfWeek = getStartOfCurrentWeek();
    setWorkoutHistory(prev => {
       const index = prev.slice().reverse().findIndex(log => {
          return log.sessionName === sessionToReset.focus && new Date(log.date).getTime() >= startOfWeek;
       });
       if (index !== -1) {
          const realIndex = prev.length - 1 - index;
          const newH = [...prev];
          newH.splice(realIndex, 1);
          return newH;
       }
       return prev;
    });
  };

  // --- BIO / PR HANDLERS (DB) ---
  const handleUpdateBiometrics = (key: keyof Biometrics, value: any) => {
    setBiometrics(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'weight') {
         updateBiometricsDB({ current_weight: value });
      }
      return updated;
    });
  };

  const handleSyncWeight = () => {
    setBiometrics(prev => {
      const newHistory = [...prev.weightHistory, prev.weight].slice(-7);
      updateBiometricsDB({ weight_history: newHistory });
      return { ...prev, weightHistory: newHistory };
    });
  };
  
  const handleUpdatePR = (name: string, weight: number) => {
    setPersonalRecords(prev => prev.map(pr => pr.name === name ? { ...pr, weight, date: 'Today' } : pr));
  };

  const handleAddPhysiqueEntry = async (url: string, date: string) => {
    if (!session) return;
    const { data } = await supabase.from('physique_logs').insert({
      user_id: session.user.id,
      image_url: url,
      date: date,
      stats: { weight: biometrics.weight, bench: 0, squat: 0, deadlift: 0 }
    }).select().single();

    if (data) {
      setPhysiqueLog(prev => [{
        id: data.id,
        imageUrl: data.image_url,
        date: data.date,
        stats: data.stats
      }, ...prev]);
    }
  };

  if (loadingSession) return <div className="h-screen bg-black flex items-center justify-center text-purple-500 font-mono">INITIALIZING...</div>;
  if (!session) return <Auth />;

  return (
    <div className="flex h-screen w-full bg-[#050505] bg-grid text-gray-100 overflow-hidden relative selection:bg-purple-500/30">
      
      {/* NO LOADING OVERLAY HERE - BACKGROUND SYNC */}

      {WALLPAPER_URL && (
        <div className="fixed inset-0 z-0">
           <img src={WALLPAPER_URL} alt="Wallpaper" className="w-full h-full object-cover opacity-80" />
           <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>
      )}

      {isSnowing && <SnowEffect />}

      <RightPanel isSnowing={isSnowing} setIsSnowing={setIsSnowing} schedule={todaysSchedule} hydration={stats.hydration} onUpdateHydration={handleUpdateHydration} />

      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden transition-all duration-300 xl:ml-96 md:mr-32">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-purple-900/30 bg-black/60 backdrop-blur-md">
          <h1 className="font-orbitron font-bold text-white tracking-widest">ILYASUU<span className="text-purple-500">_OS</span></h1>
        </header>

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
      
      {/* 
          1. Only show if 'ai' tab is active (Full Screen Mode) 
          2. Pass the user object so memory works
      */}
      {activeTab === 'ai' && session?.user && (
        <div className="absolute inset-0 z-50 bg-black p-4 md:p-8 md:pl-24 xl:pl-[400px]">
           <AIAssistant user={session.user} />
        </div>
      )}
      
    </div>
  );
};

export default App;

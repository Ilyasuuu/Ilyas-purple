
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, TrendingUp, Scale, Camera, X, Play, Zap, ChevronRight, RefreshCw, Save, Edit3, Image as ImageIcon, Activity, Upload, Monitor, Hash, Quote, AlertTriangle } from 'lucide-react';
import { GymSession, Biometrics, PersonalRecord, WorkoutLog, WorkoutHistoryItem, PhysiqueEntry } from '../types';
import { WORKOUT_PLAN, WARFARE_QUOTES, DEFAULT_ANCHOR_URL, WEEKLY_WORKOUTS } from '../constants';

interface GymProps {
  sessions: GymSession[];
  biometrics: Biometrics;
  personalRecords: PersonalRecord[];
  workoutHistory: WorkoutHistoryItem[];
  physiqueLog: PhysiqueEntry[];
  onWorkoutComplete: (index: number, log: WorkoutLog) => void;
  onResetWorkout: (index: number) => void;
  onUpdateBiometrics: (key: keyof Biometrics, value: any) => void;
  onSyncWeight: () => void;
  onUpdatePR: (name: string, weight: number) => void;
  onAddPhysiqueEntry: (url: string, date: string) => void;
}

const Gym: React.FC<GymProps> = ({ 
  sessions, biometrics, personalRecords, workoutHistory, physiqueLog,
  onWorkoutComplete, onResetWorkout, onUpdateBiometrics, onSyncWeight, onUpdatePR, onAddPhysiqueEntry 
}) => {
  // Modal State
  const [activeSessionIndex, setActiveSessionIndex] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<any[]>([]);
  const [totalTonnage, setTotalTonnage] = useState(0);

  // Warning State for Overheat
  const [showOverheatWarning, setShowOverheatWarning] = useState<number | null>(null);

  // Bio Archive Modal State
  const [isBioArchiveOpen, setIsBioArchiveOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [newPhysiqueDate, setNewPhysiqueDate] = useState(new Date().toISOString().split('T')[0]);

  // Psychological Warfare State
  const [anchorUrl, setAnchorUrl] = useState<string>(DEFAULT_ANCHOR_URL);
  const [isEditingAnchor, setIsEditingAnchor] = useState(false);
  const [anchorInput, setAnchorInput] = useState('');
  const [currentQuote, setCurrentQuote] = useState(WARFARE_QUOTES[0]);

  // Coolant Flush Animation State
  const [isCooling, setIsCooling] = useState(false);

  // System Restore Animation State
  const [restoreAnim, setRestoreAnim] = useState({ PUSH: false, PULL: false, LEGS: false });
  const prevFatigueRef = useRef({ PUSH: 0, PULL: 0, LEGS: 0 });

  // Load Anchor & Quote Logic
  useEffect(() => {
    const savedAnchor = localStorage.getItem('ilyasuu_visual_anchor');
    if (savedAnchor) setAnchorUrl(savedAnchor);

    setCurrentQuote(WARFARE_QUOTES[Math.floor(Math.random() * WARFARE_QUOTES.length)]);
    
    const interval = setInterval(() => {
      setCurrentQuote(WARFARE_QUOTES[Math.floor(Math.random() * WARFARE_QUOTES.length)]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateAnchor = () => {
    if (anchorInput.trim()) {
      setAnchorUrl(anchorInput.trim());
      localStorage.setItem('ilyasuu_visual_anchor', anchorInput.trim());
    }
    setIsEditingAnchor(false);
  };

  const cycleQuote = () => {
    let nextQuote = currentQuote;
    while (nextQuote === currentQuote) {
      nextQuote = WARFARE_QUOTES[Math.floor(Math.random() * WARFARE_QUOTES.length)];
    }
    setCurrentQuote(nextQuote);
  };

  // --- REACTIVE COUNTING LOGIC ---
  // Total Deployments: Simple length of history array
  const totalDeployments = workoutHistory.length;

  // Monthly Ops: Filter for current month/year
  const monthlyOps = workoutHistory.filter(item => {
    const d = new Date(item.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Initialize Session Data when modal opens
  useEffect(() => {
    if (activeSessionIndex !== null) {
      const sessionName = sessions[activeSessionIndex].focus;
      const exercises = WORKOUT_PLAN[sessionName] || WORKOUT_PLAN['Rest'] || [];
      
      setSessionData(exercises.map(ex => ({
        ...ex,
        logWeight: 0,
        logReps: 0,
        done: false
      })));
    }
  }, [activeSessionIndex, sessions]);

  useEffect(() => {
    const vol = sessionData.reduce((acc, curr) => {
      if (curr.done) {
        return acc + (curr.logWeight * curr.logReps * curr.sets);
      }
      return acc;
    }, 0);
    setTotalTonnage(vol);
  }, [sessionData]);

  const handleUpdateExercise = (index: number, field: string, value: number) => {
    const updated = [...sessionData];
    updated[index] = { ...updated[index], [field]: value };
    setSessionData(updated);
  };

  const toggleSetDone = (index: number) => {
    const updated = [...sessionData];
    updated[index].done = !updated[index].done;
    setSessionData(updated);
  };

  const handleFinishProtocol = () => {
    if (activeSessionIndex === null) return;
    
    const sessionName = sessions[activeSessionIndex].focus;
    
    // Check if Cardio for Coolant Flush Effect
    if (sessionName.toLowerCase().includes('cardio') || sessionName.toLowerCase().includes('recovery')) {
      setIsCooling(true);
      setTimeout(() => setIsCooling(false), 3000); // 3s Animation
    }

    const log: WorkoutLog = {
      date: new Date().toDateString(),
      sessionName: sessionName,
      totalVolume: totalTonnage,
      exercises: sessionData.filter(d => d.done).map(d => ({
        name: d.name,
        weight: d.logWeight,
        reps: d.logReps
      }))
    };

    onWorkoutComplete(activeSessionIndex, log);
    setActiveSessionIndex(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhysiqueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) return;

    onAddPhysiqueEntry(previewImage, newPhysiqueDate);
    setPreviewImage('');
  };

  // Sparkline Logic
  const renderSparkline = () => {
    if (!biometrics.weightHistory || biometrics.weightHistory.length < 2) return null;
    const data = biometrics.weightHistory;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-12 overflow-visible">
        <polyline 
          points={points} 
          fill="none" 
          stroke="#3B82F6" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {data.map((val, i) => {
           const x = (i / (data.length - 1)) * 100;
           const y = 100 - ((val - min) / range) * 100;
           return (
             <circle key={i} cx={x} cy={y} r="4" fill="#3B82F6" className="animate-in fade-in" />
           );
        })}
      </svg>
    );
  };

  // --- CONTINUOUS FATIGUE LOGIC ---
  const calculateFatigue = (system: 'PUSH' | 'PULL' | 'LEGS') => {
    const now = new Date().getTime();
    let fatigue = 0;

    // Filter relevant logs from ALL history (Continuous timeframe)
    const relevantLogs = workoutHistory.filter(h => {
       const sName = h.sessionName.toUpperCase();
       if (system === 'PUSH') return sName.includes('UPPER'); // Upper involves Push
       if (system === 'PULL') return sName.includes('UPPER'); // Upper involves Pull
       if (system === 'LEGS') return sName.includes('LOWER');
       return false;
    });

    // Sort by date descending (newest first)
    relevantLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Only consider the most recent significant workout for fatigue spike
    // But verify if multiple occurred within 48h window
    if (relevantLogs.length > 0) {
        const lastLog = relevantLogs[0];
        const logTime = new Date(lastLog.date).getTime();
        const hoursSince = (now - logTime) / (1000 * 60 * 60);

        if (hoursSince < 24) {
           fatigue = 90; // Critical
        } else if (hoursSince < 48) {
           fatigue = 50; // Stabilizing
        } else {
           fatigue = 0; // Fresh
        }
    }

    return fatigue;
  };

  // --- VOLUME LOGIC (WEEKLY RING) ---
  const calculateWeeklyVolume = (system: 'PUSH' | 'PULL' | 'LEGS') => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0,0,0,0);
      const startOfWeek = monday.getTime();
      const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000);

      // Count sessions for this system this week
      const count = workoutHistory.filter(h => {
        const logTime = new Date(h.date).getTime();
        const sName = h.sessionName.toUpperCase();
        if (logTime < startOfWeek || logTime >= endOfWeek) return false;

        if (system === 'PUSH') return sName.includes('UPPER');
        if (system === 'PULL') return sName.includes('UPPER');
        if (system === 'LEGS') return sName.includes('LOWER');
        return false;
      }).length;

      // Target: 2 sessions per week per system
      return Math.min((count / 2) * 100, 100);
  };

  const getSystemStatus = (fatigue: number) => {
    if (fatigue >= 75) {
      return { 
        color: 'text-red-500', 
        fill: 'rgba(239, 68, 68, 0.8)', 
        glow: 'drop-shadow-[0_0_10px_rgba(220,38,38,0.9)]',
        label: 'CRITICAL',
        animation: 'animate-glitch' // New glitch class
      };
    }
    if (fatigue >= 26) {
      return { 
        color: 'text-orange-500', 
        fill: 'rgba(249, 115, 22, 0.6)', 
        glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]',
        label: 'RECOVERING',
        animation: ''
      };
    }
    return { 
      color: 'text-cyan-500', 
      fill: 'rgba(6, 182, 212, 0.3)', 
      glow: 'drop-shadow-[0_0_5px_rgba(6,182,212,0.4)]',
      label: 'OPTIMAL',
      animation: ''
    };
  };

  const pushFatigue = calculateFatigue('PUSH');
  const pullFatigue = calculateFatigue('PULL');
  const legsFatigue = calculateFatigue('LEGS');

  // Trigger System Restore Animation if reverting from Critical
  useEffect(() => {
    const systems = ['PUSH', 'PULL', 'LEGS'] as const;
    let update = false;
    const newRestores = { ...restoreAnim };

    systems.forEach(sys => {
        const curr = sys === 'PUSH' ? pushFatigue : sys === 'PULL' ? pullFatigue : legsFatigue;
        const prev = prevFatigueRef.current[sys];
        
        // Trigger if we go from CRITICAL (>=75) to OK (<75)
        if (prev >= 75 && curr < 75) {
            newRestores[sys] = true;
            update = true;
        }
        prevFatigueRef.current[sys] = curr;
    });

    if (update) {
        setRestoreAnim(newRestores);
        setTimeout(() => setRestoreAnim({ PUSH: false, PULL: false, LEGS: false }), 800);
    }
  }, [pushFatigue, pullFatigue, legsFatigue]);

  const pushVolume = calculateWeeklyVolume('PUSH');
  const pullVolume = calculateWeeklyVolume('PULL');
  const legsVolume = calculateWeeklyVolume('LEGS');

  const pushStatus = getSystemStatus(pushFatigue);
  const pullStatus = getSystemStatus(pullFatigue);
  const legsStatus = getSystemStatus(legsFatigue);

  // Overheat Check
  const handleSessionClick = (index: number) => {
    const sessionName = sessions[index].focus.toUpperCase();
    let isCritical = false;

    if (sessionName.includes('UPPER')) {
        if (pushFatigue >= 75 || pullFatigue >= 75) isCritical = true;
    } else if (sessionName.includes('LOWER')) {
        if (legsFatigue >= 75) isCritical = true;
    }

    if (isCritical) {
        setShowOverheatWarning(index);
    } else {
        setActiveSessionIndex(index);
    }
  };

  return (
    <>
      <style>{`
         @keyframes glitch {
            0% { transform: translate(0) }
            20% { transform: translate(-2px, 2px) }
            40% { transform: translate(-2px, -2px) }
            60% { transform: translate(2px, 2px) }
            80% { transform: translate(2px, -2px) }
            100% { transform: translate(0) }
         }
         .animate-glitch {
            animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
         }
         @keyframes system-restore {
            0% { filter: brightness(1); opacity: 1; }
            20% { filter: brightness(10) drop-shadow(0 0 20px cyan); opacity: 1; }
            100% { filter: brightness(1); opacity: 1; }
         }
         .animate-restore {
            animation: system-restore 0.8s ease-out forwards;
         }
         @keyframes flow {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
         }
      `}</style>
      
      <div className="h-full overflow-y-auto no-scrollbar pb-10 pr-2">
        <div className="space-y-6">
           
           {/* ROW 0: PROGRAM & BIO (Existing) */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Current Split */}
             <div className="md:col-span-2 glass-panel p-6 rounded-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Dumbbell size={100} />
               </div>
               <h2 className="text-2xl font-orbitron text-white mb-6 border-l-4 border-red-500 pl-4">Program: Hypertrophy V2</h2>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {sessions.map((day, i) => (
                    <div 
                      key={i} 
                      onClick={() => !day.completed && handleSessionClick(i)}
                      className={`
                        p-3 rounded-lg border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 select-none relative overflow-hidden group
                        ${day.completed 
                          ? 'bg-green-500/20 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.3)]' 
                          : 'bg-black/40 border-white/5 opacity-80 hover:opacity-100 hover:border-red-500/50'}
                      `}
                    >
                      {/* Uncheck Button (Only visible if completed) */}
                      {day.completed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetWorkout(i);
                          }}
                          className="absolute top-1 right-1 p-0.5 text-green-300 hover:text-white hover:bg-red-500 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all"
                          title="Uncheck / Reset"
                        >
                          <X size={12} />
                        </button>
                      )}

                      <span className="font-mono text-xs text-gray-400">{day.day}</span>
                      <span className={`font-bold text-sm text-center leading-tight ${day.completed ? 'text-green-400' : 'text-white'}`}>
                        {day.focus}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${day.completed ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-800'}`} />
                    </div>
                  ))}
               </div>
             </div>

             {/* Body Stats Upgrade */}
             <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
               <div>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="flex items-center gap-2 text-gray-400 font-rajdhani uppercase tracking-wide">
                     <Scale size={16} /> Biometrics
                   </h3>
                   <button 
                      onClick={() => setIsBioArchiveOpen(true)}
                      className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-white transition-colors"
                      title="Log Physique"
                   >
                      <Camera size={16} />
                   </button>
                 </div>
                 <div className="space-y-6">
                   
                   {/* Weight & Sparkline */}
                   <div>
                     <div className="flex justify-between items-end mb-1">
                       <span className="text-xs text-gray-500 uppercase">Weight</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-orbitron text-white">{biometrics.weight}</span>
                          <span className="text-sm font-mono text-gray-500">kg</span>
                       </div>
                     </div>
                     
                     {/* Graph Area */}
                     <div className="h-12 w-full mb-3 flex items-center">
                        {renderSparkline() || <div className="w-full h-[1px] bg-gray-700" />}
                     </div>

                     <div className="flex items-center gap-2">
                       <input 
                         type="range" 
                         min="50" max="120" step="0.1"
                         value={biometrics.weight}
                         onChange={(e) => onUpdateBiometrics('weight', parseFloat(e.target.value))}
                         className="flex-1 h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                       />
                       <button 
                         onClick={onSyncWeight}
                         className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded hover:bg-blue-500/40 border border-blue-500/30 transition-colors"
                       >
                         SYNC
                       </button>
                     </div>
                   </div>

                   {/* System Fuel (Calories) */}
                   <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-mono">System Fuel</p>
                        <p className="text-lg font-bold font-rajdhani text-green-400">
                          {Math.round(biometrics.weight * 33)} <span className="text-xs text-gray-500">KCAL</span>
                        </p>
                      </div>
                      <Zap size={20} className="text-yellow-500" />
                   </div>

                 </div>
               </div>
             </div>
           </div>

           {/* ROW 1: VISUALS (System Integrity + Visual Feed) - Equal Height */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-96">
              
              {/* LEFT: System Integrity (Heatmap) */}
              <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col justify-center">
                  {/* COOLANT FLUSH ANIMATION OVERLAY */}
                  {isCooling && (
                     <div className="absolute inset-0 z-30 pointer-events-none bg-blue-500/20 backdrop-blur-[2px] animate-pulse flex items-center justify-center">
                        <div className="text-blue-400 font-orbitron font-bold text-2xl animate-bounce">COOLANT FLUSH...</div>
                     </div>
                  )}

                  <h3 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2 relative z-10 self-start">
                      <Activity size={20} className="text-red-500" /> System Integrity
                  </h3>
                  
                  <div className="flex items-center justify-center gap-12 relative z-10 w-full">
                      {/* SVG Body Map */}
                      <div className="relative transform scale-125">
                        <svg width="120" height="200" viewBox="0 0 100 200" className="drop-shadow-lg">
                          {/* Upper Front (Push) */}
                          <path 
                            d="M20,10 L80,10 L90,40 L80,90 L20,90 L10,40 Z" 
                            fill={pushStatus.fill} 
                            stroke="currentColor" 
                            strokeWidth="1" 
                            className={`${pushStatus.color} ${pushStatus.glow} transition-all duration-700 ${restoreAnim.PUSH ? 'animate-restore text-cyan-200' : pushStatus.animation}`}
                          />
                          
                          {/* Head */}
                          <circle cx="50" cy="15" r="10" fill="#1f2937" />
                          
                          {/* Torso Top (Push) */}
                          <rect x="25" y="30" width="50" height="30" fill={pushStatus.fill} stroke="gray" strokeWidth="0.5" className={`${pushStatus.glow} transition-all duration-700 ${restoreAnim.PUSH ? 'animate-restore fill-cyan-500/50' : pushStatus.animation}`} />
                          
                          {/* Torso Mid (Pull) */}
                          <rect x="25" y="60" width="50" height="30" fill={pullStatus.fill} stroke="gray" strokeWidth="0.5" className={`${pullStatus.glow} transition-all duration-700 ${restoreAnim.PULL ? 'animate-restore fill-cyan-500/50' : pullStatus.animation}`} />
                          
                          {/* Legs */}
                          <rect x="25" y="90" width="22" height="80" fill={legsStatus.fill} stroke="gray" strokeWidth="0.5" className={`${legsStatus.glow} transition-all duration-700 ${restoreAnim.LEGS ? 'animate-restore fill-cyan-500/50' : legsStatus.animation}`} />
                          <rect x="53" y="90" width="22" height="80" fill={legsStatus.fill} stroke="gray" strokeWidth="0.5" className={`${legsStatus.glow} transition-all duration-700 ${restoreAnim.LEGS ? 'animate-restore fill-cyan-500/50' : legsStatus.animation}`} />
                        </svg>
                        
                        {/* Coolant Particles (Blue dots) */}
                        {isCooling && (
                           <div className="absolute inset-0 overflow-hidden">
                              {[...Array(10)].map((_,i) => (
                                 <div key={i} className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ top: Math.random()*100+'%', left: Math.random()*100+'%', animationDelay: Math.random()+'s' }} />
                              ))}
                           </div>
                        )}
                      </div>

                      {/* HUD */}
                      <div className="flex flex-col gap-6">
                         {/* PUSH SYSTEM */}
                         <div className="group cursor-help relative">
                            {/* Volume Ring */}
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-800 rounded-full overflow-hidden">
                               <div className="w-full bg-white transition-all duration-1000" style={{ height: `${pushVolume}%` }} />
                            </div>

                            <p className="text-[10px] text-gray-500 uppercase font-mono pl-2">Push Systems</p>
                            <p className={`text-lg font-bold font-orbitron pl-2 ${pushStatus.color}`}>{pushStatus.label}</p>
                            <p className="text-xs text-gray-600 font-mono pl-2 group-hover:text-white transition-colors">VOLUME: {Math.round(pushVolume)}%</p>
                         </div>
                         
                         {/* PULL SYSTEM */}
                         <div className="group cursor-help relative">
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-800 rounded-full overflow-hidden">
                               <div className="w-full bg-white transition-all duration-1000" style={{ height: `${pullVolume}%` }} />
                            </div>

                            <p className="text-[10px] text-gray-500 uppercase font-mono pl-2">Pull Systems</p>
                            <p className={`text-lg font-bold font-orbitron pl-2 ${pullStatus.color}`}>{pullStatus.label}</p>
                            <p className="text-xs text-gray-600 font-mono pl-2 group-hover:text-white transition-colors">VOLUME: {Math.round(pullVolume)}%</p>
                         </div>

                         {/* LEGS SYSTEM */}
                         <div className="group cursor-help relative">
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-800 rounded-full overflow-hidden">
                               <div className="w-full bg-white transition-all duration-1000" style={{ height: `${legsVolume}%` }} />
                            </div>

                            <p className="text-[10px] text-gray-500 uppercase font-mono pl-2">Legs Systems</p>
                            <p className={`text-lg font-bold font-orbitron pl-2 ${legsStatus.color}`}>{legsStatus.label}</p>
                            <p className="text-xs text-gray-600 font-mono pl-2 group-hover:text-white transition-colors">VOLUME: {Math.round(legsVolume)}%</p>
                         </div>
                      </div>
                  </div>
              </div>

              {/* RIGHT: Visual Feed (Extracted) */}
              <div className="glass-panel p-0 rounded-xl relative overflow-hidden border border-white/10 group bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                 {isEditingAnchor ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 p-4">
                       <div className="w-full max-w-xs space-y-2">
                          <input 
                            type="text" 
                            value={anchorInput}
                            onChange={(e) => setAnchorInput(e.target.value)}
                            placeholder="Paste GIF/MP4 Link"
                            className="w-full bg-gray-900 border border-purple-500 text-white p-2 text-xs font-mono focus:outline-none"
                            autoFocus
                          />
                          <button onClick={handleUpdateAnchor} className="w-full bg-purple-600 text-white text-xs font-bold py-1 hover:bg-purple-500">ENGAGE</button>
                       </div>
                    </div>
                 ) : (
                    <button 
                       onClick={() => { setAnchorInput(anchorUrl); setIsEditingAnchor(true); }}
                       className="absolute top-2 right-2 z-30 text-xs text-white/50 hover:text-white bg-black/50 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       RECONFIGURE
                    </button>
                 )}
                 
                 {/* Media Renderer */}
                 <div className="absolute inset-0 z-0">
                    {anchorUrl.match(/\.(mp4|webm)$/i) ? (
                       <video src={anchorUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                    ) : (
                       <img src={anchorUrl} alt="Visual Anchor" className="w-full h-full object-cover opacity-80" />
                    )}
                 </div>

                 {/* Scanline Overlay (CRT Effect) */}
                 <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                 <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_50px_rgba(0,0,0,0.7)]" />
                 
                 {/* Feed Label */}
                 <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 rounded border border-white/10 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-white tracking-widest">LIVE FEED</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* ROW 2: DATA (Deployments + Neural) */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

               {/* LEFT: Deployments */}
               <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-black/40 to-purple-900/10 border border-purple-500/20">
                   <div className="absolute top-0 left-0 p-4 opacity-50">
                        <Monitor size={16} className="text-purple-500" />
                   </div>
                   <h3 className="font-orbitron font-bold text-gray-300 tracking-wider text-sm mb-6 flex items-center gap-2">
                        PSYCHOLOGICAL WARFARE
                   </h3>

                   <div className="relative flex flex-col items-center">
                        <p className="text-xs text-purple-400 font-mono tracking-[0.2em] mb-2 uppercase">Lifetime Deployments</p>
                        <h2 className="text-7xl font-orbitron font-bold text-white relative z-10 glitch-text" data-text={totalDeployments}>
                          {totalDeployments.toString().padStart(3, '0')}
                        </h2>
                        <div className="absolute -inset-4 bg-purple-500/20 blur-xl opacity-30 animate-pulse" />
                        
                        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                           <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                           <span className="text-xs font-mono text-cyan-400 tracking-widest">
                              CYCLE OPS: {monthlyOps.toString().padStart(2, '0')}
                           </span>
                        </div>
                   </div>
               </div>

               {/* RIGHT: Neural Conditioning */}
               <div 
                   onClick={cycleQuote}
                   className="glass-panel p-8 rounded-xl flex flex-col justify-center cursor-pointer hover:bg-white/5 transition-colors group relative overflow-hidden border border-purple-500/20"
                >
                   <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-50 transition-opacity">
                      <Quote size={40} className="text-gray-500" />
                   </div>
                   
                   <div className="flex items-center gap-2 mb-6">
                      <Hash size={12} className="text-purple-500" />
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Neural Conditioning</span>
                   </div>
                   
                   <div className="min-h-[100px] flex items-center justify-center text-center">
                      <p className="font-mono text-xl text-gray-200 leading-relaxed typewriter-text relative z-10 italic">
                        "{currentQuote}"
                      </p>
                   </div>
                   
                   <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                      <span className="text-[9px] text-purple-500 animate-pulse">AUTO-ROTATION ACTIVE</span>
                      <RefreshCw size={14} className="text-gray-600 group-hover:text-white transition-colors group-hover:rotate-180 duration-500" />
                   </div>
                </div>

           </div>
        </div>
      </div>

       {/* BIO ARCHIVE MODAL */}
       {isBioArchiveOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
           <div className="w-full max-w-4xl glass-panel rounded-2xl border border-blue-500/30 flex flex-col h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-blue-900/10">
                 <div className="flex items-center gap-3">
                    <Camera className="text-blue-400" />
                    <h2 className="text-2xl font-orbitron text-white">BIO-ARCHIVE</h2>
                 </div>
                 <button onClick={() => setIsBioArchiveOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>

              {/* Input Area (FILE UPLOAD) */}
              <form onSubmit={handlePhysiqueSubmit} className="p-6 border-b border-white/10 bg-black/40 flex gap-4 items-center">
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   className="hidden" 
                   accept="image/*"
                   onChange={handleFileSelect}
                 />
                 
                 <div className="flex-1 flex gap-4">
                    <button 
                       type="button"
                       onClick={() => fileInputRef.current?.click()}
                       className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed transition-all ${previewImage ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-600 bg-black/50 text-gray-400 hover:border-blue-500 hover:text-white'}`}
                    >
                       {previewImage ? (
                          <>
                             <img src={previewImage} alt="Preview" className="w-6 h-6 rounded object-cover" />
                             <span className="font-mono text-sm truncate">Ready to Upload</span>
                          </>
                       ) : (
                          <>
                             <Upload size={18} />
                             <span className="font-mono text-sm">Select Image (PC)</span>
                          </>
                       )}
                    </button>
                    
                    <input 
                      type="date"
                      className="bg-black/50 border border-gray-700 rounded-lg px-4 text-white focus:border-blue-500 outline-none font-mono text-sm w-40"
                      value={newPhysiqueDate}
                      onChange={(e) => setNewPhysiqueDate(e.target.value)}
                    />
                 </div>

                 <button type="submit" disabled={!previewImage} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg font-rajdhani">
                    LOG ENTRY
                 </button>
              </form>

              {/* Timeline */}
              <div className="flex-1 overflow-x-auto p-8 flex gap-8 items-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                 {physiqueLog.length === 0 && (
                    <div className="w-full text-center text-gray-500 font-mono italic">
                       No visual data found. Initiate protocol.
                    </div>
                 )}
                 {physiqueLog.map(entry => (
                    <div key={entry.id} className="relative flex-none w-[300px] h-[400px] rounded-xl overflow-hidden group border border-white/10 hover:border-blue-500 transition-all duration-500">
                       <img src={entry.imageUrl} alt="Physique" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-sm" />
                       
                       {/* Normal State Label */}
                       <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent group-hover:opacity-0 transition-opacity">
                          <p className="text-white font-orbitron text-lg">{entry.date}</p>
                       </div>

                       {/* Matrix Hover Overlay */}
                       <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 backdrop-blur-sm">
                          <p className="text-blue-400 font-orbitron text-xl mb-4 border-b border-blue-500 pb-2">{entry.date}</p>
                          <div className="space-y-2 w-full font-mono text-sm text-gray-300">
                             <div className="flex justify-between"><span>WEIGHT</span> <span className="text-white font-bold">{entry.stats.weight}kg</span></div>
                             <div className="flex justify-between"><span>BENCH</span> <span className="text-white font-bold">{entry.stats.bench}kg</span></div>
                             <div className="flex justify-between"><span>SQUAT</span> <span className="text-white font-bold">{entry.stats.squat}kg</span></div>
                             <div className="flex justify-between"><span>DEADLIFT</span> <span className="text-white font-bold">{entry.stats.deadlift}kg</span></div>
                          </div>
                          <div className="mt-8 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-xs font-bold tracking-widest">
                             ARCHIVED
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         </div>
       )}

       {/* SYSTEM OVERHEAT WARNING */}
       {showOverheatWarning !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/50 backdrop-blur-sm animate-in zoom-in-95">
             <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-red-500 shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                 <div className="flex flex-col items-center text-center">
                     <AlertTriangle size={64} className="text-red-500 mb-4 animate-bounce" />
                     <h2 className="text-2xl font-orbitron font-bold text-red-500 mb-2">SYSTEM OVERHEAT WARNING</h2>
                     <p className="text-gray-300 font-rajdhani mb-6">
                         Structure integrity is CRITICAL. Training this muscle group now may cause failure. 
                         Proceed with extreme caution.
                     </p>
                     
                     <div className="flex gap-4 w-full">
                         <button 
                           onClick={() => setShowOverheatWarning(null)}
                           className="flex-1 py-3 bg-black/40 border border-gray-600 text-gray-400 hover:text-white rounded-xl font-bold font-mono"
                         >
                            ABORT
                         </button>
                         <button 
                           onClick={() => {
                              setActiveSessionIndex(showOverheatWarning);
                              setShowOverheatWarning(null);
                           }}
                           className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold font-orbitron tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                         >
                            OVERRIDE
                         </button>
                     </div>
                 </div>
             </div>
         </div>
       )}

       {/* COMBAT MODE MODAL */}
       {activeSessionIndex !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="glass-panel w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
               
               {/* Header */}
               <div className="flex-none p-6 border-b border-white/10 flex justify-between items-center bg-red-900/10">
                  <div>
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                        <Zap size={16} className="animate-pulse" />
                        <span className="text-xs font-mono font-bold tracking-widest uppercase">Combat Mode Active</span>
                    </div>
                    <h2 className="text-2xl font-orbitron font-bold text-white uppercase">
                        {sessions[activeSessionIndex].focus}
                    </h2>
                  </div>
               </div>

               {/* Scrollable Exercise List */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {sessionData.map((ex, idx) => (
                    <div 
                      key={ex.id} 
                      className={`p-4 rounded-xl border transition-all ${ex.done ? 'bg-green-900/10 border-green-500/50' : 'bg-black/40 border-white/10 hover:border-white/20'}`}
                    >
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          
                          {/* Info */}
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${ex.done ? 'bg-green-500' : 'bg-gray-600'}`} />
                                <h4 className={`font-bold font-rajdhani text-lg ${ex.done ? 'text-green-400 line-through' : 'text-white'}`}>{ex.name}</h4>
                             </div>
                             <div className="flex gap-4 text-xs text-gray-500 font-mono pl-4">
                                <span>{ex.sets} Sets</span>
                                <span>{ex.reps} Reps</span>
                                <span className="text-red-400">{ex.target}</span>
                             </div>
                          </div>

                          {/* Inputs */}
                          <div className="flex items-center gap-3">
                             <div className="flex flex-col w-20">
                               <label className="text-[9px] text-gray-500 uppercase mb-1">Weight</label>
                               <input 
                                 type="number" 
                                 placeholder="0"
                                 className="bg-black/50 border border-gray-700 rounded p-2 text-white font-mono text-center focus:border-red-500 outline-none"
                                 value={ex.logWeight || ''}
                                 onChange={(e) => handleUpdateExercise(idx, 'logWeight', parseFloat(e.target.value))}
                               />
                             </div>
                             <div className="flex flex-col w-16">
                               <label className="text-[9px] text-gray-500 uppercase mb-1">Reps</label>
                               <input 
                                 type="number" 
                                 placeholder="0"
                                 className="bg-black/50 border border-gray-700 rounded p-2 text-white font-mono text-center focus:border-red-500 outline-none"
                                 value={ex.logReps || ''}
                                 onChange={(e) => handleUpdateExercise(idx, 'logReps', parseFloat(e.target.value))}
                               />
                             </div>
                             
                             <button 
                               onClick={() => toggleSetDone(idx)}
                               className={`h-10 w-10 mt-4 rounded-lg flex items-center justify-center border transition-all ${ex.done ? 'bg-green-500 border-green-500 text-black shadow-[0_0_10px_lime]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'}`}
                             >
                                <Play size={16} fill="currentColor" />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-white/10 bg-black/40 flex justify-between gap-4">
                  <button 
                    onClick={() => setActiveSessionIndex(null)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-rajdhani font-bold"
                  >
                    ABORT
                  </button>
                  <button 
                    onClick={handleFinishProtocol}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold font-orbitron tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    COMPLETE PROTOCOL <ChevronRight />
                  </button>
               </div>
            </div>
         </div>
       )}
    </>
  );
};

export default Gym;

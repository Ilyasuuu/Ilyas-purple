
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, TrendingUp, Scale, Camera, X, Play, Zap, ChevronRight, RefreshCw, Save, Edit3, Image as ImageIcon, Activity, Upload, Monitor, Hash, Quote } from 'lucide-react';
import { GymSession, Biometrics, PersonalRecord, WorkoutLog, WorkoutHistoryItem, PhysiqueEntry } from '../types';
import { WORKOUT_PLAN, WARFARE_QUOTES, DEFAULT_ANCHOR_URL } from '../constants';

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

  // PR Edit State
  const [editingPR, setEditingPR] = useState<{name: string, weight: string} | null>(null);

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

  // Load Anchor & Quote Logic
  useEffect(() => {
    const savedAnchor = localStorage.getItem('ilyasuu_visual_anchor');
    if (savedAnchor) setAnchorUrl(savedAnchor);

    // Random quote on mount
    setCurrentQuote(WARFARE_QUOTES[Math.floor(Math.random() * WARFARE_QUOTES.length)]);
    
    // Rotate quote every 60s
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

  // Calculate Unique Training Days
  const uniqueDeployments = new Set(workoutHistory.map(item => item.date.split('T')[0])).size;

  // Initialize Session Data when modal opens
  useEffect(() => {
    if (activeSessionIndex !== null) {
      const sessionName = sessions[activeSessionIndex].focus;
      const exercises = WORKOUT_PLAN[sessionName] || WORKOUT_PLAN['Rest'] || [];
      
      // Initialize logging structure
      setSessionData(exercises.map(ex => ({
        ...ex,
        logWeight: 0,
        logReps: 0,
        done: false
      })));
    }
  }, [activeSessionIndex, sessions]);

  // Calculate Tonnage Live
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
    
    // Construct Log
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

  const openPREdit = (name: string, currentWeight: number) => {
    setEditingPR({ name, weight: currentWeight.toString() });
  };

  const savePREdit = () => {
    if (editingPR) {
      const weight = parseFloat(editingPR.weight);
      if (!isNaN(weight)) {
        onUpdatePR(editingPR.name, weight);
      }
      setEditingPR(null);
    }
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
    
    // Normalize points to 0-100% height, width distributed evenly
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
        {/* Dots */}
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

  // --- CUMULATIVE FATIGUE LOGIC (WEEKLY RESET AWARE) ---
  const calculateFatigue = (group: string) => {
    const now = new Date();
    
    // Get start of current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0,0,0,0);
    const startOfWeek = monday.getTime();
    
    const nowTime = new Date().getTime();
    let fatigue = 0;

    // 1. Get all relevant sessions from history THIS WEEK
    const relevantLogs = workoutHistory.filter(h => 
      h.sessionName.toUpperCase().includes(group) && 
      new Date(h.date).getTime() >= startOfWeek
    );

    // 2. Calculate fatigue impact of each session
    relevantLogs.forEach(log => {
      const logTime = new Date(log.date).getTime();
      const hoursPassed = (nowTime - logTime) / (1000 * 60 * 60);
      
      // FATIGUE MODEL:
      // +50 Fatigue per session
      // Decays by 25 every 24 hours (approx 1.04 per hour)
      const initialFatigue = 50;
      const decayRatePerHour = 25 / 24; 
      
      const remainingFatigue = initialFatigue - (hoursPassed * decayRatePerHour);

      if (remainingFatigue > 0) {
        fatigue += remainingFatigue;
      }
    });

    // Cap visual fatigue at 100 (though logic allows higher for stacking)
    return Math.min(Math.round(fatigue), 100);
  };

  const getSystemStatus = (fatigue: number) => {
    if (fatigue >= 75) {
      return { 
        color: 'text-red-500', 
        fill: 'rgba(239, 68, 68, 0.6)', 
        glow: 'drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]',
        label: 'CRITICAL'
      };
    }
    if (fatigue >= 26) {
      return { 
        color: 'text-orange-500', 
        fill: 'rgba(249, 115, 22, 0.4)', 
        glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]',
        label: 'RECOVERING'
      };
    }
    return { 
      color: 'text-cyan-500', 
      fill: 'rgba(6, 182, 212, 0.2)', 
      glow: '',
      label: 'FRESH'
    };
  };

  const pushFatigue = calculateFatigue('PUSH');
  const pullFatigue = calculateFatigue('PULL');
  const legsFatigue = calculateFatigue('LEGS');

  const pushStatus = getSystemStatus(pushFatigue);
  const pullStatus = getSystemStatus(pullFatigue);
  const legsStatus = getSystemStatus(legsFatigue);

  return (
    <div className="space-y-6">
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
                  onClick={() => setActiveSessionIndex(i)}
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

       {/* Secondary Grid: PRs & Integrity */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* PR Board */}
         <div className="glass-panel p-6 rounded-xl">
            <h3 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-yellow-500" /> Personal Records
            </h3>
            <div className="space-y-3">
              {personalRecords.map((pr, i) => (
                <div 
                  key={i} 
                  onClick={() => openPREdit(pr.name, pr.weight)}
                  className="bg-black/40 p-4 rounded-lg border border-white/5 hover:border-yellow-500/50 transition-colors flex justify-between items-center group cursor-pointer hover:bg-white/5 relative overflow-hidden"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 size={12} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-mono">{pr.name}</p>
                    <p className="text-2xl font-bold font-rajdhani text-white group-hover:text-yellow-400 transition-colors flex items-end gap-1">
                        {pr.weight} <span className="text-sm font-normal text-gray-500 mb-1">kg</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">{pr.date}</span>
                </div>
              ))}
            </div>
         </div>

         {/* Structural Integrity (Heatmap) */}
         <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <h3 className="font-orbitron text-xl text-white mb-4 flex items-center gap-2 relative z-10">
                <Activity size={20} className="text-red-500" /> System Integrity
            </h3>
            <div className="flex items-start justify-center gap-8 relative z-10">
                {/* SVG Body Map */}
                <svg width="120" height="200" viewBox="0 0 100 200" className="drop-shadow-lg">
                   {/* Upper Front (Push) */}
                   <path 
                     d="M20,10 L80,10 L90,40 L80,90 L20,90 L10,40 Z" 
                     fill={pushStatus.fill} 
                     stroke="currentColor" 
                     strokeWidth="1" 
                     className={`${pushStatus.color} ${pushStatus.glow} transition-all duration-700`}
                   />
                   
                   {/* Head */}
                   <circle cx="50" cy="15" r="10" fill="#1f2937" />
                   
                   {/* Torso Top (Push) */}
                   <rect x="25" y="30" width="50" height="30" fill={pushStatus.fill} stroke="gray" strokeWidth="0.5" className={`${pushStatus.glow} transition-all duration-700`} />
                   
                   {/* Torso Mid (Pull) */}
                   <rect x="25" y="60" width="50" height="30" fill={pullStatus.fill} stroke="gray" strokeWidth="0.5" className={`${pullStatus.glow} transition-all duration-700`} />
                   
                   {/* Legs */}
                   <rect x="25" y="90" width="22" height="80" fill={legsStatus.fill} stroke="gray" strokeWidth="0.5" className={`${legsStatus.glow} transition-all duration-700`} />
                   <rect x="53" y="90" width="22" height="80" fill={legsStatus.fill} stroke="gray" strokeWidth="0.5" className={`${legsStatus.glow} transition-all duration-700`} />
                </svg>

                {/* HUD */}
                <div className="flex-1 space-y-4 pt-4">
                   <div className="group cursor-help">
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Push Systems</p>
                      <p className={`text-lg font-bold font-orbitron ${pushStatus.color}`}>{pushStatus.label}</p>
                      <p className="text-xs text-gray-600 font-mono group-hover:text-white transition-colors">FATIGUE: {pushFatigue}%</p>
                   </div>
                   <div className="group cursor-help">
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Pull Systems</p>
                      <p className={`text-lg font-bold font-orbitron ${pullStatus.color}`}>{pullStatus.label}</p>
                      <p className="text-xs text-gray-600 font-mono group-hover:text-white transition-colors">FATIGUE: {pullFatigue}%</p>
                   </div>
                   <div className="group cursor-help">
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Legs Systems</p>
                      <p className={`text-lg font-bold font-orbitron ${legsStatus.color}`}>{legsStatus.label}</p>
                      <p className="text-xs text-gray-600 font-mono group-hover:text-white transition-colors">FATIGUE: {legsFatigue}%</p>
                   </div>
                </div>
            </div>
         </div>
       </div>

       {/* PSYCHOLOGICAL WARFARE MODULE */}
       <div className="glass-panel rounded-xl overflow-hidden relative border border-purple-900/40">
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="p-3 bg-black/60 border-b border-purple-900/50 flex justify-between items-center relative z-10">
              <h3 className="font-orbitron font-bold text-gray-300 flex items-center gap-2 tracking-wider text-sm">
                 <Monitor size={14} className="text-purple-500" /> PSYCHOLOGICAL WARFARE
              </h3>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75" />
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 relative z-10">
              {/* WIDGET A: TOTAL DEPLOYMENTS */}
              <div className="p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-black/20 to-purple-900/10">
                 <p className="text-xs text-purple-400 font-mono tracking-[0.2em] mb-2 uppercase">Total Deployments</p>
                 <div className="relative">
                    <h2 className="text-6xl font-orbitron font-bold text-white relative z-10 glitch-text" data-text={uniqueDeployments}>
                      {uniqueDeployments.toString().padStart(3, '0')}
                    </h2>
                    <div className="absolute -inset-4 bg-purple-500/20 blur-xl opacity-30 animate-pulse" />
                 </div>
                 <p className="text-[10px] text-gray-600 font-mono mt-2">SESSIONS COMPLETED</p>
              </div>

              {/* WIDGET B: VISUAL ANCHOR (HOLO FRAME) */}
              <div className="relative h-64 lg:h-auto bg-black border-b lg:border-b-0 lg:border-r border-white/5 group overflow-hidden">
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
              </div>

              {/* WIDGET C: NEURAL CONDITIONING */}
              <div 
                 onClick={cycleQuote}
                 className="p-6 flex flex-col justify-center cursor-pointer hover:bg-white/5 transition-colors group relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-50 transition-opacity">
                    <Quote size={40} className="text-gray-500" />
                 </div>
                 <div className="flex items-center gap-2 mb-4">
                    <Hash size={12} className="text-purple-500" />
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Neural Conditioning</span>
                 </div>
                 <div className="min-h-[80px] flex items-center">
                    <p className="font-mono text-sm text-gray-300 leading-relaxed typewriter-text relative z-10">
                      "{currentQuote}"
                    </p>
                 </div>
                 <div className="mt-4 flex justify-between items-center">
                    <span className="text-[9px] text-purple-500 animate-pulse">AUTO-ROTATION ACTIVE</span>
                    <RefreshCw size={12} className="text-gray-600 group-hover:text-white transition-colors group-hover:rotate-180 duration-500" />
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

       {/* PR EDIT MODAL */}
       {editingPR && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-orbitron text-xl text-white">Update 1RM</h3>
                <button onClick={() => setEditingPR(null)} className="text-gray-400 hover:text-white"><X /></button>
             </div>
             
             <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 uppercase tracking-widest">{editingPR.name}</p>
                  <div className="relative inline-block mt-2">
                    <input 
                      type="number" 
                      value={editingPR.weight}
                      onChange={(e) => setEditingPR({ ...editingPR, weight: e.target.value })}
                      className="text-4xl font-orbitron bg-transparent text-center text-white border-b-2 border-yellow-500 focus:outline-none w-32"
                      autoFocus
                    />
                    <span className="absolute -right-6 bottom-2 text-gray-500 font-mono text-sm">kg</span>
                  </div>
                </div>

                <button 
                  onClick={savePREdit}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg font-rajdhani tracking-wider transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  SAVE RECORD
                </button>
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
                  <div className="text-right">
                     <p className="text-xs text-gray-400 font-mono uppercase">Session Volume</p>
                     <p className="text-xl font-mono text-white">{totalTonnage.toLocaleString()} <span className="text-sm text-gray-500">kg</span></p>
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
    </div>
  );
};

export default Gym;

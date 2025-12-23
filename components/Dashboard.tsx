
import React, { useState } from 'react';
import { QUOTES } from '../constants';
import { Flame, CheckCircle, Clock, Activity, Trophy, Calendar, MapPin, Zap } from 'lucide-react';
import { Task, UserStats, GymSession, ScheduleBlock } from '../types';

interface DashboardProps {
  stats: UserStats;
  tasks: Task[];
  gymSessions: GymSession[];
  upcomingSchedule: ScheduleBlock[];
  isFocusing: boolean;
  toggleFocus: () => void;
  onToggleTask: (id: string) => void;
  onNavigateToSchedule: (date: string, blockId: string) => void;
  nutritionState: boolean[];
  onUpdateNutrition: (index: number, val: boolean) => void;
}

const StatCard: React.FC<{ 
  label: string; 
  value: string | React.ReactNode; 
  icon: React.ReactNode; 
  color?: string;
  onClick?: () => void;
  isActive?: boolean;
}> = ({ label, value, icon, color = "purple", onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`
      glass-panel p-4 rounded-2xl relative overflow-hidden group transition-all duration-300 bg-white/5 border-white/10
      ${onClick ? 'cursor-pointer' : ''}
      ${isActive ? `border-${color}-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]` : 'hover:scale-[1.02]'}
    `}
  >
    <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${color}-600/10 rounded-full blur-2xl group-hover:bg-${color}-600/20 transition-all`} />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 font-rajdhani text-xs uppercase tracking-wider">{label}</p>
        <div className="mt-1 font-orbitron font-bold text-white text-xl">
          {value}
        </div>
      </div>
      <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, gymSessions, upcomingSchedule, isFocusing, toggleFocus, onToggleTask, onNavigateToSchedule, nutritionState, onUpdateNutrition }) => {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;

  // --- NUTRIENT SEQUENCER LOCAL ANIMATION STATE ---
  const [animations, setAnimations] = useState<{id: number, left: number, val: number}[]>([]);
  const mealLabels = ["LOAD 1", "LOAD 2", "LOAD 3", "RECOVERY"];

  const toggleMeal = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const isComplete = !nutritionState[index];
    
    // Call Parent Handler (Upsert Logic)
    onUpdateNutrition(index, isComplete);

    // Only Trigger XP Animation if turning ON
    if (isComplete) {
      const id = Date.now();
      // Store relative index for positioning
      setAnimations(prev => [...prev, { id, left: index, val: 10 }]);
      setTimeout(() => setAnimations(prev => prev.filter(a => a.id !== id)), 1000);
    }
  };

  const completedMealsCount = nutritionState.filter(Boolean).length;
  const fuelPercentage = Math.round((completedMealsCount / 4) * 100);

  // --- EXISTING LOGIC ---
  const formatFocusTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const xpForNextLevel = 500;
  const currentLevelProgress = (stats.xp % xpForNextLevel) / xpForNextLevel * 100;

  const totalPlanned = gymSessions.length; 
  const totalCompleted = gymSessions.filter(s => s.completed).length;
  const adherence = Math.round((totalCompleted / totalPlanned) * 100);
  const isPerfectWeek = adherence === 100;

  const getAdherenceColor = (pct: number) => {
    if (pct === 100) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]';
    if (pct >= 80) return 'text-green-400';
    if (pct >= 50) return 'text-orange-400';
    return 'text-red-500';
  };

  const groupedSchedule = upcomingSchedule.reduce((acc, block) => {
    const date = new Date(block.date || '');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (date.toDateString() === today.toDateString()) key = "TODAY";
    else if (date.toDateString() === tomorrow.toDateString()) key = "TOMORROW";

    if (!acc[key]) acc[key] = [];
    acc[key].push(block);
    return acc;
  }, {} as Record<string, ScheduleBlock[]>);

  const scheduleKeys = Object.keys(groupedSchedule);

  return (
    <div className="space-y-4 animate-fade-in pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative glass-panel rounded-3xl p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-6 bg-purple-500"></div>
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">System Status: Optimal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-orbitron font-bold text-white mb-2 leading-tight">
            Focus, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Ilyasuu.</span>
          </h1>
          <p className="text-gray-300 font-rajdhani text-lg max-w-2xl italic pl-1 opacity-80">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          label="Streak" 
          value={`${stats.streak} Days`} 
          icon={<Flame className="w-5 h-5 animate-pulse text-orange-500" />} 
          color="orange"
        />
        <StatCard 
          label="Tasks" 
          value={`${completedTasks}/${totalTasks}`} 
          icon={<CheckCircle className="w-5 h-5 text-green-400" />} 
          color="green"
        />
        <StatCard 
          label={isFocusing ? "Focusing..." : "Focus Time"} 
          value={formatFocusTime(stats.focusTime)} 
          icon={isFocusing ? <Clock className="w-5 h-5 animate-spin text-blue-400" /> : <Clock className="w-5 h-5 text-blue-400" />} 
          color="blue"
          onClick={toggleFocus}
          isActive={isFocusing}
        />
        
        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden bg-white/5 border-white/10 group min-w-0">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-600/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div className="min-w-0">
               <p className="text-gray-400 font-rajdhani text-xs uppercase tracking-wider">Rank</p>
               <h3 className="text-xl font-bold font-orbitron mt-1 text-white flex items-baseline gap-1">
                 LVL {stats.level}
                 <span className="text-[10px] font-mono text-gray-500 font-normal">/ {stats.xp} XP</span>
               </h3>
            </div>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex-shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* NUTRIENT SEQUENCER WIDGET */}
      <div className="glass-panel p-4 rounded-xl flex items-center gap-4 relative overflow-hidden border-white/10">
         <div className="flex items-center gap-2 mr-2">
            <Zap className="text-cyan-400" size={16} />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden sm:inline">Nutrient Sequencer</span>
         </div>
         
         <div className="flex-1 flex gap-2 sm:gap-4 items-center">
            {nutritionState.map((isComplete, idx) => (
               <button
                  key={idx}
                  onClick={(e) => toggleMeal(idx, e)}
                  className={`
                     relative flex-1 h-10 sm:h-12 rounded transition-all duration-300 flex items-center justify-center overflow-hidden group
                     ${isComplete 
                        ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-cyan-400 text-black' 
                        : 'bg-black/20 border border-dashed border-white/20 text-gray-600 hover:border-cyan-500/50 hover:text-cyan-500/50'}
                  `}
               >
                  <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest relative z-10">
                     {mealLabels[idx]}
                  </span>
                  
                  {/* Fill Animation */}
                  {isComplete && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
                  
                  {/* Floating +10 XP Toast - Rendered relative to button to simplify positioning */}
                  {animations.filter(a => a.left === idx).map(anim => (
                     <div 
                        key={anim.id}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold font-orbitron text-white pointer-events-none animate-float-up z-20"
                     >
                        +{anim.val} XP
                     </div>
                  ))}
               </button>
            ))}
         </div>

         <div className="text-right min-w-[70px]">
            <span className="text-[10px] font-mono text-cyan-500 font-bold block">FUEL: {fuelPercentage}%</span>
            <div className="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
               <div 
                  className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                  style={{ width: `${fuelPercentage}%` }}
               />
            </div>
         </div>
         
         <style>{`
            @keyframes float-up {
               0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
               100% { transform: translate(-50%, -250%) scale(1.5); opacity: 0; }
            }
            .animate-float-up {
               animation: float-up 0.8s ease-out forwards;
            }
         `}</style>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* COL 1: Upcoming Tasks */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 flex flex-col h-[350px] min-w-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="font-orbitron text-lg text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Protocol
            </h3>
            <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">LIVE</span>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-1">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onToggleTask(task.id)}
                className="flex items-start justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/40 hover:bg-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${task.status === 'DONE' ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-white font-rajdhani font-semibold text-sm transition-colors break-words leading-tight ${task.status === 'DONE' ? 'line-through text-gray-500' : 'group-hover:text-purple-300'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase">{task.category} // {task.dueDate}</p>
                  </div>
                </div>
                {task.status === 'DONE' && <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
              </div>
            ))}
            {tasks.length === 0 && (
               <div className="h-full flex items-center justify-center opacity-30 flex-col">
                  <Activity size={24} className="mb-2" />
                  <p className="text-gray-500 text-xs font-mono italic">No active protocols.</p>
               </div>
            )}
          </div>
        </div>

        {/* COL 2: Tactical Forecast */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 flex flex-col h-[350px] relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Calendar size={100} />
          </div>
          
          <div className="flex justify-between items-center mb-4 flex-shrink-0 relative z-10">
            <h3 className="font-orbitron text-lg text-white flex items-center gap-2">
               <MapPin className="w-4 h-4 text-blue-500" /> Forecast
            </h3>
            <span className="text-[10px] font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">30 DAYS</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 relative z-10">
             {upcomingSchedule.length > 0 ? (
                <>
                  <div 
                    onClick={() => onNavigateToSchedule(upcomingSchedule[0].date || '', upcomingSchedule[0].id)}
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 flex items-center gap-3 relative overflow-hidden group min-w-0 cursor-pointer hover:border-blue-400 transition-colors"
                  >
                     <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-white/10 pr-3">
                        <span className="text-[10px] font-mono text-blue-300">NEXT</span>
                        <span className="text-base font-bold font-orbitron text-white">{upcomingSchedule[0].startTime}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white font-rajdhani text-base">{upcomingSchedule[0].title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                           <span className={`w-1 h-1 rounded-full ${upcomingSchedule[0].type === 'WORK' ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                           {upcomingSchedule[0].type}
                        </div>
                     </div>
                  </div>

                  {scheduleKeys.map(key => (
                     <div key={key}>
                        <h4 className="text-[9px] font-bold text-gray-500 font-mono mb-1 sticky top-0 bg-[#0c0c12] py-1 z-10 uppercase tracking-widest border-b border-white/5">
                           {key}
                        </h4>
                        <div className="space-y-1">
                           {groupedSchedule[key].map(block => {
                              if (key === 'TODAY' && block.id === upcomingSchedule[0].id) return null;
                              return (
                                 <div 
                                    key={block.id} 
                                    onClick={() => onNavigateToSchedule(block.date || '', block.id)}
                                    className="flex gap-2 items-center p-1.5 rounded hover:bg-white/5 transition-colors group cursor-pointer"
                                 >
                                    <span className="font-mono text-[10px] text-gray-400 group-hover:text-white transition-colors w-10 flex-shrink-0">{block.startTime}</span>
                                    <div className={`w-0.5 h-6 rounded-full flex-shrink-0 ${block.type === 'GYM' ? 'bg-red-500' : block.type === 'WORK' ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-rajdhani font-medium text-gray-200 group-hover:text-white">{block.title}</p>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  ))}
                </>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <Calendar size={32} className="mb-2 text-blue-500" />
                   <p className="text-xs font-mono text-gray-400">Horizon clear.</p>
                </div>
             )}
          </div>
        </div>

        {/* COL 3: Body Mechanics */}
        <div className={`glass-panel rounded-3xl p-5 border-white/10 flex flex-col h-[350px] min-w-0 relative overflow-hidden transition-all duration-1000 ${isPerfectWeek ? 'border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.15)]' : ''}`}>
          
          {/* 100% Glow Effect */}
          {isPerfectWeek && (
             <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none" />
          )}

          <h3 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2 relative z-10">
             Body Mechanics
          </h3>
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar relative z-10">
            {gymSessions.map((session, idx) => {
              const todayIndex = (new Date().getDay() + 6) % 7; 
              const isToday = idx === todayIndex;
              const isRest = session.focus === 'Rest';
              
              let barColor = 'bg-white/5';
              let glow = '';
              
              if (session.completed) {
                 if (isRest) {
                    barColor = 'bg-cyan-500';
                    glow = 'shadow-[0_0_8px_cyan]';
                 } else {
                    barColor = 'bg-purple-500';
                    glow = 'shadow-[0_0_8px_#A855F7]';
                 }
              }

              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${isToday ? 'bg-white/5 border border-white/20' : 'border border-transparent'}`}
                >
                  <span className={`font-mono text-xs w-8 flex-shrink-0 ${isToday ? 'text-white font-bold' : 'text-gray-500'}`}>{session.day}</span>
                  
                  <div className="flex-1 mx-2 flex gap-0.5 h-1">
                     {[...Array(8)].map((_, i) => (
                        <div 
                           key={i} 
                           className={`flex-1 rounded-sm transition-all duration-500 ${barColor} ${glow}`}
                           style={{ opacity: session.completed ? 1 : 0.3 }}
                        />
                     ))}
                  </div>

                  <span className={`text-[10px] font-rajdhani w-16 text-right ${session.completed ? 'text-green-400' : isToday ? 'text-white' : 'text-gray-600'}`}>
                    {session.focus.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 text-center flex justify-between items-center relative z-10">
             <span className="text-[9px] text-gray-500 font-mono uppercase">System Diagnostic</span>
             <p className={`font-orbitron text-xs font-bold ${getAdherenceColor(adherence)}`}>
               SYNC: {adherence}%
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

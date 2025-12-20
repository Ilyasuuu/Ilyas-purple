
import React from 'react';
import { QUOTES } from '../constants';
import { Flame, CheckCircle, Clock, Activity, Trophy, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Task, UserStats, GymSession, ScheduleBlock } from '../types';

interface DashboardProps {
  stats: UserStats;
  tasks: Task[];
  gymSessions: GymSession[];
  upcomingSchedule: ScheduleBlock[];
  isFocusing: boolean;
  toggleFocus: () => void;
  onToggleTask: (id: string) => void;
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
      glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 bg-white/5 border-white/10
      ${onClick ? 'cursor-pointer' : ''}
      ${isActive ? `border-${color}-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]` : 'hover:scale-[1.02]'}
    `}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-600/10 rounded-full blur-2xl group-hover:bg-${color}-600/20 transition-all`} />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 font-rajdhani text-sm uppercase tracking-wider">{label}</p>
        {/* REMOVED TRUNCATE to show full value */}
        <div className="mt-1 font-orbitron font-bold text-white text-2xl">
          {value}
        </div>
      </div>
      <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/20 flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, gymSessions, upcomingSchedule, isFocusing, toggleFocus, onToggleTask }) => {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;

  const formatFocusTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const xpForNextLevel = 500;
  const currentLevelProgress = (stats.xp % xpForNextLevel) / xpForNextLevel * 100;
  const xpRemaining = xpForNextLevel - (stats.xp % xpForNextLevel);

  const todayIndex = (new Date().getDay() + 6) % 7; 
  const daysPassed = todayIndex + 1;
  const daysCompleted = gymSessions.slice(0, daysPassed).filter(s => s.completed).length;
  const adherence = daysPassed > 0 ? Math.round((daysCompleted / daysPassed) * 100) : 100;

  const getAdherenceColor = (pct: number) => {
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
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="relative glass-panel rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-purple-500"></div>
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">System Status: Optimal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-white mb-2 leading-tight">
            Focus, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Ilyasuu.</span>
          </h1>
          <p className="text-gray-300 font-rajdhani text-xl max-w-2xl italic pl-1 mt-4 opacity-80">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Current Streak" 
          value={`${stats.streak} ${stats.streak === 1 ? 'Day' : 'Days'}`} 
          icon={<Flame className="w-6 h-6 animate-pulse text-orange-500" />} 
          color="orange"
        />
        <StatCard 
          label="Tasks Cleared" 
          value={`${completedTasks}/${totalTasks}`} 
          icon={<CheckCircle className="w-6 h-6 text-green-400" />} 
          color="green"
        />
        <StatCard 
          label={isFocusing ? "Focusing..." : "Focus Time"} 
          value={formatFocusTime(stats.focusTime)} 
          icon={isFocusing ? <Clock className="w-6 h-6 animate-spin text-blue-400" /> : <Clock className="w-6 h-6 text-blue-400" />} 
          color="blue"
          onClick={toggleFocus}
          isActive={isFocusing}
        />
        
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden bg-white/5 border-white/10 group min-w-0">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-600/10 rounded-full blur-2xl" />
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div className="min-w-0">
               <p className="text-gray-400 font-rajdhani text-sm uppercase tracking-wider">Rank</p>
               <h3 className="text-2xl font-bold font-orbitron mt-1 text-white flex items-baseline gap-1">
                 LVL {stats.level}
                 <span className="text-xs font-mono text-gray-500 font-normal">/ {stats.xp} XP</span>
               </h3>
            </div>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-right text-gray-500 mt-1 font-mono">
            {xpRemaining} XP to next level
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        
        {/* COL 1: Upcoming Tasks - REMOVED FIXED HEIGHT (h-[500px]) */}
        <div className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col min-h-[400px] h-auto min-w-0">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h3 className="font-orbitron text-xl text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" /> Protocol Override
            </h3>
            <span className="text-xs font-mono text-purple-400 px-2 py-1 bg-purple-500/10 rounded border border-purple-500/20">LIVE</span>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onToggleTask(task.id)}
                className="flex items-start justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/40 hover:bg-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${task.status === 'DONE' ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-white font-rajdhani font-semibold text-base transition-colors break-words leading-tight ${task.status === 'DONE' ? 'line-through text-gray-500' : 'group-hover:text-purple-300'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">{task.category} // {task.dueDate}</p>
                  </div>
                </div>
                {task.status === 'DONE' && <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />}
              </div>
            ))}
            {tasks.length === 0 && (
               <div className="h-full flex items-center justify-center opacity-30 flex-col min-h-[200px]">
                  <Activity size={32} className="mb-2" />
                  <p className="text-gray-500 text-sm font-mono italic">No active protocols.</p>
               </div>
            )}
          </div>
        </div>

        {/* COL 2: Tactical Forecast - REMOVED FIXED HEIGHT */}
        <div className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col min-h-[400px] h-auto relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
             <Calendar size={120} />
          </div>
          
          <div className="flex justify-between items-center mb-6 flex-shrink-0 relative z-10">
            <h3 className="font-orbitron text-xl text-white flex items-center gap-2">
               <MapPin className="w-5 h-5 text-blue-500" /> Tactical Forecast
            </h3>
            <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">30 DAYS</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 relative z-10">
             {upcomingSchedule.length > 0 ? (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 flex items-center gap-4 relative overflow-hidden group min-w-0">
                     <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-4">
                        <span className="text-xs font-mono text-blue-300">NEXT UP</span>
                        <span className="text-lg font-bold font-orbitron text-white">{upcomingSchedule[0].startTime}</span>
                     </div>
                     <div className="flex-1 min-w-0">
                        {/* REMOVED TRUNCATE */}
                        <h4 className="font-bold text-white font-rajdhani text-lg">{upcomingSchedule[0].title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                           <span className={`w-1.5 h-1.5 rounded-full ${upcomingSchedule[0].type === 'WORK' ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                           {upcomingSchedule[0].type}
                        </div>
                     </div>
                     <ArrowRight className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
                  </div>

                  {scheduleKeys.map(key => (
                     <div key={key}>
                        <h4 className="text-[10px] font-bold text-gray-500 font-mono mb-2 sticky top-0 bg-[#0c0c12] py-1 z-10 uppercase tracking-widest border-b border-white/5">
                           {key}
                        </h4>
                        <div className="space-y-2">
                           {groupedSchedule[key].map(block => {
                              if (key === 'TODAY' && block.id === upcomingSchedule[0].id) return null;
                              return (
                                 <div key={block.id} className="flex gap-3 items-center p-2 rounded hover:bg-white/5 transition-colors group">
                                    <span className="font-mono text-xs text-gray-400 group-hover:text-white transition-colors w-12 flex-shrink-0">{block.startTime}</span>
                                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${block.type === 'GYM' ? 'bg-red-500' : block.type === 'WORK' ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                                    <div className="flex-1 min-w-0">
                                       {/* REMOVED TRUNCATE */}
                                       <p className="text-sm font-rajdhani font-medium text-gray-200 group-hover:text-white">{block.title}</p>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  ))}
                </>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 min-h-[200px]">
                   <Calendar size={40} className="mb-2 text-blue-500" />
                   <p className="text-sm font-mono text-gray-400">Horizon clear.</p>
                   <p className="text-xs text-gray-600">No scheduled ops for 30 days.</p>
                </div>
             )}
          </div>
        </div>

        {/* COL 3: Weekly Progress - REMOVED FIXED HEIGHT */}
        <div className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col min-h-[400px] h-auto min-w-0 lg:col-span-2 xl:col-span-1">
          <h3 className="font-orbitron text-xl text-white mb-6 flex items-center gap-2">
             Body Mechanics
          </h3>
          <div className="flex-1 space-y-3">
            {gymSessions.map((session, idx) => {
              const isToday = idx === todayIndex;
              const isPast = idx < todayIndex;
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
              } else if (isPast) {
                 barColor = 'bg-red-900/40'; 
              }

              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${isToday ? 'bg-white/5 border border-white/20' : 'border border-transparent'}`}
                >
                  <span className={`font-mono text-sm w-8 flex-shrink-0 ${isToday ? 'text-white font-bold' : 'text-gray-500'}`}>{session.day}</span>
                  
                  <div className="flex-1 mx-3 flex gap-0.5 h-1.5">
                     {[...Array(8)].map((_, i) => (
                        <div 
                           key={i} 
                           className={`flex-1 rounded-sm transition-all duration-500 ${barColor} ${glow}`}
                           style={{ opacity: session.completed || isPast ? 1 : 0.3 }}
                        />
                     ))}
                  </div>

                  {/* SHOW FULL TEXT OR AT LEAST A GOOD CHUNK */}
                  <span className={`text-xs font-rajdhani w-20 text-right ${session.completed ? 'text-green-400' : isToday ? 'text-white' : 'text-gray-600'}`}>
                    {session.focus}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/10 text-center flex justify-between items-center">
             <span className="text-[10px] text-gray-500 font-mono uppercase">System Diagnostic</span>
             <p className={`font-orbitron text-sm font-bold ${getAdherenceColor(adherence)}`}>
               WEEKLY SYNC: {adherence}%
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

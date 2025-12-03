
import React, { useState, useEffect } from 'react';
import { CloudRain, Droplets, Activity, Sun, Cloud, CloudLightning, CloudSnow, Snowflake, Plus, X, Zap, Dumbbell, Flame } from 'lucide-react';
import { ScheduleBlock } from '../types';

interface RightPanelProps {
  isSnowing: boolean;
  setIsSnowing: (val: boolean) => void;
  schedule: ScheduleBlock[]; // Represents Today's Schedule
  hydration: number;
  onUpdateHydration: (amount: number) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ isSnowing, setIsSnowing, schedule, hydration, onUpdateHydration }) => {
  const [weather, setWeather] = useState<{ temp: number; code: number; description: string } | null>(null);
  
  // Hydration UI State
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);
  const DAILY_GOAL = 3000; // 3000ml = 3L

  // Gym Countdown State
  const [gymTimer, setGymTimer] = useState("00:00:00");
  const [gymStatus, setGymStatus] = useState<'COUNTDOWN' | 'HYPE' | 'CRITICAL' | 'DONE'>('COUNTDOWN');
  const [workoutSplit, setWorkoutSplit] = useState("");

  // Weather Fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Vilnius Coordinates: 54.6872° N, 25.2797° E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=54.6872&longitude=25.2797&current=temperature_2m,weather_code&timezone=auto'
        );
        
        if (!response.ok) throw new Error('Weather API Error');
        
        const data = await response.json();
        
        const code = data.current.weather_code;
        const temp = Math.round(data.current.temperature_2m);
        
        setWeather({
          temp,
          code,
          description: getWeatherDescription(code)
        });
      } catch (error) {
        // Silent fail for weather to avoid console noise
        setWeather({ temp: 12, code: 3, description: "Offline" });
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Gym Countdown Logic (Enhanced with Schedule Integration)
  useEffect(() => {
    const updateGymTimer = () => {
      const now = new Date();
      
      // Determine Split based on Day (0-6 Sun-Sat)
      const dayIndex = now.getDay();
      const splits = [
        "FULL BODY / ACTIVE RECOVERY", // 0 Sun
        "PUSH / CHEST & TRIS",         // 1 Mon
        "PULL / BACK & BIS",           // 2 Tue
        "LEGS / QUADS & CALVES",       // 3 Wed
        "PUSH / SHOULDERS",            // 4 Thu
        "PULL / REAR DELTS",           // 5 Fri
        "LEGS / HAMS & GLUTES"         // 6 Sat
      ];
      setWorkoutSplit(splits[dayIndex]);

      // 1. Check Schedule for a GYM block
      let target = new Date();
      
      const todaysGymBlocks = schedule
        .filter(b => b.type === 'GYM')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Find the first gym block that is in the future (or strictly upcoming)
      const upcomingBlock = todaysGymBlocks.find(b => {
         const [h, m] = b.startTime.split(':').map(Number);
         const blockDate = new Date();
         blockDate.setHours(h, m, 0, 0);
         return blockDate > now;
      });

      if (upcomingBlock) {
         const [h, m] = upcomingBlock.startTime.split(':').map(Number);
         target.setHours(h, m, 0, 0);
      } else {
         // Default to 22:00 if no block found
         target.setHours(22, 0, 0, 0);
      }

      if (now > target) {
        setGymStatus('DONE');
        setGymTimer("00:00:00");
        return;
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setGymTimer(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      // Status Logic
      if (diff < 10 * 60 * 1000) { // < 10 mins
        setGymStatus('CRITICAL');
      } else if (diff < 60 * 60 * 1000) { // < 1 hour
        setGymStatus('HYPE');
      } else {
        setGymStatus('COUNTDOWN');
      }
    };

    const timer = setInterval(updateGymTimer, 1000);
    updateGymTimer(); // Initial call
    return () => clearInterval(timer);
  }, [schedule]); // Re-run if schedule changes


  const getWeatherDescription = (code: number): string => {
    if (code === 0) return "Clear Sky";
    if (code === 1 || code === 2 || code === 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Showers";
    if (code >= 95) return "Thunderstorm";
    return "Unknown";
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-8 h-8 text-gray-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-8 h-8 text-white drop-shadow-[0_0_10px_white]" />;
    if (code >= 95) return <CloudLightning className="w-8 h-8 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />;
    return <CloudRain className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />;
  };

  return (
    <>
      <aside className="hidden xl:flex flex-col w-80 fixed left-6 top-6 bottom-6 glass-floating rounded-[30px] p-6 space-y-6 overflow-y-auto z-40 no-scrollbar">
        
        {/* Profile */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <span className="font-orbitron font-bold text-white">IL</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white font-rajdhani">Ilyasuu</h3>
            <p className="text-xs text-purple-300 font-mono animate-pulse">● ONLINE</p>
          </div>
        </div>

        {/* Weather */}
        <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-white/10 relative overflow-hidden group">
          <button 
            onClick={() => setIsSnowing(!isSnowing)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 z-10 ${isSnowing ? 'bg-white text-blue-900 shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'bg-black/20 text-gray-500 hover:bg-white/10 hover:text-white'}`}
          >
            <Snowflake size={16} className={isSnowing ? 'animate-spin-slow' : ''} />
          </button>
          <div className="flex justify-between items-start mb-2">
            {weather ? getWeatherIcon(weather.code) : <Activity className="w-8 h-8 animate-spin text-gray-500"/>}
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pr-8">Vilnius</span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-orbitron text-white">{weather ? `${weather.temp}°` : '--'}</h3>
            <span className="text-sm text-gray-400 mb-1 font-rajdhani">{weather ? weather.description : 'Syncing...'}</span>
          </div>
        </div>

        {/* Hydration */}
        <div 
          onClick={() => setIsHydrationModalOpen(true)}
          className="glass-panel p-5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group relative overflow-hidden border border-cyan-500/20"
        >
          <div 
            className="absolute bottom-0 left-0 h-full bg-cyan-500/10 transition-all duration-700 ease-out"
            style={{ width: `${Math.min((hydration / DAILY_GOAL) * 100, 100)}%` }}
          />
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <Droplets size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-orbitron">Hydration</h4>
                <p className="text-xs text-cyan-400 font-mono">{hydration}ml <span className="text-gray-500">/ {DAILY_GOAL}ml</span></p>
              </div>
            </div>
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-700" />
                <circle 
                  cx="20" cy="20" r="16" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  fill="transparent" 
                  className="text-cyan-400"
                  strokeDasharray={100}
                  strokeDashoffset={100 - (Math.min(hydration / DAILY_GOAL, 1) * 100)}
                />
              </svg>
              <Plus size={12} className="absolute text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* GYM COUNTDOWN CARD */}
        <div className={`
          glass-panel p-5 rounded-2xl relative overflow-hidden group border
          ${gymStatus === 'HYPE' ? 'border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'border-purple-500/20'}
          ${gymStatus === 'CRITICAL' ? 'border-purple-500 shadow-[0_0_30px_rgba(139,0,255,0.4)]' : ''}
        `}>
           {/* Animated Backgrounds */}
           {gymStatus === 'HYPE' && (
             <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-purple-900/10 animate-pulse pointer-events-none" />
           )}
           {gymStatus === 'CRITICAL' && (
             <>
                <div className="absolute inset-0 bg-purple-600/5 animate-pulse z-0" />
                <Zap className="absolute top-2 right-2 text-white w-24 h-24 opacity-5 animate-spark" />
             </>
           )}

           <div className="relative z-10">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-orbitron font-bold text-white flex items-center gap-2">
                 NEXT SESSION <Flame size={18} className={`${gymStatus === 'HYPE' || gymStatus === 'CRITICAL' ? 'text-orange-500 animate-bounce' : 'text-purple-500'}`} />
               </h3>
             </div>

             {gymStatus === 'DONE' ? (
                <div className="text-center py-4">
                  <h2 className="text-4xl font-orbitron text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.6)] mb-2">CRUSHED ✅</h2>
                  <p className="text-xs text-gray-400 font-rajdhani">RECOVERY MODE ACTIVE</p>
                </div>
             ) : (
                <div className="text-center">
                  <div className={`text-4xl font-orbitron font-bold tracking-widest mb-2 
                    ${gymStatus === 'CRITICAL' ? 'text-white drop-shadow-[0_0_15px_#8B00FF] animate-pulse' : 'text-purple-300'}
                  `}>
                    {gymTimer}
                  </div>
                  
                  {gymStatus === 'CRITICAL' ? (
                    <p className="text-xs font-bold text-white font-orbitron animate-neon-pulse tracking-widest text-red-400">
                      LET'S FUCKING GO ILYASUU
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-white font-orbitron tracking-wide uppercase">
                      {workoutSplit}
                    </p>
                  )}
                </div>
             )}
           </div>
        </div>

      </aside>

      {/* Hydration Modal */}
      {isHydrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHydrationModalOpen(false)}
          />
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl relative animate-in zoom-in-95 duration-200 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <button 
              onClick={() => setIsHydrationModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-orbitron text-white">Hydration Log</h3>
              <p className="text-cyan-400 font-mono text-sm mt-1">Daily Target: {DAILY_GOAL}ml</p>
            </div>

            {/* Big Progress Circle */}
            <div className="flex justify-center mb-8 relative">
              <div className="w-40 h-40 rounded-full border-4 border-gray-800 flex items-center justify-center relative">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                   <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                   <circle 
                     cx="50%" cy="50%" r="70" 
                     stroke="currentColor" 
                     strokeWidth="8" 
                     fill="transparent" 
                     className="text-cyan-500 transition-all duration-700 ease-out drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                     strokeDasharray={440}
                     strokeDashoffset={440 - (Math.min(hydration / DAILY_GOAL, 1) * 440)}
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="text-center z-10">
                   <span className="text-4xl font-bold text-white block">{Math.round((hydration / DAILY_GOAL) * 100)}%</span>
                   <span className="text-xs text-gray-400 uppercase tracking-widest">{hydration}ml</span>
                 </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => onUpdateHydration(250)}
                   className="p-4 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 rounded-xl transition-all flex flex-col items-center gap-2 group"
                 >
                   <Plus className="text-cyan-400 group-hover:scale-110 transition-transform" />
                   <span className="text-white font-rajdhani font-bold">+250ml</span>
                   <span className="text-[10px] text-gray-500">Cup</span>
                 </button>
                 <button 
                   onClick={() => onUpdateHydration(500)}
                   className="p-4 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 rounded-xl transition-all flex flex-col items-center gap-2 group"
                 >
                   <Plus className="text-cyan-400 group-hover:scale-110 transition-transform" />
                   <span className="text-white font-rajdhani font-bold">+500ml</span>
                   <span className="text-[10px] text-gray-500">Bottle</span>
                 </button>
               </div>
               
               {/* Manual Slider/Input */}
               <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                 <div className="flex justify-between text-xs text-gray-400 mb-2">
                   <span>Manual Adjust</span>
                   <span>{hydration}ml</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" 
                   max="4000" 
                   step="50"
                   value={hydration}
                   onChange={(e) => onUpdateHydration(parseInt(e.target.value) - hydration)}
                   className="w-full accent-cyan-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                 />
               </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default RightPanel;

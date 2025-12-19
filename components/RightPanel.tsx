
import React, { useState, useEffect } from 'react';
import { CloudRain, Droplets, Activity, Sun, Cloud, CloudLightning, CloudSnow, Snowflake, Plus, X, Zap, Flame, Moon } from 'lucide-react';
import { ScheduleBlock } from '../types';

interface RightPanelProps {
  isSnowing: boolean;
  setIsSnowing: (val: boolean) => void;
  schedule: ScheduleBlock[];
  hydration: number;
  onUpdateHydration: (amount: number) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ isSnowing, setIsSnowing, schedule, hydration, onUpdateHydration }) => {
  const [weather, setWeather] = useState<{ temp: number; code: number; description: string } | null>(null);
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);
  const DAILY_GOAL = 3000;
  
  const [gymTimer, setGymTimer] = useState("00:00:00");
  const [gymStatus, setGymStatus] = useState<'COUNTDOWN' | 'HYPE' | 'CRITICAL' | 'DONE'>('COUNTDOWN');
  const [workoutSplit, setWorkoutSplit] = useState("");

  // Weather Fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=54.6872&longitude=25.2797&current=temperature_2m,weather_code&timezone=auto'
        );
        if (!response.ok) throw new Error('Weather API Error');
        const data = await response.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          description: getWeatherDescription(data.current.weather_code)
        });
      } catch (error) {
        setWeather({ temp: 12, code: 3, description: "Offline" });
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Gym Timer Logic
  useEffect(() => {
    const updateGymTimer = () => {
      const now = new Date();
      const splits = ["FULL BODY", "PUSH A", "PULL A", "LEGS A", "PUSH B", "PULL B", "LEGS B"];
      setWorkoutSplit(splits[now.getDay()]);

      let target = new Date();
      const todaysGym = schedule.filter(b => b.type === 'GYM').sort((a, b) => a.startTime.localeCompare(b.startTime));
      const nextBlock = todaysGym.find(b => {
         const [h, m] = b.startTime.split(':').map(Number);
         const d = new Date(); d.setHours(h, m, 0, 0);
         return d > now;
      });

      if (nextBlock) {
         const [h, m] = nextBlock.startTime.split(':').map(Number);
         target.setHours(h, m, 0, 0);
      } else {
         target.setHours(22, 0, 0, 0);
      }

      if (now > target) {
        setGymStatus('DONE'); setGymTimer("00:00:00"); return;
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setGymTimer(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      
      if (diff < 10 * 60 * 1000) setGymStatus('CRITICAL');
      else if (diff < 60 * 60 * 1000) setGymStatus('HYPE');
      else setGymStatus('COUNTDOWN');
    };
    const timer = setInterval(updateGymTimer, 1000);
    updateGymTimer();
    return () => clearInterval(timer);
  }, [schedule]);

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    return "Unknown";
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
    if (code <= 3) return <Cloud className="w-8 h-8 text-gray-400" />;
    if (code >= 71) return <CloudSnow className="w-8 h-8 text-white drop-shadow-[0_0_10px_white]" />;
    return <CloudRain className="w-8 h-8 text-blue-400" />;
  };

  return (
    <>
      <aside className="hidden xl:flex flex-col w-80 fixed right-6 top-6 bottom-6 glass-floating rounded-[30px] p-6 space-y-6 overflow-y-auto z-40 no-scrollbar">
        
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
          <div className="absolute bottom-0 left-0 h-full bg-cyan-500/10 transition-all duration-700 ease-out" style={{ width: `${Math.min((hydration / DAILY_GOAL) * 100, 100)}%` }} />
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.2)]"><Droplets size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-white font-orbitron">Hydration</h4>
                <p className="text-xs text-cyan-400 font-mono">{hydration}ml <span className="text-gray-500">/ {DAILY_GOAL}ml</span></p>
              </div>
            </div>
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-700" />
                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-cyan-400" strokeDasharray={100} strokeDashoffset={100 - (Math.min(hydration / DAILY_GOAL, 1) * 100)} />
              </svg>
              <Plus size={12} className="absolute text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Gym Countdown */}
        <div className={`glass-panel p-5 rounded-2xl relative overflow-hidden group border ${gymStatus === 'HYPE' ? 'border-red-500/30' : 'border-purple-500/20'} ${gymStatus === 'CRITICAL' ? 'border-purple-500 shadow-[0_0_30px_rgba(139,0,255,0.4)]' : ''}`}>
           {gymStatus === 'HYPE' && <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-purple-900/10 animate-pulse pointer-events-none" />}
           {gymStatus === 'CRITICAL' && <div className="absolute inset-0 bg-purple-600/5 animate-pulse z-0" />}
           <div className="relative z-10">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-orbitron font-bold text-white flex items-center gap-2">NEXT SESSION <Flame size={18} className={`${gymStatus === 'HYPE' ? 'text-orange-500 animate-bounce' : 'text-purple-500'}`} /></h3>
             </div>
             {gymStatus === 'DONE' ? (
                <div className="text-center py-4"><h2 className="text-4xl font-orbitron text-green-400 mb-2">CRUSHED ✅</h2></div>
             ) : (
                <div className="text-center">
                  <div className={`text-4xl font-orbitron font-bold tracking-widest mb-2 ${gymStatus === 'CRITICAL' ? 'text-white animate-pulse' : 'text-purple-300'}`}>{gymTimer}</div>
                  <p className="text-xs font-bold text-white font-orbitron tracking-wide uppercase">{gymStatus === 'CRITICAL' ? "LET'S GO ILYASUU" : workoutSplit}</p>
                </div>
             )}
           </div>
        </div>

        {/* --- PRAYER TIMES WIDGET --- */}
        <div className="glass-panel p-0 rounded-2xl relative overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] group">
           {/* Header */}
           <div className="absolute top-0 left-0 w-full p-3 bg-black/80 backdrop-blur-md z-10 flex justify-between items-center border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                 <Moon size={14} className="text-emerald-400" />
                 <span className="font-orbitron font-bold text-white text-xs tracking-widest">PRAYER UPLINK</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-mono text-emerald-500">SYNCED</span>
              </div>
           </div>

           {/* Iframe with Dark Mode Filter */}
           <div className="w-full h-[360px] bg-black pt-8">
              <iframe 
                id="iframe" 
                title="prayerWidget" 
                className="w-full h-full" 
                style={{ 
                    border: 'none',
                    // This filter creatively inverts the white widget to fit the dark UI
                    filter: 'invert(0.92) hue-rotate(180deg) contrast(1.1) saturate(0.8)' 
                }} 
                scrolling="no" 
                src="https://www.islamicfinder.org/prayer-widget/593116/shafi/1/0/18.0/17.0"
              />
           </div>
           {/* Decorative Footer */}
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 via-emerald-500 to-emerald-900 opacity-50" />
        </div>

      </aside>

      {/* Hydration Modal */}
      {isHydrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHydrationModalOpen(false)} />
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl relative animate-in zoom-in-95 border border-cyan-500/30">
            <button onClick={() => setIsHydrationModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
            <div className="text-center mb-6"><h3 className="text-2xl font-orbitron text-white">Hydration Log</h3><p className="text-cyan-400 font-mono text-sm mt-1">Target: {DAILY_GOAL}ml</p></div>
            <div className="flex justify-center mb-8 relative">
              <div className="w-40 h-40 rounded-full border-4 border-gray-800 flex items-center justify-center relative">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                   <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                   <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-cyan-500 transition-all duration-700 ease-out" strokeDasharray={440} strokeDashoffset={440 - (Math.min(hydration / DAILY_GOAL, 1) * 440)} strokeLinecap="round" />
                 </svg>
                 <div className="text-center z-10"><span className="text-4xl font-bold text-white block">{Math.round((hydration / DAILY_GOAL) * 100)}%</span><span className="text-xs text-gray-400 uppercase tracking-widest">{hydration}ml</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => onUpdateHydration(250)} className="p-4 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl flex flex-col items-center gap-2"><Plus className="text-cyan-400" /><span className="text-white font-bold">+250ml</span></button>
                 <button onClick={() => onUpdateHydration(500)} className="p-4 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl flex flex-col items-center gap-2"><Plus className="text-cyan-400" /><span className="text-white font-bold">+500ml</span></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RightPanel;

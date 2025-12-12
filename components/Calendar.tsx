
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleBlock } from '../types';
import { Plus, X, Trash2, Calendar as CalIcon, ChevronRight, RotateCcw } from 'lucide-react';

interface CalendarProps {
  schedule: ScheduleBlock[];
  onAddBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (id: string) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
}

// 06:00 to 23:00 (18 slots)
const START_HOUR = 6;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const ROW_HEIGHT = 80; // Fixed pixel height per hour

const Calendar: React.FC<CalendarProps> = ({ schedule, onAddBlock, onDeleteBlock, viewDate, setViewDate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  
  // Form State
  const [selectedTime, setSelectedTime] = useState<string>('06:00');
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<ScheduleBlock['type']>('WORK');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate Next 30 Days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isToday = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  const isViewDateToday = isToday(viewDate, new Date());

  // Update Laser Line & Scroll to now on mount
  useEffect(() => {
    // Initial scroll to current time
    if (scrollRef.current) {
       const h = new Date().getHours();
       if (h > 7) {
         scrollRef.current.scrollTop = (h - 7) * ROW_HEIGHT;
       }
    }

    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---

  const handleSlotClick = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    // Open New
    setEditingBlockId(null);
    setSelectedTime(timeStr);
    setTitleInput('');
    setTypeInput('WORK');
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, block: ScheduleBlock) => {
    e.stopPropagation();
    // Open Edit
    setEditingBlockId(block.id);
    setSelectedTime(block.startTime);
    setTitleInput(block.title);
    setTypeInput(block.type);
    setIsModalOpen(true);
  };

  const handleDeleteFromModal = () => {
    if (editingBlockId) {
      onDeleteBlock(editingBlockId);
      setIsModalOpen(false);
    }
  };

  const handleSave = () => {
    if (!titleInput.trim()) return;

    if (editingBlockId) {
      // Edit Mode: Delete old, add new (to handle time moves)
      onDeleteBlock(editingBlockId);
      onAddBlock({
        id: editingBlockId, // Keep ID
        title: titleInput,
        startTime: selectedTime,
        type: typeInput
      });
    } else {
      // Add Mode
      onAddBlock({
        id: Date.now().toString(),
        title: titleInput,
        startTime: selectedTime,
        type: typeInput
      });
    }
    setIsModalOpen(false);
  };

  // --- VISUAL CALCULATIONS ---

  const getLaserTop = () => {
    // Only show laser if viewing Today
    if (!isViewDateToday) return -9999;

    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (h < START_HOUR) return -10;
    
    // (Hours passed * 80px) + (Minutes % * 80px)
    return ((h - START_HOUR) * ROW_HEIGHT) + (m * (ROW_HEIGHT / 60));
  };

  const getBlockStyles = (type: ScheduleBlock['type']) => {
    switch (type) {
      case 'WORK': return 'border-l-purple-500 bg-purple-900/30 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:bg-purple-900/50';
      case 'GYM': return 'border-l-red-500 bg-red-900/30 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:bg-red-900/50';
      case 'SCHOOL': return 'border-l-yellow-500 bg-yellow-900/30 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)] hover:bg-yellow-900/50';
      case 'PERSONAL': return 'border-l-cyan-500 bg-cyan-900/30 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-900/50';
    }
  };

  const laserTop = getLaserTop();

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden relative">
      
      {/* Header & Date Ribbon */}
      <div className="flex-none bg-black/40 z-20 backdrop-blur-md border-b border-white/10 flex flex-col">
          {/* Top Bar */}
          <div className="h-14 px-4 flex justify-between items-center">
            <h2 className="font-orbitron text-xl text-white flex items-center gap-2">
              <CalIcon className="text-purple-500" /> TACTICAL TIMELINE
            </h2>
            
            {/* Return to Today Button */}
            {!isViewDateToday && (
              <button 
                onClick={() => setViewDate(new Date())}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold font-rajdhani border border-purple-500/30 hover:bg-purple-500/40 transition-colors animate-in fade-in"
              >
                <RotateCcw size={14} /> BACK TO TODAY
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <div className={`w-2 h-2 rounded-full ${isViewDateToday ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-xs font-mono text-gray-300">
                  {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>

          {/* Horizontal Date Ribbon */}
          <div className="flex overflow-x-auto gap-2 px-4 pb-4 no-scrollbar items-center">
             {days.map((d, i) => {
               const active = isToday(d, viewDate);
               const today = isToday(d, new Date());
               const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
               const dateNum = d.getDate();

               return (
                 <button
                   key={i}
                   onClick={() => setViewDate(d)}
                   className={`
                     flex-none min-w-[60px] h-[70px] rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border relative
                     ${active 
                        ? 'bg-purple-900/40 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105' 
                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                     }
                   `}
                 >
                    {today && (
                      <span className="absolute -top-1.5 px-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full">TODAY</span>
                    )}
                    <span className="text-[10px] font-bold tracking-wider">{dayName}</span>
                    <span className={`text-xl font-rajdhani font-bold ${active ? 'text-white' : 'text-gray-400'}`}>{dateNum}</span>
                 </button>
               );
             })}
          </div>
      </div>

      {/* Scrollable Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative no-scrollbar bg-black/40">
        
        {/* Laser Line (Only on Today) */}
        {laserTop >= 0 && (
          <div 
            className="absolute left-0 w-full h-[2px] bg-red-500 z-30 shadow-[0_0_15px_red] pointer-events-none flex items-center"
            style={{ top: `${laserTop}px` }}
          >
             <div className="absolute left-14 -top-2.5 bg-red-600 text-[9px] font-bold px-1.5 rounded text-white font-mono">
               NOW
             </div>
             <div className="w-full h-full bg-gradient-to-r from-red-500 via-red-400 to-red-500 opacity-80" />
          </div>
        )}

        {/* The Grid */}
        <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>
           {HOURS.map((h) => {
             const timeStr = `${h.toString().padStart(2, '0')}:00`;
             const block = schedule.find(b => b.startTime === timeStr);

             return (
               <div 
                 key={h} 
                 className="w-full border-b border-white/5 flex group/row transition-colors hover:bg-white/5 relative"
                 style={{ height: `${ROW_HEIGHT}px` }}
               >
                 {/* Left Time Label */}
                 <div className="w-20 flex-none border-r border-white/5 bg-black/20 flex items-start justify-center pt-2">
                   <span className="text-xs font-mono text-gray-500">{timeStr}</span>
                 </div>

                 {/* Content Slot */}
                 <div className="flex-1 relative p-1">
                    
                    {/* Empty Slot Click Target */}
                    {!block && (
                       <div 
                         className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
                         onClick={() => handleSlotClick(h)}
                       >
                         <Plus className="text-purple-500/30" />
                       </div>
                    )}

                    {/* Event Block */}
                    {block && (
                      <div className="w-full h-full relative group/card isolate">
                        
                        {/* Main Content Layer */}
                        <div 
                          onClick={(e) => handleEventClick(e, block)}
                          className={`
                            absolute inset-0 z-10
                            rounded border-y border-r flex items-center justify-between px-4 cursor-pointer transition-all hover:brightness-110
                            ${getBlockStyles(block.type)}
                            border-l-[4px] backdrop-blur-md
                          `}
                        >
                          <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest text-white mb-0.5">{block.type}</span>
                              <span className="font-rajdhani font-bold text-white text-lg tracking-wide break-words leading-tight line-clamp-3">
                                {block.title}
                              </span>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(139,0,255,0.2)] animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-orbitron text-xl text-white">
                  {editingBlockId ? 'Edit Operation' : 'New Operation'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>

              <div className="space-y-5">
                {/* Type Selection */}
                <div>
                   <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Protocol Type</label>
                   <div className="grid grid-cols-4 gap-2">
                      {(['WORK', 'GYM', 'SCHOOL', 'PERSONAL'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setTypeInput(t)}
                          className={`p-2 rounded text-[10px] font-bold border transition-all ${typeInput === t ? 'bg-purple-500 text-white border-purple-500' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                          {t}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Time Slot</label>
                  <select 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white font-mono focus:border-purple-500 outline-none"
                  >
                    {HOURS.map(h => {
                       const t = `${h.toString().padStart(2, '0')}:00`;
                       return <option key={t} value={t}>{t}</option>;
                    })}
                  </select>
                </div>

                {/* Title Input */}
                <div>
                   <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Operation Title</label>
                   <input 
                     type="text" 
                     className="w-full bg-black/50 border border-gray-700 rounded p-3 text-white focus:border-purple-500 focus:outline-none font-rajdhani text-lg"
                     placeholder="e.g. Deep Work Session"
                     value={titleInput}
                     onChange={e => setTitleInput(e.target.value)}
                     autoFocus
                     onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                   />
                </div>

                <div className="flex gap-3 mt-6">
                  {editingBlockId && (
                     <button 
                       onClick={handleDeleteFromModal}
                       className="px-4 py-4 bg-red-500/20 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors"
                     >
                       <Trash2 size={20} />
                     </button>
                  )}
                  <button 
                    onClick={handleSave}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg font-rajdhani tracking-wider transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
                  >
                    {editingBlockId ? 'UPDATE SCHEDULE' : 'CONFIRM OPERATION'}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;


import React, { useState } from 'react';
import { Task, PomoState, FocusMode, TaskFrequency } from '../types';
import { Play, Pause, RotateCcw, Plus, Trash2, Edit3, Check, Zap, Repeat, Calendar, Flag } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, newTitle: string) => void;
  pomoState: PomoState;
  onPomoControl: (action: 'START' | 'PAUSE' | 'RESET' | 'MODE', payload?: any) => void;
}

const MODES: Record<FocusMode, { label: string; xp: number }> = {
  DEEP: { label: 'DEEP WORK', xp: 150 },
  STANDARD: { label: 'STANDARD', xp: 60 },
  QUICK: { label: 'QUICK', xp: 30 },
};

const Tasks: React.FC<TasksProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, onEditTask, pomoState, onPomoControl }) => {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<TaskFrequency>('DAILY');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    
    // Smart Tag Parsing Logic
    let category: 'WORK' | 'GYM' | 'PERSONAL' | 'SCHOOL' | 'SYSTEM' = 'SYSTEM';
    let title = newTaskInput;
    let dueDate = 'Today'; // Default

    const lowerInput = newTaskInput.toLowerCase();

    if (lowerInput.includes('/gym')) {
      category = 'GYM';
      title = title.replace(/\/gym/gi, '').trim();
    } else if (lowerInput.includes('/work')) {
      category = 'WORK';
      title = title.replace(/\/work/gi, '').trim();
    } else if (lowerInput.includes('/personal')) {
      category = 'PERSONAL';
      title = title.replace(/\/personal/gi, '').trim();
    } else if (lowerInput.includes('/school')) {
      category = 'SCHOOL';
      title = title.replace(/\/school/gi, '').trim();
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: title,
      status: 'TODO',
      category: category as any,
      frequency: selectedFrequency,
      dueDate: dueDate
    };
    onAddTask(newTask);
    setNewTaskInput('');
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditInput(task.title);
  };

  const saveEditing = () => {
    if (editingId && editInput.trim()) {
      onEditTask(editingId, editInput.trim());
    }
    setEditingId(null);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'GYM': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'WORK': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'PERSONAL': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'SCHOOL': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-800/50 border-gray-600/30';
    }
  };

  // SVG Logic for Pomodoro
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((pomoState.initialTime - pomoState.timeLeft) / pomoState.initialTime) * circumference;

  // Split tasks
  const dailyTasks = tasks.filter(t => t.frequency === 'DAILY' || !t.frequency);
  const weeklyTasks = tasks.filter(t => t.frequency === 'WEEKLY');
  const monthlyTasks = tasks.filter(t => t.frequency === 'MONTHLY');

  const renderTaskList = (list: Task[], title: string, icon: React.ReactNode, borderColor: string, emptyMsg: string) => (
    <div className={`glass-panel p-4 rounded-xl border ${borderColor} flex flex-col h-full min-h-[300px]`}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
        {icon}
        <h3 className="font-orbitron font-bold text-white tracking-widest text-sm">{title}</h3>
        <span className="ml-auto text-xs font-mono text-gray-500">{list.length} ACTIVE</span>
      </div>
      
      <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-1">
        {list.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <p className="font-rajdhani text-sm">{emptyMsg}</p>
          </div>
        )}
        {list.map(task => (
            <div 
              key={task.id} 
              className="p-3 rounded-lg flex items-center gap-3 group bg-black/40 hover:bg-white/5 transition-all relative border border-white/5 hover:border-purple-500/30"
            >
              {/* Checkbox */}
              <button 
                onClick={() => onToggleTask(task.id)}
                className={`min-w-[20px] h-5 rounded border flex items-center justify-center transition-all duration-300 ${task.status === 'DONE' ? 'bg-purple-600 border-purple-600 shadow-[0_0_10px_#9333ea]' : 'border-gray-600 hover:border-purple-400'}`}
              >
                 {task.status === 'DONE' && <Check size={12} className="text-white" />}
              </button>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                {editingId === task.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                      className="bg-black/50 text-white w-full px-2 py-1 rounded border border-purple-500 outline-none font-rajdhani text-sm"
                    />
                    <button onClick={saveEditing} className="text-green-400"><Check size={16} /></button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p 
                      onClick={() => startEditing(task)}
                      className={`font-rajdhani text-sm cursor-text hover:text-purple-200 transition-colors truncate ${task.status === 'DONE' ? 'text-gray-600 line-through' : 'text-white'}`}
                    >
                      {task.title}
                    </p>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border self-start ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Delete (Hover) */}
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* INPUT AREA */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
         <div className="flex gap-2">
            <button 
              onClick={() => setSelectedFrequency('DAILY')}
              className={`px-4 py-2 rounded-lg font-bold text-xs font-orbitron transition-all border ${selectedFrequency === 'DAILY' ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-black/40 text-gray-500 border-gray-700'}`}
            >
              DAILY
            </button>
            <button 
              onClick={() => setSelectedFrequency('WEEKLY')}
              className={`px-4 py-2 rounded-lg font-bold text-xs font-orbitron transition-all border ${selectedFrequency === 'WEEKLY' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'bg-black/40 text-gray-500 border-gray-700'}`}
            >
              WEEKLY
            </button>
            <button 
              onClick={() => setSelectedFrequency('MONTHLY')}
              className={`px-4 py-2 rounded-lg font-bold text-xs font-orbitron transition-all border ${selectedFrequency === 'MONTHLY' ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'bg-black/40 text-gray-500 border-gray-700'}`}
            >
              MONTHLY
            </button>
         </div>
         
         <form onSubmit={handleAddTaskSubmit} className="flex-1 w-full relative">
            <input 
              type="text" 
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder={`Add ${selectedFrequency.toLowerCase()} directive... (use /gym, /work tags)`}
              className="w-full bg-black/40 border border-purple-500/30 text-white pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:border-purple-500 font-rajdhani text-lg"
            />
            <button type="submit" className="absolute right-2 top-3 text-purple-500 hover:text-white transition-colors">
              <Plus size={24} />
            </button>
         </form>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* TASK COLUMNS (Takes 3/4 space) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-y-auto pb-20 md:pb-0">
           {renderTaskList(dailyTasks, 'DAILY PROTOCOL', <Repeat size={16} className="text-green-400" />, 'border-green-500/20', 'No daily directives.')}
           {renderTaskList(weeklyTasks, 'WEEKLY OBJECTIVES', <Calendar size={16} className="text-yellow-400" />, 'border-yellow-500/20', 'No weekly goals set.')}
           {renderTaskList(monthlyTasks, 'MONTHLY VISION', <Flag size={16} className="text-purple-400" />, 'border-purple-500/20', 'No monthly vision.')}
        </div>

        {/* SIDEBAR UTILITIES (Timer & Info) */}
        <div className="space-y-6">
            {/* GAMIFIED POMODORO WIDGET */}
            <div className={`glass-panel p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${pomoState.isActive ? 'border-purple-500/50 shadow-[0_0_20px_rgba(139,0,255,0.2)]' : 'border-white/5'}`}>
              
              <div className="absolute top-4 w-full text-center">
                <span className={`text-xs font-mono tracking-[0.2em] animate-pulse ${pomoState.status === 'ENGAGED' ? 'text-green-400' : pomoState.status === 'PAUSED' ? 'text-yellow-400' : 'text-purple-900'}`}>
                  SYSTEM {pomoState.status}
                </span>
              </div>

              <div className="relative w-40 h-40 mt-4 flex items-center justify-center">
                 <svg className="absolute w-full h-full transform -rotate-90">
                   <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                   <circle 
                     cx="50%" cy="50%" r="70" 
                     stroke="currentColor" 
                     strokeWidth="4" 
                     fill="transparent" 
                     className={`${pomoState.isActive ? 'text-purple-500 drop-shadow-[0_0_10px_#A855F7]' : 'text-gray-600'}`}
                     strokeDasharray={440}
                     strokeDashoffset={440 - ((pomoState.initialTime - pomoState.timeLeft) / pomoState.initialTime) * 440}
                     strokeLinecap="round"
                     style={{ transition: 'stroke-dashoffset 1s linear' }}
                   />
                 </svg>
                 
                 {pomoState.status === 'COMPLETE' ? (
                    <div className="text-center animate-in zoom-in duration-300">
                       <Zap size={32} className="text-yellow-400 mx-auto mb-2 animate-bounce" />
                       <span className="block text-xl font-bold font-orbitron text-white">DONE</span>
                       <span className="block text-xs text-green-400">+{MODES[pomoState.mode].xp} XP</span>
                    </div>
                 ) : (
                    <span className="text-3xl font-orbitron font-bold text-white tracking-widest relative z-10 tabular-nums">
                      {formatTime(pomoState.timeLeft)}
                    </span>
                 )}
              </div>
              
              {pomoState.status === 'COMPLETE' ? (
                 <button onClick={() => onPomoControl('RESET')} className="mt-8 px-6 py-2 bg-purple-600 text-white rounded font-rajdhani font-bold hover:bg-purple-500 transition-colors">
                   ACKNOWLEDGE
                 </button>
              ) : (
                <>
                  <div className="flex gap-1 mt-6 mb-6 w-full px-1">
                    {(Object.keys(MODES) as FocusMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => onPomoControl('MODE', m)}
                        className={`flex-1 py-1 rounded text-[9px] font-bold transition-all border ${pomoState.mode === m ? 'bg-purple-500/20 text-purple-300 border-purple-500' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                      >
                        {MODES[m].label.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 z-10">
                    <button 
                      onClick={() => {
                        if (pomoState.isActive) {
                           onPomoControl('PAUSE');
                        } else {
                           onPomoControl('START');
                        }
                      }}
                      className={`p-3 rounded-full transition-all shadow-lg ${pomoState.isActive ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40' : 'bg-white text-black hover:bg-purple-400 hover:text-white'}`}
                    >
                      {pomoState.isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <button 
                      onClick={() => onPomoControl('RESET')}
                      className="p-3 rounded-full bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/10"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Info */}
            <div className="glass-panel p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-wider">Protocol Expiry</p>
                <div className="space-y-2 text-xs font-rajdhani text-gray-400">
                   <div className="flex justify-between"><span>DAILY</span> <span className="text-red-400">24 Hours</span></div>
                   <div className="flex justify-between"><span>WEEKLY</span> <span className="text-yellow-400">7 Days</span></div>
                   <div className="flex justify-between"><span>MONTHLY</span> <span className="text-purple-400">30 Days</span></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;

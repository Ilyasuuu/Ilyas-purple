
import React, { useState } from 'react';
import { Task, PomoState, FocusMode } from '../types';
import { Play, Pause, RotateCcw, Plus, Trash2, Edit3, Check, Zap } from 'lucide-react';

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

  // SVG Logic
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((pomoState.initialTime - pomoState.timeLeft) / pomoState.initialTime) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Task Master List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Controls */}
        <div className="glass-panel p-4 rounded-xl">
          <form onSubmit={handleAddTaskSubmit} className="flex w-full relative">
            <input 
              type="text" 
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Enter directive... (Use /gym, /work, /school, /personal to tag)" 
              className="w-full bg-black/40 border border-purple-500/30 text-white pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:border-purple-500 font-rajdhani text-lg"
            />
            <button type="submit" className="absolute right-2 top-3 text-purple-500 hover:text-white transition-colors">
              <Plus size={24} />
            </button>
          </form>
        </div>

        {/* Vertical Master List */}
        <div className="space-y-3 min-h-[400px]">
          {tasks.length === 0 && (
             <div className="text-center py-20 opacity-50">
               <div className="text-4xl mb-4">📜</div>
               <p className="font-rajdhani text-xl">Protocol Empty.</p>
               <p className="text-sm">Initiate new tasks to begin.</p>
             </div>
          )}
          
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="glass-panel p-4 rounded-xl flex items-center gap-4 group hover:bg-white/5 transition-all relative border-transparent hover:border-purple-500/30"
            >
              {/* Checkbox */}
              <button 
                onClick={() => onToggleTask(task.id)}
                className={`min-w-[24px] h-6 rounded border flex items-center justify-center transition-all duration-300 ${task.status === 'DONE' ? 'bg-purple-600 border-purple-600 shadow-[0_0_10px_#9333ea]' : 'border-gray-600 hover:border-purple-400'}`}
              >
                 {task.status === 'DONE' && <Check size={14} className="text-white" />}
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
                      className="bg-black/50 text-white w-full px-2 py-1 rounded border border-purple-500 outline-none font-rajdhani text-lg"
                    />
                    <button onClick={saveEditing} className="text-green-400"><Check size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p 
                      onClick={() => startEditing(task)}
                      className={`font-rajdhani text-lg cursor-text hover:text-purple-200 transition-colors truncate ${task.status === 'DONE' ? 'text-gray-600 line-through' : 'text-white'}`}
                    >
                      {task.title}
                    </p>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions (Visible on Hover) */}
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEditing(task)}
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Utilities */}
      <div className="space-y-6">
        {/* GAMIFIED POMODORO WIDGET */}
        <div className={`glass-panel p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${pomoState.isActive ? 'border-purple-500/50 shadow-[0_0_20px_rgba(139,0,255,0.2)]' : 'border-white/5'}`}>
          
          {/* Status Indicator */}
          <div className="absolute top-4 w-full text-center">
            <span className={`text-xs font-mono tracking-[0.2em] animate-pulse ${pomoState.status === 'ENGAGED' ? 'text-green-400' : pomoState.status === 'PAUSED' ? 'text-yellow-400' : 'text-purple-900'}`}>
              SYSTEM {pomoState.status}
            </span>
          </div>

          {/* Progress Ring & Timer */}
          <div className="relative w-48 h-48 mt-4 flex items-center justify-center">
             <svg className="absolute w-full h-full transform -rotate-90">
               <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
               <circle 
                 cx="50%" cy="50%" r={radius} 
                 stroke="currentColor" 
                 strokeWidth="4" 
                 fill="transparent" 
                 className={`${pomoState.isActive ? 'text-purple-500 drop-shadow-[0_0_10px_#A855F7]' : 'text-gray-600'}`}
                 strokeDasharray={circumference}
                 strokeDashoffset={isNaN(strokeDashoffset) ? 0 : strokeDashoffset}
                 strokeLinecap="round"
                 style={{ transition: 'stroke-dashoffset 1s linear' }}
               />
             </svg>
             
             {pomoState.status === 'COMPLETE' ? (
                <div className="text-center animate-in zoom-in duration-300">
                   <Zap size={48} className="text-yellow-400 mx-auto mb-2 animate-bounce" />
                   <span className="block text-2xl font-bold font-orbitron text-white">COMPLETE</span>
                   <span className="block text-sm text-green-400">+{MODES[pomoState.mode].xp} XP</span>
                </div>
             ) : (
                <span className="text-5xl font-orbitron font-bold text-white tracking-widest relative z-10 tabular-nums">
                  {formatTime(pomoState.timeLeft)}
                </span>
             )}
          </div>
          
          {/* Controls */}
          {pomoState.status === 'COMPLETE' ? (
             <button onClick={() => onPomoControl('RESET')} className="mt-8 px-6 py-2 bg-purple-600 text-white rounded font-rajdhani font-bold hover:bg-purple-500 transition-colors">
               ACKNOWLEDGE
             </button>
          ) : (
            <>
              {/* Preset Selector */}
              <div className="flex gap-2 mt-6 mb-6 w-full px-2">
                {(Object.keys(MODES) as FocusMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => onPomoControl('MODE', m)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-all border ${pomoState.mode === m ? 'bg-purple-500/20 text-purple-300 border-purple-500' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                  >
                    {MODES[m].label}
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
                  className={`p-4 rounded-full transition-all shadow-lg ${pomoState.isActive ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40' : 'bg-white text-black hover:bg-purple-400 hover:text-white'}`}
                >
                  {pomoState.isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                </button>
                <button 
                  onClick={() => onPomoControl('RESET')}
                  className="p-4 rounded-full bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-all border border-white/10"
                >
                  <RotateCcw />
                </button>
              </div>
            </>
          )}

          <div className="mt-4 text-[10px] text-gray-500 font-mono">
            REWARD: <span className="text-yellow-500">+{MODES[pomoState.mode].xp} XP</span>
          </div>
        </div>
        
        {/* Quick Commands Info */}
        <div className="glass-panel p-4 rounded-xl border border-white/5">
            <p className="text-xs text-gray-400 font-mono mb-3 uppercase tracking-wider">Console Commands</p>
            <div className="space-y-2 text-sm font-rajdhani text-gray-300">
               <div className="flex justify-between border-b border-white/5 pb-1"><span>/school</span> <span className="text-yellow-400">Study</span></div>
               <div className="flex justify-between border-b border-white/5 pb-1"><span>/gym</span> <span className="text-red-400">Training</span></div>
               <div className="flex justify-between border-b border-white/5 pb-1"><span>/work</span> <span className="text-blue-400">Career</span></div>
               <div className="flex justify-between border-b border-white/5 pb-1"><span>/personal</span> <span className="text-green-400">Life</span></div>
               <div className="text-xs text-gray-500 italic mt-2">Type these at the end of your task input to auto-tag.</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;


import React, { useState, useRef, useEffect } from 'react';
import { Note, Mood } from '../types';
import { Search, Plus, Trash2, Eye, EyeOff, Save, Type, Bold, Italic, Underline, List, ListOrdered, Lock, Image as ImageIcon } from 'lucide-react';

interface JournalProps {
  logs: Note[];
  onUpdateLog: (log: Note) => void;
  onDeleteLog: (id: string) => void;
}

const MOODS: Record<Mood, { color: string, label: string }> = {
  FLOW: { color: 'green', label: 'FLOW' },
  ZEN: { color: 'blue', label: 'ZEN' },
  CHAOS: { color: 'red', label: 'CHAOS' },
  IDEA: { color: 'purple', label: 'IDEA' }
};

const Journal: React.FC<JournalProps> = ({ logs, onUpdateLog, onDeleteLog }) => {
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create New Log
  const handleNewLog = () => {
    const newLog: Note = {
      id: Date.now().toString(),
      title: 'New Neural Entry',
      content: '',
      date: new Date().toISOString(),
      mood: 'ZEN',
      isEncrypted: false
    };
    onUpdateLog(newLog);
    setActiveLogId(newLog.id);
  };

  const activeLog = logs.find(l => l.id === activeLogId);

  // Sync Editor Content when Active Log Changes
  useEffect(() => {
    if (editorRef.current && activeLog) {
      if (editorRef.current.innerHTML !== activeLog.content) {
         editorRef.current.innerHTML = activeLog.content;
      }
    }
  }, [activeLogId]);

  // Handle Text Change
  const handleContentChange = () => {
    if (activeLog && editorRef.current) {
      onUpdateLog({
        ...activeLog,
        content: editorRef.current.innerHTML
      });
    }
  };

  // Formatting Commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  // --- IMAGE HANDLING START ---

  const insertImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = e.target?.result as string;
      // Insert image at caret position
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertImage', false, imgData);
        handleContentChange(); // Save state
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      insertImage(files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      insertImage(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Check for image data in clipboard
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) insertImage(file);
        return;
      }
    }
  };

  // --- IMAGE HANDLING END ---

  const getMoodColor = (mood: Mood) => {
    switch(mood) {
      case 'FLOW': return 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
      case 'ZEN': return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
      case 'CHAOS': return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      case 'IDEA': return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      default: return 'border-white/10';
    }
  };

  const filteredLogs = logs
    .filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[80vh]">
      
      {/* LEFT PANEL: ARCHIVE LIST */}
      <div className="md:w-80 flex flex-col glass-panel rounded-2xl overflow-hidden border border-white/10">
        
        {/* Header / Search */}
        <div className="p-4 bg-black/40 border-b border-white/10 space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="font-orbitron text-white text-lg tracking-wide">NEURAL ARCHIVE</h2>
             <button 
               onClick={handleNewLog}
               className="p-2 bg-purple-600 hover:bg-purple-500 rounded text-white transition-colors"
               title="New Entry"
             >
               <Plus size={18} />
             </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
          {filteredLogs.map(log => {
            const moodStyle = MOODS[log.mood] || MOODS.ZEN;
            return (
              <div 
                key={log.id} 
                onClick={() => setActiveLogId(log.id)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all border flex flex-col gap-1 group relative
                  ${activeLogId === log.id 
                    ? 'bg-purple-900/20 border-purple-500/50' 
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}
                `}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-rajdhani font-bold truncate ${activeLogId === log.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {log.title || 'Untitled Log'}
                  </h3>
                  {log.isEncrypted && <Lock size={12} className="text-gray-600" />}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                  <div className={`w-1.5 h-1.5 rounded-full bg-${moodStyle.color}-500`} />
                  <span>{new Date(log.date).toLocaleDateString()}</span>
                  <span className="uppercase opacity-50 ml-auto">{log.mood}</span>
                </div>
                
                {/* Quick Delete (Hover) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteLog(log.id); }}
                  className="absolute right-2 top-8 p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          
          {filteredLogs.length === 0 && (
             <div className="text-center py-10 text-gray-600 font-mono text-xs">
               NO DATA FOUND
             </div>
          )}
        </div>
      </div>


      {/* RIGHT PANEL: EDITOR */}
      <div className={`flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden border transition-all duration-500 relative ${activeLog ? getMoodColor(activeLog.mood) : 'border-white/10'}`}>
        
        {activeLog ? (
          <>
            {/* Control Ribbon */}
            <div className="flex-none p-2 bg-black/60 border-b border-white/10 flex flex-wrap items-center gap-2 z-10">
               
               {/* Mood Badges */}
               <div className="flex gap-1 mr-4 border-r border-white/10 pr-4">
                  {(Object.keys(MOODS) as Mood[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdateLog({ ...activeLog, mood: m })}
                      className={`
                        text-[9px] px-2 py-1 rounded font-bold transition-all
                        ${activeLog.mood === m 
                          ? `bg-${MOODS[m].color}-500/20 text-${MOODS[m].color}-400 border border-${MOODS[m].color}-500/50` 
                          : 'text-gray-600 hover:text-gray-300'}
                      `}
                    >
                      {m}
                    </button>
                  ))}
               </div>

               {/* Formatting Tools */}
               <div className="flex gap-1 items-center mr-auto">
                  <button onClick={() => execCmd('formatBlock', 'H1')} className="p-1.5 hover:bg-white/10 rounded text-purple-400 font-bold" title="H1"><Type size={16} /></button>
                  <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Bold"><Bold size={16} /></button>
                  <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Italic"><Italic size={16} /></button>
                  <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Underline"><Underline size={16} /></button>
                  <div className="w-px h-4 bg-gray-700 mx-1" />
                  <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><List size={16} /></button>
                  <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ListOrdered size={16} /></button>
                  <div className="w-px h-4 bg-gray-700 mx-1" />
                  {/* Image Upload Button */}
                  <button 
                    onClick={handleImageUploadClick} 
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" 
                    title="Insert Image"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileInputChange}
                  />
               </div>

               {/* Secure Toggle */}
               <button 
                 onClick={() => onUpdateLog({ ...activeLog, isEncrypted: !activeLog.isEncrypted })}
                 className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded border transition-colors ${activeLog.isEncrypted ? 'bg-green-500/10 border-green-500 text-green-400' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
               >
                 {activeLog.isEncrypted ? <EyeOff size={14} /> : <Eye size={14} />}
                 {activeLog.isEncrypted ? 'SECURE' : 'PUBLIC'}
               </button>
            </div>

            {/* Title Input */}
            <div className="p-6 pb-2">
              <input 
                type="text" 
                value={activeLog.title}
                onChange={(e) => onUpdateLog({ ...activeLog, title: e.target.value })}
                className="w-full bg-transparent text-3xl font-orbitron font-bold text-white placeholder-gray-700 outline-none"
                placeholder="ENTRY TITLE..."
              />
              <div className="text-xs font-mono text-gray-500 mt-2 flex items-center gap-2">
                 <span>{new Date(activeLog.date).toLocaleString()}</span>
                 <span>//</span>
                 <span className={`text-${(MOODS[activeLog.mood] || MOODS.ZEN).color}-400`}>MENTAL STATE: {activeLog.mood}</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
               <div 
                 ref={editorRef}
                 contentEditable
                 onInput={handleContentChange}
                 onDrop={handleDrop}
                 onDragOver={handleDragOver}
                 onPaste={handlePaste}
                 className={`
                   w-full h-full p-6 pt-2 outline-none font-mono text-gray-300 text-sm overflow-y-auto custom-scrollbar
                   [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                   [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-purple-400 [&_h1]:mb-2 [&_h1]:mt-4
                   [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-cyan-400 [&_h2]:mb-2 [&_h2]:mt-3
                   [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:border [&_img]:border-white/10
                   ${activeLog.isEncrypted ? 'blur-sm grayscale transition-all duration-500 hover:blur-0 hover:grayscale-0' : ''}
                 `}
                 style={{ whiteSpace: 'pre-wrap' }}
               />
               
               {/* Placeholder */}
               {!activeLog.content && (
                  <div className="absolute top-2 left-6 pointer-events-none text-gray-700 font-mono italic text-sm">
                    Initializing neural link... Awaiting input...
                  </div>
               )}
            </div>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
             <div className="w-20 h-20 border-2 border-gray-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <div className="w-16 h-16 border border-gray-700 rounded-full" />
             </div>
             <p className="font-orbitron tracking-widest">SELECT DATA STREAM</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Journal;

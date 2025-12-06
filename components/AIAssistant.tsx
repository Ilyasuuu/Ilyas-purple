
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Cpu, Database, Terminal, Zap, Mic, Paperclip, Plus, MessageSquare, Image as ImageIcon, Trash2, FileText, Music, Video, File } from 'lucide-react';
import { sendMessageToUnit01, transcribeAudio } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  onClose: () => void;
  user: any;
  onRefreshData: () => void; // New prop for executing actions
}

interface SessionGroup {
  id: string;
  date: string;
  preview: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, user, onRefreshData }) => {
  // Session State
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Input Features
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EXECUTOR ENGINE (ACTIVE AGENT) ---
  const executeAIAction = async (command: any) => {
    if (!command || !command.action) return;
    
    console.log("EXECUTING AI ACTION:", command);
    const { action, payload } = command;

    try {
      if (action === 'CREATE_TASK') {
        await supabase.from('tasks').insert({
          user_id: user.id,
          title: payload.title,
          category: payload.category || 'SYSTEM',
          status: payload.status || 'TODO',
          due_date: payload.due_date || 'Today'
        });
      } else if (action === 'DELETE_TASK') {
        // Simple text match delete for now
        await supabase.from('tasks').delete().ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'ADD_SCHEDULE') {
        await supabase.from('schedule_blocks').insert({
          user_id: user.id,
          title: payload.title,
          start_time: payload.start_time,
          type: payload.type || 'WORK',
          date: payload.date || new Date().toISOString().split('T')[0]
        });
      } else if (action === 'DELETE_SCHEDULE') {
        // 1. Find the block first to get ID
        const { data: blocks } = await supabase.from('schedule_blocks')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', payload.date)
          .ilike('title', `%${payload.title_keyword}%`)
          .limit(1);
        
        if (blocks && blocks.length > 0) {
           await supabase.from('schedule_blocks').delete().eq('id', blocks[0].id);
        }
      } else if (action === 'RESCHEDULE') {
        // 1. Find the block
        const { data: blocks } = await supabase.from('schedule_blocks')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', payload.current_date)
          .ilike('title', `%${payload.title_keyword}%`)
          .limit(1);
        
        if (blocks && blocks.length > 0) {
           // 2. Update it
           await supabase.from('schedule_blocks')
             .update({
               date: payload.new_date,
               start_time: payload.new_start_time
             })
             .eq('id', blocks[0].id);
        }
      } else if (action === 'LOG_NOTE') {
        await supabase.from('neural_logs').insert({
          user_id: user.id,
          title: payload.title,
          content: payload.content,
          mood: payload.mood || 'ZEN',
          is_encrypted: false
        });
      }
      
      // Refresh UI immediately
      onRefreshData();
      
    } catch (err) {
      console.error("AI Action Failed:", err);
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!user) return;
    
    const loadSessions = async () => {
      const { data } = await supabase.from('chat_history').select('session_id, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) {
        const uniqueSessions = new Map();
        data.forEach(msg => {
          if (msg.session_id && !uniqueSessions.has(msg.session_id)) {
            uniqueSessions.set(msg.session_id, {
              id: msg.session_id, date: new Date(msg.created_at).toLocaleDateString(), preview: msg.content.substring(0, 30) + '...'
            });
          }
        });
        const sessionList = Array.from(uniqueSessions.values());
        setSessions(sessionList);
        if (sessionList.length > 0 && !currentSessionId) setCurrentSessionId(sessionList[0].id);
        else if (!currentSessionId) handleNewSession();
      } else {
        handleNewSession();
      }
    };
    loadSessions();
  }, [user]);

  // --- LOAD CHAT ---
  useEffect(() => {
    if (!user || !currentSessionId) return;
    const fetchChat = async () => {
      const { data } = await supabase.from('chat_history').select('*').eq('user_id', user.id).eq('session_id', currentSessionId).order('created_at', { ascending: true });
      if (data) setMessages(data as ChatMessage[]); else setMessages([]);
    };
    fetchChat();
  }, [currentSessionId, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleNewSession = () => {
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    setMessages([]);
    setSessions(prev => [{ id: newId, date: 'Today', preview: 'New Neural Link' }, ...prev]);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI Update
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) handleNewSession();
    
    // DB Delete
    await supabase.from('chat_history').delete().eq('session_id', sessionId);
  };

  // --- INPUT HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isMedia = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type === 'application/pdf';
    if (isMedia) {
      const reader = new FileReader(); reader.onloadend = () => { setAttachment(reader.result as string); setAttachmentName(file.name); }; reader.readAsDataURL(file);
    } else {
      const reader = new FileReader(); reader.onload = (e) => { const content = e.target?.result as string; setInput(prev => `${prev}${prev ? '\n\n' : ''}[FILE: ${file.name}]\n${content}\n[END FILE]`); }; reader.readAsText(file);
    }
    e.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { mediaRecorderRef.current.stop(); setIsRecording(false); } return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader(); reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Audio = base64String.includes(',') ? base64String.split(',')[1] : base64String;
          setLoading(true);
          const text = await transcribeAudio(base64Audio);
          if (text) setInput(prev => (prev ? prev + " " + text : text));
          setLoading(false);
          stream.getTracks().forEach(track => track.stop());
        };
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone Error:", err); 
      if (err.name === 'NotAllowedError') alert("Microphone access denied. Please enable permissions.");
      else alert("Microphone error: " + err.message);
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !user || loading) return; // Added strict loading guard
    const userMsg = input; const currentAttachment = attachment;
    setInput(''); setAttachment(null); setAttachmentName(null);
    
    // Optimistic UI
    const tempMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMsg, created_at: new Date().toISOString(), session_id: currentSessionId, attachment: currentAttachment || undefined };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);

    // AI Request
    let responseText = await sendMessageToUnit01(user.id, userMsg, currentSessionId, currentAttachment || undefined);

    // --- PARSE & EXECUTE ACTIONS ---
    // Regex to find JSON block: ```json { ... } ```
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const command = JSON.parse(jsonMatch[1]);
            await executeAIAction(command);
            
            // Clean response: Remove the JSON block so user doesn't see raw code
            responseText = responseText.replace(jsonMatch[0], '').trim();
            
            // If response is empty after cleaning (AI only sent JSON), add confirmation
            if (!responseText) responseText = "Action executed successfully.";
            
            // Update the last assistant message in DB (inserted by sendMessageToUnit01) to remove JSON clutter
            await supabase.from('chat_history').update({ content: responseText }).eq('session_id', currentSessionId).order('created_at', { ascending: false }).limit(1);

        } catch (e) {
            console.error("Failed to parse/execute AI command", e);
        }
    }

    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, created_at: new Date().toISOString(), session_id: currentSessionId };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, preview: userMsg.substring(0, 30) + '...' } : s));
  };

  const renderAttachmentPreview = (dataUri: string) => {
    const mimeType = dataUri.split(';')[0].split(':')[1];
    if (mimeType.startsWith('image/')) return <img src={dataUri} alt="Attachment" className="max-w-[200px] rounded-lg border border-white/20 mb-2" />;
    let Icon = File; if (mimeType.startsWith('audio/')) Icon = Music; if (mimeType.startsWith('video/')) Icon = Video; if (mimeType === 'application/pdf') Icon = FileText;
    return <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10 mb-2 max-w-[200px]"><Icon size={20} className="text-purple-400" /><span className="text-xs font-mono text-gray-300 truncate">File Attached</span></div>;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[90vh] flex rounded-3xl overflow-hidden border border-purple-500/20 shadow-[0_0_100px_rgba(139,0,255,0.1)] bg-[#050505] relative">
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,6px_100%]" />
        
        {/* SIDEBAR */}
        <div className="w-72 hidden md:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl relative z-20">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative"><div className="w-2 h-2 bg-purple-500 rounded-full absolute -right-0.5 -bottom-0.5 animate-pulse shadow-[0_0_10px_#a855f7]" /><Cpu className="text-purple-300" size={20} /></div>
              <h2 className="font-orbitron font-bold text-white tracking-widest text-lg">PURPLE</h2>
            </div>
            <button onClick={handleNewSession} className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 text-purple-200 rounded-xl transition-all font-mono text-xs font-bold tracking-wider"><Plus size={14} /> NEW SESSION</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest px-2 mb-2">Memory Banks</p>
            {sessions.map(session => (
              <button key={session.id} onClick={() => setCurrentSessionId(session.id)} className={`w-full text-left p-3 rounded-lg border transition-all group relative ${currentSessionId === session.id ? 'bg-purple-900/20 border-purple-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'}`}>
                <div className="flex justify-between items-center mb-1"><span className="font-mono text-[10px] opacity-70">{session.date}</span>{currentSessionId === session.id && <Zap size={10} className="text-purple-400 fill-current" />}</div>
                <div className="font-rajdhani text-sm truncate opacity-90 group-hover:opacity-100 pr-6">{session.preview || "Empty Session"}</div>
                <div onClick={(e) => handleDeleteSession(session.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 size={14} /></div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/5"><div className="flex items-center gap-2 text-[10px] font-mono text-gray-500"><Database size={12} /><span>TOTAL RECALL ACTIVE</span></div></div>
        </div>

        {/* MAIN CHAT */}
        <div className="flex-1 flex flex-col relative bg-[#080808]">
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30 pointer-events-none">
             <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-[10px] font-mono text-purple-300 shadow-xl flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />CONNECTED // {currentSessionId.split('-')[0]}...</div>
             <button onClick={onClose} className="pointer-events-auto p-2 bg-black/50 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-full text-gray-400 hover:text-red-400 transition-colors"><X size={20} /></button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0"><div className="w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" /></div>
          
          <div className="flex-1 overflow-y-auto p-6 pt-24 pb-32 space-y-8 relative z-10 custom-scrollbar scroll-smooth">
             {messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center mb-6 relative"><div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping" /><Cpu size={40} className="text-purple-500" /></div>
                  <h3 className="font-orbitron text-2xl text-white mb-2 tracking-widest">PURPLE<span className="text-purple-500">_OS</span></h3>
                  <p className="font-mono text-xs text-gray-400 max-w-md leading-relaxed">Neural Link Established. I have full access to your stats, tasks, and past conversations.<br/>How can I assist you today, Ilyasuu?</p>
               </div>
             )}
             {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.attachment && renderAttachmentPreview(msg.attachment)}
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed relative backdrop-blur-md ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none shadow-[0_5px_15px_rgba(147,51,234,0.3)]' : 'bg-white/5 border border-white/10 text-gray-200 font-mono rounded-bl-none'}`}>{msg.content}</div>
                    <span className="text-[9px] font-mono text-gray-600 opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
               </div>
             ))}
             {loading && <div className="flex justify-start"><div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" /><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" /></div></div>}
             <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-30">
             <div className="max-w-4xl mx-auto">
                {attachment && <div className="mb-2 relative inline-flex items-center gap-2 bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-500/50"><FileText size={14} className="text-purple-300" /><span className="text-xs font-mono text-purple-200 truncate max-w-[150px]">{attachmentName}</span><button onClick={() => { setAttachment(null); setAttachmentName(null); }} className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-0.5 ml-2 transition-colors"><X size={12} /></button></div>}
                <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 group focus-within:ring-purple-500/50 transition-all">
                   <input type="file" ref={fileInputRef} accept="*" className="hidden" onChange={handleFileSelect} />
                   <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-colors"><Paperclip size={20} /></button>
                   <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={isRecording ? "Listening..." : "Type directive or speak..."} className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-600 max-h-32 py-3 resize-none custom-scrollbar" rows={1} />
                   <button onClick={toggleRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'text-red-500 bg-red-900/20 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Mic size={20} /></button>
                   <button onClick={handleSend} disabled={(!input.trim() && !attachment) || loading} className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-800"><Send size={20} /></button>
                </div>
                <div className="text-center mt-2"><p className="text-[9px] text-gray-600 font-mono">PURPLE NEURAL LINK v2.0 // TOTAL RECALL + ACTIVE AGENT ENABLED</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

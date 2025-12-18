
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Cpu, Database, Plus, Mic, Paperclip, Trash2, FileText, Music, Video, File, Zap, Wifi } from 'lucide-react';
import { sendMessageToUnit01 } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  onClose: () => void;
  user: any;
  onRefreshData: () => void;
}

interface SessionGroup {
  id: string;
  date: string;
  preview: string;
}

// --- MARKDOWN RENDERER COMPONENT ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const sections = content.split(/```/g);
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="text-purple-300 font-bold">{part.slice(2, -2)}</strong>;
      const codeParts = part.split(/(`.*?`)/g);
      return codeParts.map((subPart, subIndex) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) return <code key={`${index}-${subIndex}`} className="bg-white/10 text-purple-200 px-1.5 py-0.5 rounded text-xs font-mono">{subPart.slice(1, -1)}</code>;
        return subPart;
      });
    });
  };

  const formatTextSection = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-purple-300 mt-4 mb-2 font-orbitron">{parseInline(trimmed.replace('### ', ''))}</h3>;
      if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-purple-500/30 pb-1 font-orbitron">{parseInline(trimmed.replace('## ', ''))}</h2>;
      if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-6 mb-4 font-orbitron">{parseInline(trimmed.replace('# ', ''))}</h1>;
      if (trimmed.startsWith('- ')) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><div className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" /><p className="text-gray-300 leading-relaxed">{parseInline(trimmed.replace('- ', ''))}</p></div>;
      if (trimmed.match(/^\d+\. /)) return <div key={i} className="flex items-start gap-2 mb-1 pl-2"><span className="text-purple-400 font-mono font-bold text-xs mt-1">{trimmed.split('.')[0]}.</span><p className="text-gray-300 leading-relaxed">{parseInline(trimmed.replace(/^\d+\. /, ''))}</p></div>;
      if (trimmed.startsWith('> ')) return <div key={i} className="border-l-2 border-purple-500 pl-4 py-1 my-2 bg-purple-900/10 italic text-gray-400">{parseInline(trimmed.replace('> ', ''))}</div>;
      return <p key={i} className="mb-2 text-gray-200 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  return <div className="space-y-1">{sections.map((section, index) => index % 2 === 1 ? <div key={index} className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-lg"><div className="bg-white/5 px-3 py-1 text-[10px] font-mono text-gray-500 uppercase flex justify-between"><span>CODE</span><span>RAW</span></div><div className="p-4 overflow-x-auto"><pre className="font-mono text-xs text-green-400 whitespace-pre-wrap">{section.trim()}</pre></div></div> : <div key={index}>{formatTextSection(section)}</div>)}</div>;
};

// --- MAIN COMPONENT ---
const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, user, onRefreshData }) => {
  const isMounted = useRef(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const executeAIAction = async (command: any) => {
    if (!command || !command.action) return;
    const { action, payload } = command;

    try {
      if (action === 'CREATE_TASK') {
        await supabase.from('tasks').insert({ user_id: user.id, title: payload.title, category: payload.category || 'SYSTEM', status: payload.status || 'TODO', due_date: payload.due_date || 'Today' });
      } else if (action === 'UPDATE_TASK') {
        await supabase.from('tasks').update({ status: payload.status, category: payload.category }).ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'DELETE_TASK') {
        await supabase.from('tasks').delete().ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'ADD_SCHEDULE') {
        await supabase.from('schedule_blocks').insert({ user_id: user.id, title: payload.title, start_time: payload.start_time, type: payload.type || 'WORK', date: payload.date || new Date().toISOString().split('T')[0] });
      } else if (action === 'RESCHEDULE') {
        await supabase.from('schedule_blocks').update({ date: payload.new_date || payload.date, start_time: payload.new_start_time }).ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'DELETE_SCHEDULE') {
        await supabase.from('schedule_blocks').delete().eq('user_id', user.id).eq('date', payload.date).ilike('title', `%${payload.title_keyword}%`);
      } else if (action === 'LOG_NOTE') {
        await supabase.from('neural_logs').insert({ user_id: user.id, title: payload.title, content: payload.content, mood: payload.mood || 'ZEN', is_encrypted: false });
      } else if (action === 'DELETE_NOTE') {
        await supabase.from('neural_logs').delete().eq('user_id', user.id).ilike('title', `%${payload.title_keyword}%`);
      }
      onRefreshData();
    } catch (err) {
      console.error("AI Action Failed:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadSessions = async () => {
      const { data } = await supabase.from('chat_history').select('session_id, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data && isMounted.current) {
        const uniqueSessions = new Map();
        data.forEach(msg => {
          if (msg.session_id && !uniqueSessions.has(msg.session_id)) {
            uniqueSessions.set(msg.session_id, { id: msg.session_id, date: new Date(msg.created_at).toLocaleDateString(), preview: msg.content.substring(0, 30) + '...' });
          }
        });
        const sessionList = Array.from(uniqueSessions.values());
        setSessions(sessionList);
        if (sessionList.length > 0 && !currentSessionId) setCurrentSessionId(sessionList[0].id);
        else if (!currentSessionId) handleNewSession();
      } else handleNewSession();
    };
    loadSessions();
  }, [user]);

  useEffect(() => {
    if (!user || !currentSessionId) return;
    let channel: any;
    const initChat = async () => {
      const { data } = await supabase.from('chat_history').select('*').eq('user_id', user.id).eq('session_id', currentSessionId).order('created_at', { ascending: true });
      if (data && isMounted.current) setMessages(data);
      channel = supabase.channel(`session-${currentSessionId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history', filter: `session_id=eq.${currentSessionId}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).subscribe((status) => { if (status === 'SUBSCRIBED') setIsRealtime(true); });
    };
    initChat();
    return () => { if (channel) supabase.removeChannel(channel); setIsRealtime(false); };
  }, [currentSessionId, user]);

  const handleNewSession = () => {
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    setMessages([]);
    setSessions(prev => [{ id: newId, date: 'Today', preview: 'New Neural Link' }, ...prev]);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) handleNewSession();
    await supabase.from('chat_history').delete().eq('session_id', sessionId);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !user || loading) return;
    const userMsg = input; const currentAttachment = attachment;
    setInput(''); setAttachment(null); setAttachmentName(null); setLoading(true);
    
    let responseText = await sendMessageToUnit01(user.id, userMsg, currentSessionId, currentAttachment || undefined);
    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const command = JSON.parse(jsonMatch[1]);
            await executeAIAction(command);
            responseText = responseText.replace(jsonMatch[0], '').trim() || "Action processed.";
        } catch (e) { console.error("AI Command Error", e); }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[90vh] flex rounded-3xl overflow-hidden border border-purple-500/20 shadow-[0_0_100px_rgba(139,0,255,0.1)] bg-[#050505] relative">
        <div className="w-72 hidden md:flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl relative z-20">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative"><div className="w-2 h-2 bg-purple-500 rounded-full absolute -right-0.5 -bottom-0.5 animate-pulse" /><Cpu className="text-purple-300" size={20} /></div>
              <h2 className="font-orbitron font-bold text-white tracking-widest text-lg">PURPLE</h2>
            </div>
            <button onClick={handleNewSession} className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 text-purple-200 rounded-xl transition-all font-mono text-xs font-bold tracking-wider"><Plus size={14} /> NEW SESSION</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {sessions.map(session => (
              <button key={session.id} onClick={() => setCurrentSessionId(session.id)} className={`w-full text-left p-3 rounded-lg border transition-all group relative ${currentSessionId === session.id ? 'bg-purple-900/20 border-purple-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'}`}>
                <div className="flex justify-between items-center mb-1"><span className="font-mono text-[10px] opacity-70">{session.date}</span></div>
                <div className="font-rajdhani text-sm truncate opacity-90 pr-6">{session.preview || "Empty Session"}</div>
                <div onClick={(e) => handleDeleteSession(session.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col relative bg-[#080808]">
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30">
             <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-[10px] font-mono text-purple-300 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isRealtime ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                {isRealtime ? `NEURAL SYNC // ${currentSessionId.split('-')[0]}` : 'CONNECTING...'}
             </div>
             <button onClick={onClose} className="p-2 bg-black/50 hover:bg-red-500/20 border border-white/10 rounded-full text-gray-400 hover:text-red-400 transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 pt-24 pb-32 space-y-8 relative z-10 custom-scrollbar scroll-smooth">
             {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-6 rounded-2xl relative backdrop-blur-md shadow-lg ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-[#0f0f15]/80 border border-white/10 rounded-bl-none'}`}>
                        {msg.role === 'user' ? <p className="whitespace-pre-wrap font-sans text-sm">{msg.content}</p> : <div className="prose prose-invert max-w-none text-sm font-sans"><MarkdownRenderer content={msg.content} /></div>}
                    </div>
                  </div>
               </div>
             ))}
             {loading && <div className="flex justify-start"><div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" /></div></div>}
             <div ref={messagesEndRef} />
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 z-30">
             <div className="max-w-4xl mx-auto">
                <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:ring-purple-500/50 transition-all">
                   <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-purple-400"><Paperclip size={20} /></button>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {}} />
                   <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type directive..." className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-600 py-3 resize-none" rows={1} />
                   <button onClick={handleSend} disabled={!input.trim() || loading} className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50"><Send size={20} /></button>
                </div>
                <div className="text-center mt-2 flex items-center justify-center gap-2"><Wifi size={10} className={`${isRealtime ? 'text-green-500' : 'text-gray-600'}`} /><p className="text-[9px] text-gray-600 font-mono">PURPLE CRUD CORE v3.0 // TOTAL RECALL ACTIVE</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

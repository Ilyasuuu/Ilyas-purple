
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Cpu, Wifi, Zap } from 'lucide-react';
import { sendMessageToUnit01 } from '../services/aiService';
import { supabase } from '../lib/supabaseClient';
import { ChatMessage } from '../types';

interface AIAssistantProps {
  onClose: () => void;
  user: any;
  onRefreshData: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, user, onRefreshData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const executeAIAction = async (command: any) => {
    const { action, payload } = command;
    try {
      if (action === 'CREATE_TASK') {
        await supabase.from('tasks').insert({ user_id: user.id, title: payload.title, category: payload.category || 'SYSTEM', status: 'TODO' });
      } else if (action === 'UPDATE_TASK') {
        await supabase.from('tasks').update({ status: payload.status }).ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'DELETE_TASK') {
        await supabase.from('tasks').delete().ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'ADD_SCHEDULE') {
        await supabase.from('schedule_blocks').insert({ user_id: user.id, title: payload.title, start_time: payload.start_time, type: payload.type || 'WORK', date: payload.date });
      } else if (action === 'RESCHEDULE') {
        await supabase.from('schedule_blocks').update({ date: payload.new_date, start_time: payload.new_start_time }).ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'DELETE_SCHEDULE') {
        await supabase.from('schedule_blocks').delete().eq('date', payload.date).ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'LOG_NOTE') {
        await supabase.from('neural_logs').insert({ user_id: user.id, title: payload.title, content: payload.content, mood: payload.mood || 'ZEN' });
      } else if (action === 'DELETE_NOTE') {
        await supabase.from('neural_logs').delete().ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      }
      onRefreshData();
    } catch (err) {
      console.error("CRUD Execution Failed:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setLoading(true);

    const userMsgObj: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMsg, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsgObj]);

    const responseText = await sendMessageToUnit01(user.id, userMsg, sessionId);
    
    // Parse JSON command if exists in the response
    const jsonMatch = responseText.match(/\{[\s\n]*"action"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const command = JSON.parse(jsonMatch[0]);
        await executeAIAction(command);
      } catch (e) { console.error("JSON Parse Error", e); }
    }

    const assistantMsgObj: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText.replace(/\{[\s\n]*"action"[\s\S]*?\}/g, '').trim(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsgObj]);
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-purple-500/30 bg-[#080808] shadow-[0_0_80px_rgba(139,0,255,0.2)] relative">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cpu className="text-purple-400" size={24} />
              <div className="absolute -inset-1 bg-purple-500/20 blur-sm rounded-full animate-pulse" />
            </div>
            <h2 className="font-orbitron font-bold text-white tracking-widest text-sm md:text-base">PURPLE // GROQ_LPU CORE v3</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"><X size={20} /></button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-[0.02]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
               <Zap size={48} className="text-purple-500 mb-4" />
               <p className="font-orbitron text-xs tracking-[0.5em] mb-2 uppercase text-white">Neural Link Idle</p>
               <p className="text-xs font-mono text-gray-500 max-w-xs uppercase">Awaiting high-performance directives via Groq LPU engine</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-md'}`}>
                <p className="text-sm font-rajdhani leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" />
                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" />
                </div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Processing LPU Stream...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-black/60 border-t border-white/10">
          <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:border-purple-500/50 transition-all shadow-inner">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="System directive..." 
              className="flex-1 bg-transparent border-none outline-none text-white px-4 font-mono text-sm placeholder-gray-700"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-20 disabled:cursor-not-allowed group"
            >
              <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-gray-600 font-mono text-center flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><Wifi size={10} className="text-green-500" /> SYNCED</span>
            <span className="opacity-30">|</span>
            <span>LLAMA-3.3-70B // GROQ INFERENCE</span>
            <span className="opacity-30">|</span>
            <span className="text-purple-500/50">TOTAL RECALL: ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

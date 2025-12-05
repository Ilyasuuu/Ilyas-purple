import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Cpu, Loader2, Sparkles } from 'lucide-react';
import { sendMessageToUnit01 } from '../services/geminiService'; // FIXED IMPORT
import { supabase } from '../lib/supabaseClient';

interface AIAssistantProps {
  onClose: () => void;
  user: any; // Receive the user object to get the ID
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch History on Load
  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('chat_history')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Oldest first for chat view

      if (data) {
        // Map DB 'assistant' role to UI 'assistant' role
        const formatted = data.map(d => ({ role: d.role as 'user'|'assistant', content: d.content }));
        setMessages(formatted);
      }
    };
    fetchHistory();
  }, [user]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // 3. Call the NEW Service (Passing User ID)
    const response = await sendMessageToUnit01(user.id, userMsg);

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[600px] glass-panel border border-purple-500/30 rounded-xl flex flex-col shadow-[0_0_50px_rgba(147,51,234,0.3)] z-50 overflow-hidden animate-in slide-in-from-bottom-10">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full absolute -right-0.5 -bottom-0.5 animate-pulse" />
            <Cpu className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-orbitron text-sm text-white tracking-widest">PURPLE // ONLINE</h3>
            <p className="text-[10px] text-gray-400 font-mono">NEURAL LINK ESTABLISHED</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/60 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <Sparkles className="mb-2 text-purple-500" />
            <span className="text-xs font-mono">Awaiting Input...</span>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                max-w-[85%] p-3 rounded-lg text-sm font-medium leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-purple-600/80 text-white rounded-br-none border border-purple-500/50' 
                  : 'bg-gray-800/80 text-gray-200 rounded-bl-none border border-white/10 shadow-lg'}
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/50 p-3 rounded-lg rounded-bl-none border border-white/5 flex gap-2 items-center">
              <Loader2 size={14} className="animate-spin text-purple-400" />
              <span className="text-xs text-gray-400 animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black/80 border-t border-white/10 backdrop-blur-md">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Command Unit-01..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600 font-mono"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
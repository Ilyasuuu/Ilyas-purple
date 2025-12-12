
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Cpu, Database, Plus, Mic, Paperclip, Trash2, FileText, Music, Video, File, Zap, ChevronRight } from 'lucide-react';
import { sendMessageToUnit01, transcribeAudio } from '../services/geminiService';
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
  // 1. Split by Code Blocks (```)
  const sections = content.split(/```/g);

  const parseInline = (text: string) => {
    // Bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-purple-300 font-bold">{part.slice(2, -2)}</strong>;
      }
      // Inline Code (`text`)
      const codeParts = part.split(/(`.*?`)/g);
      return codeParts.map((subPart, subIndex) => {
        if (subPart.startsWith('`') && subPart.endsWith('`')) {
          return <code key={`${index}-${subIndex}`} className="bg-white/10 text-purple-200 px-1.5 py-0.5 rounded text-xs font-mono">{subPart.slice(1, -1)}</code>;
        }
        return subPart;
      });
    });
  };

  const formatTextSection = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />; // Spacer

      // Headings
      if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-purple-300 mt-4 mb-2 font-orbitron">{parseInline(trimmed.replace('### ', ''))}</h3>;
      if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-purple-500/30 pb-1 font-orbitron">{parseInline(trimmed.replace('## ', ''))}</h2>;
      if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-6 mb-4 font-orbitron">{parseInline(trimmed.replace('# ', ''))}</h1>;

      // Lists
      if (trimmed.startsWith('- ')) {
        return (
            <div key={i} className="flex items-start gap-2 mb-1 pl-2">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <p className="text-gray-300 leading-relaxed">{parseInline(trimmed.replace('- ', ''))}</p>
            </div>
        );
      }
      if (trimmed.match(/^\d+\. /)) {
        return (
            <div key={i} className="flex items-start gap-2 mb-1 pl-2">
                <span className="text-purple-400 font-mono font-bold text-xs mt-1">{trimmed.split('.')[0]}.</span>
                <p className="text-gray-300 leading-relaxed">{parseInline(trimmed.replace(/^\d+\. /, ''))}</p>
            </div>
        );
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
          return (
              <div key={i} className="border-l-2 border-purple-500 pl-4 py-1 my-2 bg-purple-900/10 italic text-gray-400">
                  {parseInline(trimmed.replace('> ', ''))}
              </div>
          );
      }

      // Standard Paragraph
      return <p key={i} className="mb-2 text-gray-200 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  return (
    <div className="space-y-1">
      {sections.map((section, index) => {
        // Even indices are text, Odd are code blocks
        if (index % 2 === 1) {
          // Detect language (first line)
          const firstLineBreak = section.indexOf('\n');
          const lang = firstLineBreak > -1 ? section.slice(0, firstLineBreak).trim() : '';
          const code = firstLineBreak > -1 ? section.slice(firstLineBreak + 1) : section;

          return (
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f] shadow-lg">
                <div className="bg-white/5 px-3 py-1 text-[10px] font-mono text-gray-500 uppercase flex justify-between">
                    <span>{lang || 'CODE'}</span>
                    <span>RAW</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap">{code.trim()}</pre>
                </div>
            </div>
          );
        } else {
          return <div key={index}>{formatTextSection(section)}</div>;
        }
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---
const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, user, onRefreshData }) => {
  const isMounted = useRef(true);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Input State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- EXECUTOR ENGINE ---
  const executeAIAction = async (command: any) => {
    if (!command || !command.action) return;
    const { action, payload } = command;

    try {
      if (action === 'CREATE_TASK') {
        await supabase.from('tasks').insert({ user_id: user.id, title: payload.title, category: payload.category || 'SYSTEM', status: payload.status || 'TODO', due_date: payload.due_date || 'Today' });
      } else if (action === 'DELETE_TASK') {
        await supabase.from('tasks').delete().ilike('title', `%${payload.title_keyword}%`).eq('user_id', user.id);
      } else if (action === 'ADD_SCHEDULE') {
        await supabase.from('schedule_blocks').insert({ user_id: user.id, title: payload.title, start_time: payload.start_time, type: payload.type || 'WORK', date: payload.date || new Date().toISOString().split('T')[0] });
      } else if (action === 'DELETE_SCHEDULE') {
        const { data: blocks } = await supabase.from('schedule_blocks').select('id').eq('user_id', user.id).eq('date', payload.date).ilike('title', `%${payload.title_keyword}%`).limit(1);
        if (blocks && blocks.length > 0) await supabase.from('schedule_blocks').delete().eq('id', blocks[0].id);
      } else if (action === 'LOG_NOTE') {
        await supabase.from('neural_logs').insert({ user_id: user.id, title: payload.title, content: payload.content, mood: payload.mood || 'ZEN', is_encrypted: false });
      }
      onRefreshData();
    } catch (err) {
      console.error("AI Action Failed:", err);
    }
  };

  // --- SESSION MGMT ---
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

  // --- ROBUST CHAT FETCHING ---
  // We use a ref to track the latest fetch timestamp to prevent out-of-order updates
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    if (!user || !currentSessionId) return;

    const fetchChat = async () => {
      const fetchTime = Date.now();
      lastFetchRef.current = fetchTime;

      // 1. Don't clear messages immediately to prevent flashing/data loss
      // setMessages([]); <--- REMOVE THIS

      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching chat:", error);
        return;
      }

      // Check if this fetch is still relevant (i.e., user hasn't switched sessions again)
      // and if the component is still mounted.
      if (isMounted.current && lastFetchRef.current === fetchTime && data) {
        
        setMessages((prevMessages) => {
          // 2. Create a Map of existing messages by ID (or content signature)
          const messageMap = new Map();

          // Helper to create a unique signature for a message to detect duplicates
          // even if IDs are different (e.g. Local "12345" vs DB "uuid-xxx")
          const getSignature = (msg: any) => 
            `${msg.role}-${msg.content.trim()}-${new Date(msg.created_at).setMilliseconds(0)}`;

          // Load fetched DB messages first (They are the source of truth)
          data.forEach((msg) => {
            messageMap.set(getSignature(msg), msg);
            // Also map by ID if it's a valid UUID (assuming DB uses UUIDs)
            if (msg.id.length > 20) messageMap.set(msg.id, msg);
          });

          // 3. Merge Local "Optimistic" Messages
          // We keep local messages that haven't been saved to DB yet
          prevMessages.forEach((localMsg) => {
            // If this local message isn't in the DB set yet (by content signature), keep it.
            // This handles the case where you typed something, tabbed out, and the DB fetch 
            // hasn't caught up to your new message yet.
            const sig = getSignature(localMsg);
            const isSavedInDb = messageMap.has(sig) || messageMap.has(localMsg.id);
            
            if (!isSavedInDb) {
              messageMap.set(localMsg.id, localMsg);
            }
          });

          // Convert back to array and sort by time
          const merged = Array.from(messageMap.values());
          // Remove strict duplicates based on ID just in case
          const unique = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          
          return unique.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    };

    fetchChat();
  }, [currentSessionId, user]); 

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleNewSession = () => {
    const newId = crypto.randomUUID();
    if (isMounted.current) {
      setCurrentSessionId(newId);
      setMessages([]);
      setSessions(prev => [{ id: newId, date: 'Today', preview: 'New Neural Link' }, ...prev]);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMounted.current) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) handleNewSession();
    }
    await supabase.from('chat_history').delete().eq('session_id', sessionId);
  };

  // --- I/O HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isMedia = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type === 'application/pdf';
    if (isMedia) {
      const reader = new FileReader(); reader.onloadend = () => { if(isMounted.current) { setAttachment(reader.result as string); setAttachmentName(file.name); } }; reader.readAsDataURL(file);
    } else {
      const reader = new FileReader(); reader.onload = (e) => { const content = e.target?.result as string; if(isMounted.current) setInput(prev => `${prev}${prev ? '\n\n' : ''}[FILE: ${file.name}]\n${content}\n[END FILE]`); }; reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let imageFound = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        imageFound = true;
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted.current) {
              setAttachment(reader.result as string);
              setAttachmentName(file.name || `Screenshot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`);
            }
          };
          reader.readAsDataURL(file);
        }
        return; // Only process the first image found
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { mediaRecorderRef.current.stop(); if(isMounted.current) setIsRecording(false); } return;
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
          if(isMounted.current) setLoading(true);
          const text = await transcribeAudio(base64Audio);
          if (text && isMounted.current) setInput(prev => (prev ? prev + " " + text : text));
          if(isMounted.current) setLoading(false);
          stream.getTracks().forEach(track => track.stop());
        };
      };
      mediaRecorder.start(); if(isMounted.current) setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone Error:", err); 
      if(isMounted.current) setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !user || loading) return;
    const userMsg = input; const currentAttachment = attachment;
    if(isMounted.current) {
        setInput(''); setAttachment(null); setAttachmentName(null);
        const tempMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userMsg, created_at: new Date().toISOString(), session_id: currentSessionId, attachment: currentAttachment || undefined };
        setMessages(prev => [...prev, tempMsg]);
        setLoading(true);
    }

    let responseText = await sendMessageToUnit01(user.id, userMsg, currentSessionId, currentAttachment || undefined);

    const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const command = JSON.parse(jsonMatch[1]);
            await executeAIAction(command);
            responseText = responseText.replace(jsonMatch[0], '').trim();
            if (!responseText) responseText = "Action executed successfully.";
            await supabase.from('chat_history').update({ content: responseText }).eq('session_id', currentSessionId).order('created_at', { ascending: false }).limit(1);
        } catch (e) {
            console.error("AI Command Error", e);
        }
    }

    if(isMounted.current) {
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, created_at: new Date().toISOString(), session_id: currentSessionId };
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, preview: userMsg.substring(0, 30) + '...' } : s));
    }
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
                  <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.attachment && renderAttachmentPreview(msg.attachment)}
                    <div className={`p-6 rounded-2xl relative backdrop-blur-md shadow-lg ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-[#0f0f15]/80 border border-white/10 rounded-bl-none'}`}>
                        {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap font-sans text-sm">{msg.content}</p>
                        ) : (
                            <div className="prose prose-invert max-w-none text-sm font-sans">
                                <MarkdownRenderer content={msg.content} />
                            </div>
                        )}
                    </div>
                    <span className="text-[9px] font-mono text-gray-600 opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
               </div>
             ))}
             {loading && <div className="flex justify-start"><div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" /><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" /></div></div>}
             <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-30">
             <div className="max-w-4xl mx-auto">
                {attachment && <div className="mb-2 relative inline-flex items-center gap-2 bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-500/50"><FileText size={14} className="text-purple-300" /><span className="text-xs font-mono text-purple-200 truncate max-w-[150px]">{attachmentName}</span><button onClick={() => { setAttachment(null); setAttachmentName(null); }} className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-0.5 ml-2 transition-colors"><X size={12} /></button></div>}
                <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 group focus-within:ring-purple-500/50 transition-all">
                   <input type="file" ref={fileInputRef} accept="*" className="hidden" onChange={handleFileSelect} />
                   <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-500 hover:text-purple-400 hover:bg-white/5 rounded-xl transition-colors"><Paperclip size={20} /></button>
                   <textarea 
                     value={input} 
                     onChange={(e) => setInput(e.target.value)} 
                     onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
                     onPaste={handlePaste}
                     placeholder={isRecording ? "Listening..." : "Type directive or speak..."} 
                     className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-600 max-h-32 py-3 resize-none custom-scrollbar" 
                     rows={1} 
                   />
                   <button onClick={toggleRecording} className={`p-3 rounded-xl transition-all ${isRecording ? 'text-red-500 bg-red-900/20 animate-pulse' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Mic size={20} /></button>
                   <button onClick={handleSend} disabled={(!input.trim() && !attachment) || loading} className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-800"><Send size={20} /></button>
                </div>
                <div className="text-center mt-2"><p className="text-[9px] text-gray-600 font-mono">PURPLE NEURAL LINK v2.1 // RICH TEXT ENABLED</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

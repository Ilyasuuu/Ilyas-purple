import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Cpu, Image as ImageIcon, Loader2 } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Unit-01 Online. Ready for directives, Ilyasuu.', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | undefined>(undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract base64 data (remove prefix like "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        setSelectedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input + (selectedImage ? ' [Image Attached]' : ''),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imagePayload = selectedImage ? { inlineData: selectedImage } : undefined;
    setSelectedImage(undefined);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(input, imagePayload);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Orb Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-black border-2 border-purple-500 shadow-[0_0_20px_rgba(139,0,255,0.6)] flex items-center justify-center z-50 group hover:scale-110 transition-transform"
        >
          <div className="absolute inset-0 bg-purple-600 rounded-full opacity-20 animate-ping" />
          <Cpu className="text-purple-400 w-8 h-8 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-[#0a0a0f] border border-purple-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-purple-900/50 bg-purple-900/10 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-orbitron font-bold text-white tracking-widest">UNIT-01</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[80%] p-3 rounded-lg text-sm font-rajdhani leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-purple-900/40 text-purple-100 border border-purple-500/30 rounded-br-none' 
                      : 'bg-gray-900/80 text-gray-300 border border-gray-700 rounded-bl-none'}
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-900/80 p-3 rounded-lg rounded-bl-none border border-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-purple-900/30 bg-black/40">
            {selectedImage && (
              <div className="mb-2 text-xs text-purple-400 flex items-center gap-1">
                <ImageIcon size={12} /> Image attached
                <button type="button" onClick={() => setSelectedImage(undefined)} className="ml-2 hover:text-red-400"><X size={10} /></button>
              </div>
            )}
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
              >
                <ImageIcon size={20} />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white font-mono text-sm placeholder-gray-600"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="p-2 text-purple-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;

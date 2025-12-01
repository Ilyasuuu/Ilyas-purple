
import React from 'react';
import { Globe, MessageSquareLock, Bookmark, Wifi } from 'lucide-react';

const Apps: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* LEFT COLUMN: IDENTITY NODE (X_PROTOCOL) */}
      <div className="flex flex-col">
        <div className="glass-panel p-1 rounded-3xl overflow-hidden relative group">
          {/* Decorative Borders */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white/20 rounded-tl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-white/20 rounded-br-3xl pointer-events-none" />
          
          <div className="bg-[#0a0a0f]/80 backdrop-blur-xl p-8 h-full flex flex-col relative z-10">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <h2 className="font-mono text-sm text-gray-500 tracking-[0.2em]">NETWORK UPLINK // X_PROTOCOL</h2>
              <Wifi size={16} className="text-green-500 animate-pulse" />
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-6 mb-10">
              {/* Avatar with Scanline */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-purple-500/50 transition-colors">
                <img 
                  src="https://i.pinimg.com/736x/8e/1a/0b/8e1a0b3206263bb6399b32970a259972.jpg" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                {/* CSS Scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent w-full h-full animate-[scan_2s_linear_infinite] pointer-events-none" />
              </div>

              <div>
                <h1 className="text-3xl font-orbitron font-bold text-white tracking-wide">@Ilyasuu</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-xs font-mono text-green-400 tracking-widest">CONNECTED</span>
                </div>
              </div>
            </div>

            {/* Command Keys */}
            <div className="space-y-4 flex-1">
              <a 
                href="https://x.com/home" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-purple-900/20 hover:border-purple-500/50 hover:translate-x-2 transition-all duration-300 group/btn shadow-none hover:shadow-[0_0_20px_rgba(139,0,255,0.15)]"
              >
                <div className="flex items-center gap-4">
                  <Globe className="text-purple-500 group-hover/btn:text-white transition-colors" />
                  <span className="font-rajdhani font-bold text-lg tracking-wider">SIGNAL STREAM</span>
                </div>
                <span className="text-xs font-mono text-gray-600 group-hover/btn:text-purple-400">OPEN FEED</span>
              </a>

              <a 
                href="https://x.com/messages" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-blue-900/20 hover:border-blue-500/50 hover:translate-x-2 transition-all duration-300 group/btn shadow-none hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              >
                <div className="flex items-center gap-4">
                  <MessageSquareLock className="text-blue-500 group-hover/btn:text-white transition-colors" />
                  <span className="font-rajdhani font-bold text-lg tracking-wider">SECURE COMMS</span>
                </div>
                <span className="text-xs font-mono text-gray-600 group-hover/btn:text-blue-400">ENCRYPTED</span>
              </a>

              <a 
                href="https://x.com/i/bookmarks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl text-gray-300 hover:text-white hover:bg-yellow-900/20 hover:border-yellow-500/50 hover:translate-x-2 transition-all duration-300 group/btn shadow-none hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]"
              >
                <div className="flex items-center gap-4">
                  <Bookmark className="text-yellow-500 group-hover/btn:text-white transition-colors" />
                  <span className="font-rajdhani font-bold text-lg tracking-wider">DATA ARCHIVE</span>
                </div>
                <span className="text-xs font-mono text-gray-600 group-hover/btn:text-yellow-400">RETRIEVE</span>
              </a>
            </div>

            <div className="mt-8 text-center text-[10px] text-gray-600 font-mono">
              UPLINK ID: X-882-ALPHA // TERMINAL ACTIVE
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PLACEHOLDER */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-black/20 text-gray-600 font-mono text-xs">
        <span className="animate-pulse">AWAITING MODULE INTEGRATION...</span>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default Apps;

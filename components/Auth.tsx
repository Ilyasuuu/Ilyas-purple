import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Fingerprint, ChevronRight, AlertTriangle, Cpu } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check for placeholder configuration
    // Accessing private properties is generally discouraged but useful for this specific config check
    const clientUrl = (supabase as any).supabaseUrl || '';
    if (clientUrl.includes('placeholder.supabase.co')) {
      setError("SYSTEM CONFIG ERROR: Missing Supabase Credentials. Cannot authenticate.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#050505] bg-grid relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-1 relative group">
        {/* Animated Borders */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl opacity-50 blur group-hover:opacity-75 transition-opacity duration-1000 animate-pulse" />
        
        <div className="relative bg-[#0a0a0f] rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/20 border border-purple-500/50 mb-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-purple-500/10 animate-[scan_2s_linear_infinite]" />
               <Fingerprint size={32} className="text-purple-400" />
            </div>
            <h1 className="text-2xl font-orbitron font-bold text-white tracking-[0.2em]">SYSTEM ACCESS</h1>
            <p className="text-xs font-mono text-purple-400 mt-2 tracking-widest uppercase">Biometric Gate Active</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group/input">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block group-focus-within/input:text-purple-400 transition-colors">Callsign (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-purple-500 focus:outline-none focus:bg-purple-900/10 transition-all placeholder-gray-700"
                  placeholder="OPERATIVE@ILYASUU.OS"
                  required
                />
              </div>
              
              <div className="relative group/input">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block group-focus-within/input:text-purple-400 transition-colors">Access Code (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-purple-500 focus:outline-none focus:bg-purple-900/10 transition-all placeholder-gray-700"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-400 font-mono animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={14} />
                <span>ERROR: {error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold font-rajdhani text-lg rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {loading ? (
                <span className="animate-pulse">VERIFYING...</span>
              ) : (
                <>
                  {isLogin ? 'INITIALIZE LINK' : 'REGISTER NEW USER'} <ChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-xs font-mono text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
            >
              {isLogin ? 'Request New Clearance?' : 'Already have credentials?'}
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-600 font-mono">
             <span>SECURE CONNECTION</span>
             <span className="flex items-center gap-1"><Lock size={10} /> ENCRYPTED</span>
          </div>

        </div>
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

export default Auth;
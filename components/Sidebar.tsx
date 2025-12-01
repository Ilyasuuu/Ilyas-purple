import React from 'react';
import { NAV_ITEMS } from '../constants';
import { Tab } from '../types';
import { LogOut, Settings, Menu } from 'lucide-react';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, onLogout }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Right Navigation (Hover to Expand) */}
      <aside className={`
        fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        
        /* Mobile Styles */
        ${isMobileOpen ? 'right-0 top-0 bottom-0 w-64' : '-right-full top-0 bottom-0 w-64'}
        md:right-6 md:top-6 md:bottom-6 md:w-20 md:hover:w-72
        
        /* Glass Style */
        glass-floating md:rounded-[30px] rounded-l-2xl md:rounded-r-[30px]
        flex flex-col overflow-hidden group border-l border-white/10 md:border border-white/15
      `}>
        {/* Header - Hidden on collapsed desktop, visible on hover */}
        <div className="p-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 md:absolute md:top-0 md:left-0 md:w-full bg-gradient-to-b from-purple-500/10 to-transparent">
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-widest whitespace-nowrap">
            ILYASUU<span className="text-purple-400">_OS</span>
          </h1>
          <div className="h-1 w-10 bg-purple-500 rounded-full mt-2" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-3 px-3 md:mt-20 mt-0 flex flex-col justify-center">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                setIsMobileOpen(false);
              }}
              className={`
                flex items-center space-x-4 px-3 py-3 rounded-xl transition-all duration-300 relative
                ${activeTab === item.id 
                  ? 'bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'}
              `}
            >
              <div className="min-w-[24px] flex justify-center">
                <item.icon className={`w-6 h-6 transition-colors ${activeTab === item.id ? 'text-purple-300' : 'text-gray-400 group-hover:text-purple-300'}`} />
              </div>
              <span className={`
                font-rajdhani font-medium text-lg tracking-wide whitespace-nowrap transition-all duration-300
                md:opacity-0 md:translate-x-4 md:group-hover:opacity-100 md:group-hover:translate-x-0
              `}>
                {item.label}
              </span>
              
              {/* Active Indicator Line */}
              {activeTab === item.id && (
                <div className="absolute left-0 w-1 h-8 bg-purple-400 rounded-r-full shadow-[0_0_10px_#A855F7]" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 space-y-2 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <button className="w-full flex items-center space-x-4 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <div className="min-w-[24px] flex justify-center"><Settings className="w-5 h-5" /></div>
            <span className="font-rajdhani text-sm whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">Config</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
          >
             <div className="min-w-[24px] flex justify-center"><LogOut className="w-5 h-5" /></div>
            <span className="font-rajdhani text-sm whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button (Visible only on small screens) */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 glass-panel rounded-lg text-white"
      >
        <Menu size={24} />
      </button>
    </>
  );
};

export default Sidebar;
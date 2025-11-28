import React from 'react';
import { Users, Zap } from 'lucide-react';

interface HeaderProps {
  onlineCount: number;
}

const Header: React.FC<HeaderProps> = ({ onlineCount }) => {
  return (
    <div className="fixed top-0 left-0 w-full z-40 p-4 pointer-events-none flex justify-between items-start">
      <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 rounded-2xl shadow-xl flex items-center space-x-3">
        <div className="bg-indigo-500/20 p-2 rounded-xl">
          <Zap size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">PixelPlace</h1>
          <p className="text-slate-400 text-xs">Universe #1</p>
        </div>
      </div>

      <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-2 rounded-full shadow-xl flex items-center space-x-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-slate-300 text-xs font-semibold flex items-center gap-1">
          <Users size={12} />
          {onlineCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default Header;

import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Radio } from 'lucide-react';
import { api, isElectron } from '../api';

const GithubIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface TitleBarProps {
  safeMode: boolean;
  onToggleSafeMode: () => void;
  devPortsCount: number;
  totalListening: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  safeMode,
  onToggleSafeMode,
  devPortsCount,
  totalListening
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isElectron) {
      window.winpmanager?.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMaximize = () => {
    api.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  const openGithub = () => {
    api.openUrl('https://github.com/ProbotisOP');
  };

  return (
    <div className="drag-region flex items-center justify-between h-11 px-3.5 bg-[#0a0b0f] border-b border-[#1c1e28] select-none z-50">
      {/* Left: App Title & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="./Logo.png"
            alt="WinPManager"
            className="w-5 h-5 rounded object-contain"
            onError={(e) => {
              // fallback if relative path differs
              (e.target as HTMLImageElement).src = '/Logo.png';
            }}
          />
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            WinPManager
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-zinc-300">Listening</span>
          <span className="font-mono-code text-zinc-500 text-xs">
            ({devPortsCount} dev / {totalListening} total)
          </span>
        </div>
      </div>

      {/* Center: Scope Toggle & GitHub Creator Link */}
      <div className="no-drag flex items-center gap-3">
        <div className="hidden sm:flex items-center bg-[#13141c] p-0.5 rounded-md border border-[#212330]">
          <button
            onClick={() => !safeMode && onToggleSafeMode()}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              safeMode
                ? 'bg-[#1e202c] text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Dev Ports
          </button>
          <button
            onClick={() => safeMode && onToggleSafeMode()}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              !safeMode
                ? 'bg-[#1e202c] text-amber-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Include System ({totalListening - devPortsCount})
          </button>
        </div>

        {/* Developer Credit Link */}
        <button
          onClick={openGithub}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#13141c] hover:bg-[#1a1c28] border border-[#212330] text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          title="Developed by ProbotisOP on GitHub"
        >
          <GithubIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">ProbotisOP</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        {isElectron ? (
          <>
            <button
              onClick={() => api.minimizeWindow()}
              className="w-10 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-10 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => api.closeWindow()}
              className="w-10 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            <span>Web Mode</span>
          </div>
        )}
      </div>
    </div>
  );
};

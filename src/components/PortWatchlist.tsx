import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PortItem } from '../types';

interface PortWatchlistProps {
  ports: PortItem[];
  onKillPort: (port: number) => void;
}

const DEFAULT_WATCHED_PORTS = [3000, 5173, 8000, 8080, 4200, 3306, 5432];

export const PortWatchlist: React.FC<PortWatchlistProps> = ({
  ports,
  onKillPort
}) => {
  const [watchedList, setWatchedList] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('winpmanager_watched_ports');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHED_PORTS;
    } catch (e) {
      return DEFAULT_WATCHED_PORTS;
    }
  });

  const [newPortInput, setNewPortInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const saveList = (list: number[]) => {
    setWatchedList(list);
    localStorage.setItem('winpmanager_watched_ports', JSON.stringify(list));
  };

  const addPort = () => {
    const p = parseInt(newPortInput, 10);
    if (!isNaN(p) && p > 0 && p <= 65535 && !watchedList.includes(p)) {
      saveList([...watchedList, p].sort((a, b) => a - b));
      setNewPortInput('');
      setIsAdding(false);
    }
  };

  const removeWatchedPort = (p: number, e: React.MouseEvent) => {
    e.stopPropagation();
    saveList(watchedList.filter(x => x !== p));
  };

  return (
    <div className="flex items-center flex-wrap gap-2 mb-4 text-sm">
      <span className="text-xs uppercase font-semibold text-zinc-400 mr-1 select-none">
        Pinned Ports:
      </span>

      {watchedList.map((wp) => {
        const active = ports.find(p => p.port === wp);
        return (
          <div
            key={wp}
            className={`group flex items-center gap-2 px-2.5 py-1 rounded-md border transition-colors ${
              active
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-[#111219] border-[#1f212e] text-zinc-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${active ? 'bg-amber-400' : 'bg-emerald-500'}`}
            />
            <span className="font-mono-code font-bold text-sm text-zinc-100">:{wp}</span>

            {active ? (
              <>
                <span className="text-xs text-zinc-400 max-w-[80px] truncate">
                  {active.framework || active.processName}
                </span>
                <button
                  onClick={() => onKillPort(wp)}
                  className="w-4 h-4 rounded bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={`Kill process holding port ${wp}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <span className="text-xs text-emerald-500 font-mono-code">free</span>
            )}

            <button
              onClick={(e) => removeWatchedPort(wp, e)}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 ml-0.5 transition-opacity cursor-pointer"
              title="Unpin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {isAdding ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={newPortInput}
            onChange={(e) => setNewPortInput(e.target.value)}
            placeholder="Port"
            className="w-16 bg-black/60 border border-zinc-700 rounded px-2 py-1 text-xs font-mono-code text-white focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') addPort();
              if (e.key === 'Escape') setIsAdding(false);
            }}
          />
          <button
            onClick={addPort}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs cursor-pointer"
          >
            Add
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-transparent border border-dashed border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
          title="Pin a port to watchlist"
        >
          <Plus className="w-3 h-3" />
          <span>Pin</span>
        </button>
      )}
    </div>
  );
};

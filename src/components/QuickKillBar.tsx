import React, { useState } from 'react';
import { PortItem } from '../types';

interface QuickKillBarProps {
  ports: PortItem[];
  onKillPort: (port: number) => void;
  loading: boolean;
}

export const QuickKillBar: React.FC<QuickKillBarProps> = ({
  ports,
  onKillPort,
  loading
}) => {
  const [targetPort, setTargetPort] = useState('');

  const numPort = parseInt(targetPort, 10);
  const matchedPort = !isNaN(numPort) ? ports.find(p => p.port === numPort) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNaN(numPort) && numPort > 0 && numPort <= 65535) {
      onKillPort(numPort);
      setTargetPort('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2.5 p-2 bg-[#111219] rounded-lg border border-[#1e202c] mb-4"
    >
      <div className="flex-1 relative flex items-center">
        <span className="font-mono-code text-zinc-500 pl-3 text-sm font-semibold select-none">
          :
        </span>
        <input
          type="number"
          min="1"
          max="65535"
          value={targetPort}
          onChange={(e) => setTargetPort(e.target.value)}
          placeholder="Terminate port by number (e.g. 3000, 5173, 8080)..."
          className="w-full bg-transparent pl-2 pr-4 py-2 font-mono-code text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
        />

        {targetPort && (
          <div className="absolute right-3 flex items-center pointer-events-none">
            {matchedPort ? (
              <span className="text-xs font-mono-code text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded">
                Occupied by {matchedPort.processName} (PID {matchedPort.pid})
              </span>
            ) : (
              <span className="text-xs font-mono-code text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 px-2.5 py-1 rounded">
                Port available
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!targetPort || isNaN(numPort) || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          matchedPort
            ? 'bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm'
            : targetPort
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            : 'bg-zinc-900 text-zinc-600 border border-zinc-800/50 cursor-not-allowed'
        }`}
      >
        <span>{matchedPort ? `Kill Port ${numPort}` : 'Free Port'}</span>
        <kbd className="font-mono-code text-xs bg-black/40 px-1.5 py-0.5 rounded text-zinc-400">
          Enter
        </kbd>
      </button>
    </form>
  );
};

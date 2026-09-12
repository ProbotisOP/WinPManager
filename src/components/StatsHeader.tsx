import React from 'react';
import { RefreshCw, Square } from 'lucide-react';

interface StatsHeaderProps {
  devPortsCount: number;
  memoryTotalFormatted: string;
  systemPortsCount: number;
  totalCount: number;
  loading: boolean;
  onRefresh: () => void;
  onKillAllDev: () => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  devPortsCount,
  memoryTotalFormatted,
  systemPortsCount,
  loading,
  onRefresh,
  onKillAllDev
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#111219] rounded-lg border border-[#1e202c] mb-4">
      {/* Metrics Strip */}
      <div className="flex items-center flex-wrap gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
            Active Dev Ports
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-code font-bold text-xl text-zinc-100">
              {devPortsCount}
            </span>
            <span className="text-xs text-zinc-500">listening</span>
          </div>
        </div>

        <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
            Total Memory (RSS)
          </span>
          <span className="font-mono-code font-bold text-xl text-zinc-200">
            {memoryTotalFormatted}
          </span>
        </div>

        <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 block mb-0.5">
            Shielded Services
          </span>
          <span className="font-mono-code text-base text-zinc-400">
            {systemPortsCount} OS ports hidden
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#181924] hover:bg-[#202230] border border-[#272938] text-zinc-200 text-sm font-medium transition-colors cursor-pointer"
          title="Rescan active ports"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Rescan</span>
        </button>

        <button
          onClick={onKillAllDev}
          disabled={devPortsCount === 0 || loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer border ${
            devPortsCount > 0
              ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border-red-800/40 shadow-sm'
              : 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50 cursor-not-allowed'
          }`}
          title="Terminate all active development processes"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>Terminate All Dev Ports</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Search, LayoutList, LayoutGrid, Clock } from 'lucide-react';
import { FilterTab, ViewMode } from '../types';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  safeMode: boolean;
  counts: {
    allDev: number;
    web: number;
    backend: number;
    databases: number;
    all: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  refreshInterval,
  onRefreshIntervalChange,
  safeMode,
  counts
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by port, PID, process name, project folder..."
          className="w-full pl-9 pr-7 py-2 bg-[#111219] border border-[#1e202c] rounded-md text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Scope Tabs */}
        <div className="flex items-center bg-[#111219] p-0.5 rounded-md border border-[#1e202c]">
          <button
            onClick={() => onTabChange('all-dev')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'all-dev'
                ? 'bg-[#1e202c] text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Dev Ports</span>
            <span className="text-xs font-mono-code text-zinc-500">
              {counts.allDev}
            </span>
          </button>

          <button
            onClick={() => onTabChange('web')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'web'
                ? 'bg-[#1e202c] text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Web / Node</span>
            <span className="text-xs font-mono-code text-zinc-500">
              {counts.web}
            </span>
          </button>

          <button
            onClick={() => onTabChange('python-rust')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'python-rust'
                ? 'bg-[#1e202c] text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Backend</span>
            <span className="text-xs font-mono-code text-zinc-500">
              {counts.backend}
            </span>
          </button>

          <button
            onClick={() => onTabChange('databases')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'databases'
                ? 'bg-[#1e202c] text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Databases</span>
            <span className="text-xs font-mono-code text-zinc-500">
              {counts.databases}
            </span>
          </button>

          {!safeMode && (
            <button
              onClick={() => onTabChange('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-amber-950/40 text-amber-200 border border-amber-800/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>System</span>
              <span className="text-xs font-mono-code text-zinc-500">
                {counts.all}
              </span>
            </button>
          )}
        </div>

        {/* Polling Interval */}
        <div className="flex items-center gap-1.5 bg-[#111219] px-2.5 py-1.5 rounded-md border border-[#1e202c] text-xs text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
            aria-label="Refresh rate"
            className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value={1000} className="bg-[#111219] text-zinc-200">1s interval</option>
            <option value={2000} className="bg-[#111219] text-zinc-200">2s interval</option>
            <option value={5000} className="bg-[#111219] text-zinc-200">5s interval</option>
            <option value={0} className="bg-[#111219] text-zinc-200">Manual</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#111219] p-0.5 rounded-md border border-[#1e202c]">
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-[#1e202c] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Table View (Dense)"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-[#1e202c] text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

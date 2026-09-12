import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Radio, AlertCircle } from 'lucide-react';

const GithubIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import { usePortManager } from './hooks/usePortManager';
import { TitleBar } from './components/TitleBar';
import { StatsHeader } from './components/StatsHeader';
import { QuickKillBar } from './components/QuickKillBar';
import { PortWatchlist } from './components/PortWatchlist';
import { FilterBar } from './components/FilterBar';
import { PortCard } from './components/PortCard';
import { PortTable } from './components/PortTable';
import { ProcessModal } from './components/ProcessModal';
import { ToastContainer } from './components/Toast';
import { FilterTab, PortItem, ViewMode } from './types';
import { api } from './api';

export function App() {
  const {
    ports,
    loading,
    error,
    terminatingPids,
    toasts,
    safeMode,
    refreshInterval,
    setRefreshInterval,
    toggleSafeMode,
    refresh,
    killPort,
    killPid,
    killAllDevPorts,
    dismissToast
  } = usePortManager();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all-dev');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [inspectedPort, setInspectedPort] = useState<PortItem | null>(null);

  // Compute category counts
  const counts = useMemo(() => {
    let dev = 0;
    let web = 0;
    let backend = 0;
    let databases = 0;

    for (const p of ports) {
      if (p.isDevServer) {
        dev++;
        const fw = (p.framework || '').toLowerCase();
        const cmd = (p.commandLine || '').toLowerCase();
        const name = (p.processName || '').toLowerCase();

        if (
          fw.includes('vite') ||
          fw.includes('next') ||
          fw.includes('react') ||
          fw.includes('node') ||
          fw.includes('nuxt') ||
          fw.includes('svelte') ||
          fw.includes('astro') ||
          fw.includes('remix') ||
          cmd.includes('express') ||
          name.includes('node') ||
          name.includes('bun')
        ) {
          web++;
        }

        if (
          fw.includes('python') ||
          fw.includes('fastapi') ||
          fw.includes('django') ||
          fw.includes('flask') ||
          fw.includes('rust') ||
          fw.includes('go') ||
          name.includes('python') ||
          name.includes('go')
        ) {
          backend++;
        }

        if (
          p.category === 'database' ||
          fw.includes('mysql') ||
          fw.includes('postgres') ||
          fw.includes('redis') ||
          fw.includes('docker')
        ) {
          databases++;
        }
      }
    }

    return {
      allDev: dev,
      web,
      backend,
      databases,
      all: ports.length
    };
  }, [ports]);

  // Filtered port list
  const filteredPorts = useMemo(() => {
    return ports.filter((item) => {
      // 1. Safe Mode: hide Windows System ports unless Safe Mode is turned off and 'all' tab selected
      if (safeMode && item.isSystem) {
        return false;
      }

      // 2. Tab Filter
      if (activeTab === 'all-dev' && !item.isDevServer && !item.isSystem) {
        // User custom non-system processes also allowed in dev view
      } else if (activeTab === 'all-dev' && item.isSystem) {
        return false;
      } else if (activeTab === 'web') {
        const fw = (item.framework || '').toLowerCase();
        const cmd = (item.commandLine || '').toLowerCase();
        const name = (item.processName || '').toLowerCase();
        const isWeb =
          fw.includes('vite') ||
          fw.includes('next') ||
          fw.includes('react') ||
          fw.includes('node') ||
          fw.includes('nuxt') ||
          fw.includes('svelte') ||
          fw.includes('astro') ||
          fw.includes('remix') ||
          cmd.includes('express') ||
          name.includes('node') ||
          name.includes('bun');
        if (!isWeb) return false;
      } else if (activeTab === 'python-rust') {
        const fw = (item.framework || '').toLowerCase();
        const name = (item.processName || '').toLowerCase();
        const isBackend =
          fw.includes('python') ||
          fw.includes('fastapi') ||
          fw.includes('django') ||
          fw.includes('flask') ||
          fw.includes('rust') ||
          fw.includes('go') ||
          name.includes('python') ||
          name.includes('go');
        if (!isBackend) return false;
      } else if (activeTab === 'databases') {
        const fw = (item.framework || '').toLowerCase();
        const isDb =
          item.category === 'database' ||
          fw.includes('mysql') ||
          fw.includes('postgres') ||
          fw.includes('redis') ||
          fw.includes('docker');
        if (!isDb) return false;
      }

      // 3. Search Filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesPort = String(item.port).includes(query);
        const matchesPid = String(item.pid).includes(query);
        const matchesName = item.processName.toLowerCase().includes(query);
        const matchesFramework = item.framework?.toLowerCase().includes(query) || false;
        const matchesProject = item.projectName?.toLowerCase().includes(query) || false;
        const matchesCmd = item.commandLine.toLowerCase().includes(query);
        return matchesPort || matchesPid || matchesName || matchesFramework || matchesProject || matchesCmd;
      }

      return true;
    });
  }, [ports, safeMode, activeTab, search]);

  // Total Dev Memory
  const totalDevMemoryFormatted = useMemo(() => {
    let total = 0;
    for (const p of ports) {
      if (p.isDevServer) total += p.memoryBytes;
    }
    const mb = total / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }, [ports]);

  const devPortsCount = ports.filter((p) => p.isDevServer).length;
  const systemPortsCount = ports.filter((p) => p.isSystem).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0d12] text-zinc-100 overflow-hidden">
      {/* Title Bar */}
      <TitleBar
        safeMode={safeMode}
        onToggleSafeMode={toggleSafeMode}
        devPortsCount={devPortsCount}
        totalListening={ports.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Metrics Strip */}
          <StatsHeader
            devPortsCount={devPortsCount}
            memoryTotalFormatted={totalDevMemoryFormatted}
            systemPortsCount={systemPortsCount}
            totalCount={ports.length}
            loading={loading}
            onRefresh={refresh}
            onKillAllDev={killAllDevPorts}
          />

          {/* Quick Port Terminator Bar */}
          <QuickKillBar
            ports={ports}
            onKillPort={(p) => killPort(p)}
            loading={loading}
          />

          {/* Pinned Ports */}
          <PortWatchlist
            ports={ports}
            onKillPort={(p) => killPort(p)}
          />

          {/* Scope Filters, Search, and View Controls */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
            safeMode={safeMode}
            counts={counts}
          />

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ports Display (Table or Cards) */}
          {filteredPorts.length === 0 ? (
            <div className="rounded-lg border border-[#1e202c] p-10 text-center bg-[#101118] my-4">
              <img
                src="./Logo.png"
                alt="WinPManager"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 shadow-lg shadow-black/60 border border-[#252838]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/Logo.png';
                }}
              />
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                {search ? 'No Matching Ports' : 'No Active Dev Servers'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4 leading-relaxed">
                {search
                  ? `No active process matches query "${search}".`
                  : 'No development ports are currently listening. Start a Vite, Next.js, Node, or Python server in your terminal to manage it here.'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <PortTable
              ports={filteredPorts}
              onKill={(p, pid) => killPort(p, pid)}
              onInspect={(p) => setInspectedPort(p)}
              terminatingPids={terminatingPids}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredPorts.map((item) => (
                  <PortCard
                    key={item.id}
                    port={item}
                    onKill={(p, pid) => killPort(p, pid)}
                    onInspect={(p) => setInspectedPort(p)}
                    isTerminating={terminatingPids.has(item.pid)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Sleek Developer Footer */}
      <div className="h-8 px-4 bg-[#0a0b0f] border-t border-[#1a1c26] flex items-center justify-between text-xs text-zinc-500 select-none">
        <div className="flex items-center gap-2">
          <span>WinPManager</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono-code text-[11px] text-zinc-600">v1.0.0</span>
        </div>

        <button
          onClick={() => api.openUrl('https://github.com/ProbotisOP')}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Developed by ProbotisOP"
        >
          <span>Developed by</span>
          <span className="font-semibold text-zinc-300 hover:underline flex items-center gap-1">
            <GithubIcon className="w-3 h-3 inline" /> ProbotisOP
          </span>
        </button>
      </div>

      {/* Process Inspector Modal */}
      <ProcessModal
        port={inspectedPort}
        onClose={() => setInspectedPort(null)}
        onKill={(p, pid) => killPort(p, pid)}
        isTerminating={inspectedPort ? terminatingPids.has(inspectedPort.pid) : false}
      />

      {/* Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;

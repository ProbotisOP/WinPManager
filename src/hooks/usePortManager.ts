import { useState, useEffect, useCallback, useRef } from 'react';
import { PortItem, ScanResult } from '../types';
import { api } from '../api';
import { ToastMessage } from '../components/Toast';

export function usePortManager() {
  const [ports, setPorts] = useState<PortItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [terminatingPids, setTerminatingPids] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(2000);
  const [safeMode, setSafeMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('winpmanager_safe_mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleSafeMode = () => {
    setSafeMode((prev) => {
      const next = !prev;
      localStorage.setItem('winpmanager_safe_mode', JSON.stringify(next));
      return next;
    });
  };

  const fetchPorts = useCallback(async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const res: ScanResult = await api.getPorts();
      setPorts(res.ports || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to scan ports');
    } finally {
      if (isManual) setLoading(false);
    }
  }, []);

  // Polling setup
  useEffect(() => {
    fetchPorts(true);

    if (refreshInterval > 0) {
      pollTimerRef.current = setInterval(() => {
        fetchPorts(false);
      }, refreshInterval);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchPorts, refreshInterval]);

  // Kill single port / pid
  const killPort = async (port: number, pid?: number) => {
    if (pid) {
      setTerminatingPids((prev) => new Set(prev).add(pid));
    }

    try {
      const res = await api.killPort(port);
      if (res.success) {
        addToast('success', `Port ${port} released`, pid ? `Terminated process PID ${pid}` : undefined);
      } else {
        addToast('error', `Failed to release port ${port}`, res.error || res.message);
      }
    } catch (e: any) {
      addToast('error', `Error terminating port ${port}`, e.message);
    } finally {
      if (pid) {
        setTerminatingPids((prev) => {
          const next = new Set(prev);
          next.delete(pid);
          return next;
        });
      }
      await fetchPorts(false);
    }
  };

  // Kill process tree by PID
  const killPid = async (pid: number) => {
    setTerminatingPids((prev) => new Set(prev).add(pid));
    try {
      const res = await api.killPid(pid);
      if (res.success) {
        addToast('success', `PID ${pid} terminated`, 'Process tree forcefully ended');
      } else {
        addToast('error', `Failed to terminate PID ${pid}`, res.error || res.message);
      }
    } catch (e: any) {
      addToast('error', `Error terminating PID ${pid}`, e.message);
    } finally {
      setTerminatingPids((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
      await fetchPorts(false);
    }
  };

  // Kill All Dev Ports
  const killAllDevPorts = async () => {
    const devItems = ports.filter((p) => p.isDevServer && !p.isSystem);
    if (devItems.length === 0) {
      addToast('info', 'No active dev ports', 'There are no active development servers listening.');
      return;
    }

    const pidsToKill = Array.from(new Set(devItems.map((p) => p.pid)));
    setTerminatingPids(new Set(pidsToKill));

    try {
      const results = await api.killManyPids(pidsToKill);
      const successCount = results.filter((r) => r.success).length;

      addToast(
        'success',
        `Terminated ${successCount} process${successCount === 1 ? '' : 'es'}`,
        `All dev port bindings cleared.`
      );
    } catch (e: any) {
      addToast('error', 'Batch termination failed', e.message);
    } finally {
      setTerminatingPids(new Set());
      await fetchPorts(false);
    }
  };

  return {
    ports,
    loading,
    error,
    terminatingPids,
    toasts,
    safeMode,
    refreshInterval,
    setRefreshInterval,
    toggleSafeMode,
    refresh: () => fetchPorts(true),
    killPort,
    killPid,
    killAllDevPorts,
    dismissToast
  };
}

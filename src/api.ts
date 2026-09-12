import { KillResult, PortItem, ScanResult } from './types';

declare global {
  interface Window {
    winpmanager?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getPorts: () => Promise<ScanResult>;
      killPort: (port: number) => Promise<KillResult>;
      killPid: (pid: number) => Promise<KillResult>;
      killManyPids: (pids: number[]) => Promise<KillResult[]>;
      openExternal: (url: string) => Promise<boolean>;
      openFolder: (path: string) => Promise<boolean>;
      copyText: (text: string) => Promise<boolean>;
      isElectron?: boolean;
    };
  }
}

const API_BASE = 'http://127.0.0.1:5198/api';

export const isElectron = Boolean(window.winpmanager?.isElectron);

export const api = {
  getPorts: async (): Promise<ScanResult> => {
    if (window.winpmanager?.getPorts) {
      return await window.winpmanager.getPorts();
    }
    const res = await fetch(`${API_BASE}/ports`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  },

  killPort: async (port: number): Promise<KillResult> => {
    if (window.winpmanager?.killPort) {
      return await window.winpmanager.killPort(port);
    }
    const res = await fetch(`${API_BASE}/kill-port`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port })
    });
    return await res.json();
  },

  killPid: async (pid: number): Promise<KillResult> => {
    if (window.winpmanager?.killPid) {
      return await window.winpmanager.killPid(pid);
    }
    const res = await fetch(`${API_BASE}/kill-pid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pid })
    });
    return await res.json();
  },

  killManyPids: async (pids: number[]): Promise<KillResult[]> => {
    if (window.winpmanager?.killManyPids) {
      return await window.winpmanager.killManyPids(pids);
    }
    const res = await fetch(`${API_BASE}/kill-many`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pids })
    });
    return await res.json();
  },

  openUrl: async (url: string) => {
    if (window.winpmanager?.openExternal) {
      return await window.winpmanager.openExternal(url);
    }
    window.open(url, '_blank');
  },

  openFolder: async (folderPath: string) => {
    if (window.winpmanager?.openFolder) {
      return await window.winpmanager.openFolder(folderPath);
    }
    console.log('Open folder request:', folderPath);
  },

  copyText: async (text: string) => {
    if (window.winpmanager?.copyText) {
      return await window.winpmanager.copyText(text);
    }
    await navigator.clipboard.writeText(text);
  },

  minimizeWindow: () => {
    if (window.winpmanager?.minimize) window.winpmanager.minimize();
  },

  maximizeWindow: () => {
    if (window.winpmanager?.maximize) window.winpmanager.maximize();
  },

  closeWindow: () => {
    if (window.winpmanager?.close) window.winpmanager.close();
  }
};

export type ProcessCategory = 'dev' | 'database' | 'tool' | 'user' | 'system';

export interface PortItem {
  id: string; // unique key `${port}-${pid}`
  port: number;
  pid: number;
  processName: string;
  category: ProcessCategory;
  framework: string | null;
  frameworkIcon?: string;
  projectName: string | null;
  projectPath: string | null;
  commandLine: string;
  executablePath: string;
  parentPid: number;
  parentName: string | null;
  memoryBytes: number;
  memoryFormatted: string;
  createdAt: string | null;
  uptimeFormatted: string | null;
  addresses: string;
  protocol: string;
  isSystem: boolean;
  isDevServer: boolean;
  confidence: number; // 0 - 100
  url: string;
  isTerminating?: boolean;
}

export interface ScanResult {
  timestamp: number;
  ports: PortItem[];
  totalListening: number;
  devPortsCount: number;
  systemPortsCount: number;
  memoryTotalDevBytes: number;
}

export interface KillResult {
  success: boolean;
  port?: number;
  pid?: number;
  message?: string;
  error?: string;
}

export interface WatchlistPort {
  port: number;
  label: string;
  expectedFramework?: string;
}

export type ViewMode = 'cards' | 'table';
export type FilterTab = 'all-dev' | 'web' | 'python-rust' | 'databases' | 'all';

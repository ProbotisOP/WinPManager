const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cache to store process details across frequent netstat calls
// Key: pid, Value: process info object + timestamp
const processDetailsCache = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds cache for static process info

// System executables to classify as system
const SYSTEM_PROCESS_NAMES = new Set([
  'system',
  'services.exe',
  'svchost.exe',
  'lsass.exe',
  'csrss.exe',
  'wininit.exe',
  'spoolsv.exe',
  'dwm.exe',
  'smss.exe',
  'winlogon.exe',
  'fontdrvhost.exe',
  'searchhost.exe',
  'shellexperiencehost.exe',
  'explorer.exe',
  'dashost.exe',
  'securityhealthservice.exe',
  'wlanext.exe',
  'sihost.exe',
  'ctfmon.exe',
  'smartscreen.exe',
  'runtimebroker.exe',
  'taskhostw.exe',
  'registry',
  'conhost.exe'
]);

// Developer runtime executable names (case-insensitive)
const DEV_RUNTIMES = [
  { match: /^(node|nodejs|npm|npx|yarn|pnpm|bun|deno)(\.exe)?$/i, runtime: 'Node / JS' },
  { match: /^(python|python3|py|uv|pypy)(\.exe)?$/i, runtime: 'Python' },
  { match: /^(go)(\.exe)?$/i, runtime: 'Go' },
  { match: /^(cargo|rustc)(\.exe)?$/i, runtime: 'Rust' },
  { match: /^(ruby)(\.exe)?$/i, runtime: 'Ruby' },
  { match: /^(php)(\.exe)?$/i, runtime: 'PHP' },
  { match: /^(dotnet)(\.exe)?$/i, runtime: '.NET' },
  { match: /^(java|javaw)(\.exe)?$/i, runtime: 'Java' },
  { match: /^(docker-proxy|com\.docker\.backend)(\.exe)?$/i, runtime: 'Docker' },
  { match: /^(mysqld|mariadbd)(\.exe)?$/i, runtime: 'MySQL' },
  { match: /^(postgres)(\.exe)?$/i, runtime: 'PostgreSQL' },
  { match: /^(redis-server)(\.exe)?$/i, runtime: 'Redis' },
  { match: /^(mongod)(\.exe)?$/i, runtime: 'MongoDB' },
  { match: /^(ngrok|cloudflared|localtunnel)(\.exe)?$/i, runtime: 'Tunnel' },
  { match: /^(mailpit|mailhog)(\.exe)?$/i, runtime: 'Mail Tool' }
];

/**
 * Intelligent Framework & Project Detector
 */
function analyzeProcess(proc) {
  const name = (proc.processName || '').toLowerCase();
  const cmd = (proc.commandLine || '').toLowerCase();
  const exe = (proc.executablePath || '').toLowerCase();
  const pid = proc.pid;

  let category = 'user';
  let framework = null;
  let projectName = null;
  let projectPath = null;
  let confidence = 50;
  let isSystem = false;

  // 1. Check if Windows System Process
  if (pid <= 4 || SYSTEM_PROCESS_NAMES.has(name)) {
    isSystem = true;
    category = 'system';
    confidence = 0;
  } else if (exe.includes('\\windows\\system32') || exe.includes('\\windows\\syswow64')) {
    // If running from Windows System32 without any dev arguments
    const hasDevTerms = /(node|python|vite|next|npm|docker|git)/i.test(cmd);
    if (!hasDevTerms) {
      isSystem = true;
      category = 'system';
      confidence = 5;
    }
  }

  // 2. Database Detection
  if (/mysqld|mariadbd/i.test(name)) {
    category = 'database';
    framework = 'MySQL';
    confidence = 95;
  } else if (/postgres/i.test(name)) {
    category = 'database';
    framework = 'PostgreSQL';
    confidence = 95;
  } else if (/redis-server/i.test(name)) {
    category = 'database';
    framework = 'Redis';
    confidence = 95;
  } else if (/mongod/i.test(name)) {
    category = 'database';
    framework = 'MongoDB';
    confidence = 95;
  } else if (/docker-proxy/i.test(name) || /docker/i.test(name)) {
    category = 'database';
    framework = 'Docker Container';
    confidence = 90;
  }

  // 3. Dev Tools & Tunnels
  if (/ngrok/i.test(name)) {
    category = 'tool';
    framework = 'ngrok Tunnel';
    confidence = 90;
  } else if (/cloudflared/i.test(name)) {
    category = 'tool';
    framework = 'Cloudflare Tunnel';
    confidence = 90;
  }

  // 4. Web & App Frameworks Detection via CommandLine & Name
  if (!isSystem && category !== 'database') {
    // Framework signatures
    if (cmd.includes('vite') || cmd.includes('@vitejs')) {
      category = 'dev';
      framework = 'Vite';
      confidence = 100;
    } else if (cmd.includes('next dev') || cmd.includes('next start') || cmd.includes('next\\dist\\bin')) {
      category = 'dev';
      framework = 'Next.js';
      confidence = 100;
    } else if (cmd.includes('react-scripts') || cmd.includes('craco')) {
      category = 'dev';
      framework = 'React';
      confidence = 100;
    } else if (cmd.includes('nuxt')) {
      category = 'dev';
      framework = 'Nuxt';
      confidence = 100;
    } else if (cmd.includes('astro')) {
      category = 'dev';
      framework = 'Astro';
      confidence = 100;
    } else if (cmd.includes('svelte') || cmd.includes('svelte-kit')) {
      category = 'dev';
      framework = 'SvelteKit';
      confidence = 100;
    } else if (cmd.includes('remix')) {
      category = 'dev';
      framework = 'Remix';
      confidence = 100;
    } else if (cmd.includes('nest') && (cmd.includes('start') || cmd.includes('nest-cli'))) {
      category = 'dev';
      framework = 'NestJS';
      confidence = 100;
    } else if (cmd.includes('ts-node') || cmd.includes('tsx') || cmd.includes('tsc-watch')) {
      category = 'dev';
      framework = 'TypeScript';
      confidence = 98;
    } else if (cmd.includes('nodemon')) {
      category = 'dev';
      framework = 'Nodemon';
      confidence = 98;
    } else if (cmd.includes('express') || cmd.includes('fastify') || cmd.includes('koa')) {
      category = 'dev';
      framework = 'Node.js API';
      confidence = 95;
    } else if (cmd.includes('webpack')) {
      category = 'dev';
      framework = 'Webpack';
      confidence = 95;
    } else if (cmd.includes('uvicorn')) {
      category = 'dev';
      framework = 'FastAPI';
      confidence = 100;
    } else if (cmd.includes('manage.py runserver') || cmd.includes('django')) {
      category = 'dev';
      framework = 'Django';
      confidence = 100;
    } else if (cmd.includes('flask run') || cmd.includes('flask')) {
      category = 'dev';
      framework = 'Flask';
      confidence = 100;
    } else if (cmd.includes('streamlit')) {
      category = 'dev';
      framework = 'Streamlit';
      confidence = 100;
    } else if (cmd.includes('gradio')) {
      category = 'dev';
      framework = 'Gradio';
      confidence = 100;
    } else if (cmd.includes('cargo run') || cmd.includes('\\target\\debug\\')) {
      category = 'dev';
      framework = 'Rust';
      confidence = 95;
    } else if (cmd.includes('go run') || cmd.includes('air')) {
      category = 'dev';
      framework = 'Go';
      confidence = 95;
    } else if (name.includes('bun')) {
      category = 'dev';
      framework = 'Bun';
      confidence = 95;
    } else if (name.includes('deno')) {
      category = 'dev';
      framework = 'Deno';
      confidence = 95;
    } else if (name.includes('node')) {
      category = 'dev';
      framework = 'Node.js';
      confidence = 90;
    } else if (name.includes('python')) {
      category = 'dev';
      framework = 'Python';
      confidence = 85;
    } else if (name.includes('dotnet')) {
      category = 'dev';
      framework = '.NET';
      confidence = 85;
    } else if (name.includes('java')) {
      if (cmd.includes('spring') || cmd.includes('boot')) {
        category = 'dev';
        framework = 'Spring Boot';
        confidence = 95;
      } else {
        category = 'dev';
        framework = 'Java';
        confidence = 75;
      }
    }
  }

  // 5. Intelligent Project Path and Project Name Extraction
  // Look for directory paths in the command line (e.g. C:\Users\...\my-project\node_modules\...)
  if (proc.commandLine) {
    // Match common project paths
    const pathRegex = /([a-zA-Z]:\\[^\s"']+)/g;
    const matches = proc.commandLine.match(pathRegex) || [];
    for (const rawPath of matches) {
      // If path contains node_modules, take parent directory
      if (rawPath.toLowerCase().includes('node_modules')) {
        const parts = rawPath.split(/node_modules/i);
        const folder = parts[0].replace(/\\+$/, '');
        if (folder && fs.existsSync(folder)) {
          projectPath = folder;
          projectName = path.basename(folder);
          break;
        }
      }
      // If path is a JS/TS/Py file inside user directory
      if (/\.(js|ts|jsx|tsx|py|go|rs|json)$/i.test(rawPath)) {
        const dir = path.dirname(rawPath);
        if (dir && dir.toLowerCase().includes('users') && fs.existsSync(dir)) {
          projectPath = dir;
          projectName = path.basename(dir);
          break;
        }
      }
    }
  }

  // Fallback: If no project folder found from args, check executable path if it's in Users
  if (!projectName && proc.executablePath && proc.executablePath.toLowerCase().includes('users')) {
    const parentDir = path.dirname(proc.executablePath);
    if (!parentDir.toLowerCase().includes('appdata') && !parentDir.toLowerCase().includes('programs')) {
      projectName = path.basename(parentDir);
      projectPath = parentDir;
    }
  }

  const isDevServer = category === 'dev' || category === 'database' || category === 'tool';

  return {
    category,
    framework,
    projectName,
    projectPath,
    confidence,
    isSystem,
    isDevServer
  };
}

/**
 * Format bytes into human readable string
 */
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * Calculate human-readable uptime
 */
function formatUptime(createdAtStr) {
  if (!createdAtStr) return null;
  try {
    let startMs = 0;
    const wmiMatch = String(createdAtStr).match(/\/Date\((\d+)\)\//);
    if (wmiMatch) {
      startMs = parseInt(wmiMatch[1], 10);
    } else {
      startMs = new Date(createdAtStr).getTime();
    }
    if (isNaN(startMs) || startMs <= 0) return null;
    const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m ${diffSec % 60}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  } catch (e) {
    return null;
  }
}

/**
 * Query listening TCP connections using netstat (runs in ~100ms)
 */
function getNetstatConnections() {
  return new Promise((resolve) => {
    exec('netstat -ano -p tcp', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve([]);
      }
      const lines = stdout.split('\r\n');
      const connections = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('TCP')) continue;

        // Split by whitespace
        const parts = line.split(/\s+/);
        if (parts.length >= 5) {
          const proto = parts[0];
          const localAddress = parts[1];
          const foreignAddress = parts[2];
          const state = parts[3];
          const pid = parseInt(parts[4], 10);

          if (state === 'LISTENING' && !isNaN(pid) && pid > 0) {
            // Extract port from localAddress (e.g. 127.0.0.1:3000 or [::]:5173 or *:80)
            const lastColon = localAddress.lastIndexOf(':');
            if (lastColon !== -1) {
              const addr = localAddress.substring(0, lastColon);
              const port = parseInt(localAddress.substring(lastColon + 1), 10);
              if (!isNaN(port)) {
                connections.push({
                  port,
                  pid,
                  address: addr,
                  protocol: proto
                });
              }
            }
          }
        }
      }
      resolve(connections);
    });
  });
}

/**
 * Fetch process details (Name, CommandLine, ExecutablePath, WorkingSet, ParentPID)
 * for a list of PIDs using PowerShell Win32_Process
 */
function fetchProcessDetailsForPids(pids) {
  if (pids.length === 0) return Promise.resolve(new Map());

  return new Promise((resolve) => {
    // Check which PIDs need querying vs cached
    const now = Date.now();
    const neededPids = [];
    const resultMap = new Map();

    for (const pid of pids) {
      if (processDetailsCache.has(pid)) {
        const cached = processDetailsCache.get(pid);
        if (now - cached.cachedAt < CACHE_TTL_MS) {
          resultMap.set(pid, cached.data);
          continue;
        }
      }
      neededPids.push(pid);
    }

    if (neededPids.length === 0) {
      return resolve(resultMap);
    }

    // Query needed PIDs via PowerShell
    const pidListStr = neededPids.join(',');
    const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$pids = @(${pidListStr})
$filter = ($pids | ForEach-Object { "ProcessId = $_" }) -join " or "
if ($filter) {
  Get-CimInstance Win32_Process -Filter $filter -Property ProcessId, Name, ExecutablePath, CommandLine, ParentProcessId, WorkingSetSize, CreationDate | Select-Object ProcessId, Name, ExecutablePath, CommandLine, ParentProcessId, WorkingSetSize, CreationDate | ConvertTo-Json -Depth 2 -Compress
} else {
  "[]"
}
`;

    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
      maxBuffer: 10 * 1024 * 1024
    }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        try {
          let parsed = JSON.parse(stdout.trim());
          if (!Array.isArray(parsed)) {
            parsed = [parsed];
          }
          for (const item of parsed) {
            if (item && item.ProcessId) {
              const pid = item.ProcessId;
              const data = {
                processName: item.Name || 'Unknown',
                executablePath: item.ExecutablePath || '',
                commandLine: item.CommandLine || '',
                parentPid: item.ParentProcessId || 0,
                memoryBytes: item.WorkingSetSize ? Number(item.WorkingSetSize) : 0,
                createdAt: item.CreationDate || ''
              };
              processDetailsCache.set(pid, { data, cachedAt: now });
              resultMap.set(pid, data);
            }
          }
        } catch (parseErr) {
          // If JSON parse fails, continue with whatever we have
        }
      }

      // Fill in fallback for any PIDs that couldn't be retrieved (e.g. permission denied or exited)
      for (const pid of neededPids) {
        if (!resultMap.has(pid)) {
          const fallback = {
            processName: `PID ${pid}`,
            executablePath: '',
            commandLine: '',
            parentPid: 0,
            memoryBytes: 0,
            createdAt: ''
          };
          resultMap.set(pid, fallback);
        }
      }

      resolve(resultMap);
    });
  });
}

/**
 * Scan all active ports on the system with intelligent analysis
 */
async function scanPorts() {
  const connections = await getNetstatConnections();
  if (connections.length === 0) {
    return {
      timestamp: Date.now(),
      ports: [],
      totalListening: 0,
      devPortsCount: 0,
      systemPortsCount: 0,
      memoryTotalDevBytes: 0
    };
  }

  // Deduplicate and group by port + pid
  const portPidMap = new Map();
  for (const conn of connections) {
    const key = `${conn.port}-${conn.pid}`;
    if (!portPidMap.has(key)) {
      portPidMap.set(key, {
        port: conn.port,
        pid: conn.pid,
        addresses: [conn.address],
        protocol: conn.protocol
      });
    } else {
      const existing = portPidMap.get(key);
      if (!existing.addresses.includes(conn.address)) {
        existing.addresses.push(conn.address);
      }
    }
  }

  // Extract unique PIDs
  const uniquePids = Array.from(new Set(Array.from(portPidMap.values()).map(x => x.pid)));

  // Fetch process details
  const procDetailsMap = await fetchProcessDetailsForPids(uniquePids);

  // Clean cache of dead PIDs occasionally
  if (processDetailsCache.size > 200) {
    const currentPidSet = new Set(uniquePids);
    for (const cachedPid of processDetailsCache.keys()) {
      if (!currentPidSet.has(cachedPid)) {
        processDetailsCache.delete(cachedPid);
      }
    }
  }

  const items = [];
  let devPortsCount = 0;
  let systemPortsCount = 0;
  let memoryTotalDevBytes = 0;

  for (const group of portPidMap.values()) {
    const procInfo = procDetailsMap.get(group.pid) || {
      processName: 'Unknown',
      executablePath: '',
      commandLine: '',
      parentPid: 0,
      memoryBytes: 0,
      createdAt: ''
    };

    const analysis = analyzeProcess({
      port: group.port,
      pid: group.pid,
      processName: procInfo.processName,
      commandLine: procInfo.commandLine,
      executablePath: procInfo.executablePath
    });

    const isLocalhost = group.addresses.some(a => a === '127.0.0.1' || a === '0.0.0.0' || a === '::' || a === '::1');
    const url = `http://localhost:${group.port}`;

    if (analysis.isDevServer) {
      devPortsCount++;
      memoryTotalDevBytes += procInfo.memoryBytes;
    } else if (analysis.isSystem) {
      systemPortsCount++;
    }

    items.push({
      id: `${group.port}-${group.pid}`,
      port: group.port,
      pid: group.pid,
      processName: procInfo.processName,
      category: analysis.category,
      framework: analysis.framework,
      projectName: analysis.projectName,
      projectPath: analysis.projectPath,
      commandLine: procInfo.commandLine,
      executablePath: procInfo.executablePath,
      parentPid: procInfo.parentPid,
      parentName: null,
      memoryBytes: procInfo.memoryBytes,
      memoryFormatted: formatBytes(procInfo.memoryBytes),
      createdAt: procInfo.createdAt,
      uptimeFormatted: formatUptime(procInfo.createdAt),
      addresses: group.addresses.join(', '),
      protocol: group.protocol,
      isSystem: analysis.isSystem,
      isDevServer: analysis.isDevServer,
      confidence: analysis.confidence,
      url
    });
  }

  // Sort: Dev servers first, then sorted by port number
  items.sort((a, b) => {
    if (a.isDevServer && !b.isDevServer) return -1;
    if (!a.isDevServer && b.isDevServer) return 1;
    return a.port - b.port;
  });

  return {
    timestamp: Date.now(),
    ports: items,
    totalListening: items.length,
    devPortsCount,
    systemPortsCount,
    memoryTotalDevBytes
  };
}

/**
 * Kill process and its entire child process tree on Windows using taskkill /F /T /PID
 */
function killProcessTree(pid) {
  return new Promise((resolve) => {
    if (!pid || pid <= 4) {
      return resolve({ success: false, error: 'Cannot terminate system core process.' });
    }

    // Use taskkill /F /T /PID to wipe out the entire process tree (node + cmd + esbuild etc)
    exec(`taskkill /F /T /PID ${pid}`, (err, stdout, stderr) => {
      if (err) {
        // Try fallback with Stop-Process via PowerShell
        exec(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force"`, (err2) => {
          if (err2) {
            return resolve({
              success: false,
              pid,
              error: stderr || err.message || 'Failed to terminate process.'
            });
          }
          // Remove from cache
          processDetailsCache.delete(pid);
          resolve({ success: true, pid, message: `Process ${pid} terminated via PowerShell.` });
        });
        return;
      }
      // Remove from cache
      processDetailsCache.delete(pid);
      resolve({ success: true, pid, message: stdout.trim() });
    });
  });
}

/**
 * Kill whatever process is holding a specific port
 */
async function killPort(port) {
  const result = await scanPorts();
  const matched = result.ports.filter(p => p.port === port);

  if (matched.length === 0) {
    return { success: false, port, error: `No process found listening on port ${port}.` };
  }

  const killResults = [];
  for (const item of matched) {
    const res = await killProcessTree(item.pid);
    killResults.push({ port, pid: item.pid, ...res });
  }

  const allSuccess = killResults.every(r => r.success);
  return {
    success: allSuccess,
    port,
    details: killResults,
    message: allSuccess ? `Port ${port} successfully released.` : `Failed to fully release port ${port}.`
  };
}

/**
 * Kill a list of PIDs in batch
 */
async function killManyPids(pids) {
  const results = [];
  for (const pid of pids) {
    const res = await killProcessTree(pid);
    results.push({ pid, ...res });
  }
  return results;
}

module.exports = {
  scanPorts,
  killProcessTree,
  killPort,
  killManyPids
};

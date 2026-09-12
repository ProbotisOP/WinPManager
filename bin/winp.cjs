#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const portEngine = require('../electron/portEngine.cjs');

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[1m\x1b[36mWinPManager CLI\x1b[0m - Rapid Port Terminator for Windows
Developed by ProbotisOP (https://github.com/ProbotisOP)

\x1b[1mUsage:\x1b[0m
  winp <port>              Immediately kill the process tree holding <port>
  winp kill <port>         Explicit kill command
  winp list                List all active development ports
  winp run <cmd...>        Run a dev command and intercept EADDRINUSE errors
  winp sentinel            Start the background conflict watchdog microservice

\x1b[1mExamples:\x1b[0m
  winp 3000
  winp 5173
  winp run npm run dev
`);
  process.exit(0);
}

const command = args[0];

// 1. winp sentinel: starts the background microservice
if (command === 'sentinel') {
  require('../microservice/sentinel.cjs');
  return;
}

// 2. winp list: lists all dev ports
if (command === 'list') {
  portEngine.scanPorts().then((res) => {
    const dev = res.ports.filter(p => p.isDevServer);
    if (dev.length === 0) {
      console.log('\x1b[32m✔ No active developer ports listening.\x1b[0m');
      return;
    }
    console.log(`\n\x1b[1mActive Developer Ports (${dev.length}):\x1b[0m`);
    console.log('─'.repeat(65));
    dev.forEach((p) => {
      console.log(`  \x1b[36m:${p.port}\x1b[0m \t \x1b[33m${(p.framework || 'Dev').padEnd(12)}\x1b[0m PID: ${String(p.pid).padEnd(6)} ${p.processName} (${p.memoryFormatted})`);
    });
    console.log('─'.repeat(65));
  });
  return;
}

// 3. winp run <cmd...>: runs command and auto-intercepts EADDRINUSE
if (command === 'run') {
  const subCmd = args.slice(1);
  if (subCmd.length === 0) {
    console.error('Error: specify a command to run, e.g. winp run npm run dev');
    process.exit(1);
  }

  const child = spawn(subCmd[0], subCmd.slice(1), {
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.pipe(process.stdout);

  let stderrBuffer = '';
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    stderrBuffer += data.toString();

    // Check for EADDRINUSE
    if (/EADDRINUSE|address already in use/i.test(stderrBuffer)) {
      const match = stderrBuffer.match(/:(\d{2,5})/);
      const port = match ? parseInt(match[1], 10) : null;
      if (port) {
        // Trigger Sentinel
        const { showConflictPopup } = require('../microservice/popup.cjs');
        portEngine.scanPorts().then(async (scan) => {
          const found = scan.ports.find(p => p.port === port);
          const shouldKill = await showConflictPopup(port, found);
          if (shouldKill) {
            await portEngine.killPort(port);
            console.log(`\n\x1b[32m✔ Terminated blocking process. Port ${port} is now free.\x1b[0m`);
          }
        });
      }
    }
  });

  child.on('exit', (code) => process.exit(code || 0));
  return;
}

// 4. winp <port> or winp kill <port>: instant kill
const portNum = parseInt(command === 'kill' ? args[1] : command, 10);

if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
  console.error(`\x1b[31mError: "${command}" is not a valid port number.\x1b[0m`);
  process.exit(1);
}

console.log(`\x1b[33mInspecting and killing port ${portNum}...\x1b[0m`);
portEngine.killPort(portNum).then((res) => {
  if (res.success) {
    console.log(`\x1b[32m✔ Successfully terminated process tree holding port ${portNum}.\x1b[0m`);
  } else {
    console.log(`\x1b[31m✖ ${res.error || res.message}\x1b[0m`);
  }
});

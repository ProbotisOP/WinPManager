const http = require('http');
const portEngine = require('../electron/portEngine.cjs');
const { showConflictPopup } = require('./popup.cjs');

const SENTINEL_PORT = 5197;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// In-memory debounce to prevent popup spam if multiple requests arrive within 3 seconds
const recentPrompts = new Set();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'active',
      service: 'WinPManager Sentinel Microservice',
      uptimeSec: Math.floor(process.uptime()),
      memoryBytes: process.memoryUsage().rss
    }));
  }

  // Conflict report endpoint (triggered by terminal / PowerShell / CLI when EADDRINUSE happens)
  if (url.pathname === '/conflict' && req.method === 'POST') {
    const body = await parseBody(req);
    const port = Number(body.port);

    if (!port || isNaN(port)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Valid port number required' }));
    }

    // Check debounce
    if (recentPrompts.has(port)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'already_prompting', port }));
    }

    recentPrompts.add(port);
    setTimeout(() => recentPrompts.delete(port), 4000);

    // Scan to find the culprit process
    const scan = await portEngine.scanPorts();
    const matched = scan.ports.find((p) => p.port === port);

    // Show native popup asking the user if they want to kill the port
    const userWantsToKill = await showConflictPopup(port, matched);

    if (userWantsToKill) {
      const killRes = await portEngine.killPort(port);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        action: 'killed',
        port,
        success: killRes.success,
        message: killRes.message
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        action: 'ignored',
        port
      }));
    }
  }

  // Direct kill endpoint
  if (url.pathname === '/kill' && req.method === 'POST') {
    const body = await parseBody(req);
    const port = Number(body.port);
    if (!port) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Port required' }));
    }
    const killRes = await portEngine.killPort(port);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(killRes));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(SENTINEL_PORT, '127.0.0.1', () => {
  console.log(`⚡ WinPManager Sentinel Microservice active on http://127.0.0.1:${SENTINEL_PORT}`);
});

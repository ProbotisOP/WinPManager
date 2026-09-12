const http = require('http');
const path = require('path');
const fs = require('fs');
const portEngine = require('./electron/portEngine.cjs');

const PORT = 5198;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/ports' && req.method === 'GET') {
    try {
      const data = await portEngine.scanPorts();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (url.pathname === '/api/kill-port' && req.method === 'POST') {
    const body = await parseBody(req);
    const port = Number(body.port);
    if (!port) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Port required' }));
    }
    const result = await portEngine.killPort(port);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  }

  if (url.pathname === '/api/kill-pid' && req.method === 'POST') {
    const body = await parseBody(req);
    const pid = Number(body.pid);
    if (!pid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'PID required' }));
    }
    const result = await portEngine.killProcessTree(pid);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  }

  if (url.pathname === '/api/kill-many' && req.method === 'POST') {
    const body = await parseBody(req);
    const pids = Array.isArray(body.pids) ? body.pids : [];
    const results = await portEngine.killManyPids(pids);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(results));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`WinPManager API Server running at http://127.0.0.1:${PORT}`);
});

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, 'data/family.json');
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT || 3001;

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const exampleFile = path.resolve(dir, 'family.example.json');
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, DATA_FILE);
    } else {
      const initialData = {
        meta: {
          title: "My Family Genealogy",
          lastUpdated: new Date().toISOString(),
          description: "Family tree records"
        },
        persons: [],
        relationships: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }
}
ensureDataFile();

const sseClients = new Set();
fs.watchFile(DATA_FILE, { interval: 500 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const json = JSON.parse(content);
      const payload = `data: ${JSON.stringify({ type: 'file_change', data: json })}\n\n`;
      sseClients.forEach(res => {
        try { res.write(payload); } catch { sseClients.delete(res); }
      });
    } catch (err) {
      console.error('Watch error:', err);
    }
  }
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: SSE Stream
  if (req.url === '/api/family/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // API: Get Family Data
  if (req.url === '/api/family' && req.method === 'GET') {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Update Family Data
  if (req.url === '/api/family' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (!parsed.meta) parsed.meta = {};
        parsed.meta.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: parsed }));

        const payload = `data: ${JSON.stringify({ type: 'save_complete', data: parsed })}\n\n`;
        sseClients.forEach(client => {
          try { client.write(payload); } catch { sseClients.delete(client); }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files from dist if built
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Please run npm run dev for frontend development or npm run build first.');
  }
});

server.listen(PORT, () => {
  console.log(`Genealogy server running on http://localhost:${PORT}`);
});

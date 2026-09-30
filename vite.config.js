import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, 'data/family.json');

// Ensure data folder and default file exist
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

function familyApiPlugin() {
  ensureDataFile();
  const sseClients = new Set();

  // Watch data file for manual changes
  fs.watchFile(DATA_FILE, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const json = JSON.parse(content);
        const payload = `data: ${JSON.stringify({ type: 'file_change', data: json })}\n\n`;
        sseClients.forEach(res => {
          try {
            res.write(payload);
          } catch {
            sseClients.delete(res);
          }
        });
      } catch (err) {
        console.error('Error watching family.json:', err);
      }
    }
  });

  return {
    name: 'vite-family-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // SSE endpoint for live file edits
        if (req.url === '/api/family/stream' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // GET /api/family
        if (req.url === '/api/family' && req.method === 'GET') {
          try {
            ensureDataFile();
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }

        // POST /api/family (write entire database)
        if (req.url === '/api/family' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (!parsed.meta) parsed.meta = {};
              parsed.meta.lastUpdated = new Date().toISOString();
              fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ success: true, data: parsed }));

              // Notify SSE clients
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

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    familyApiPlugin()
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/data/**',
        '**/data/family.json',
        '**/data/*.json'
      ]
    }
  }
});

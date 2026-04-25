import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';
import { createContext } from './context';
import { initSchema } from './lib/duckdb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function boot() {
  console.log('Initializing DuckDB schema...');
  await initSchema();
  console.log('DuckDB ready');

  const app = new Hono();
  app.use(cors({ origin: '*' }));

  app.use('/trpc/*', async (c) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Serve static files from dist/ for production
  const distPath = path.resolve(__dirname, '../dist');
  app.get('*', async (c) => {
    const url = new URL(c.req.url);
    let reqPath = decodeURIComponent(url.pathname);
    if (reqPath === '/') reqPath = '/index.html';
    
    let filePath = path.join(distPath, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      c.header('Content-Type', contentType);
      return c.body(content);
    }
    
    return c.notFound();
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  serve({ fetch: app.fetch, port });
  console.log(`Server running at http://localhost:${port}`);
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  process.exit(1);
});

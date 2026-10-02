/**
 * ARCADIA SYSTEM - FOUNDATION SERVER ENTRYPOINT
 * Implements Secure Modular Monolith pattern (Express 4 + Vite Middleware)
 */

import express from 'express';
import path from 'path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { correlationAndAuthMiddleware } from './src/server/auth.ts';
import { storage } from './src/server/storage.ts';

// Load local .env if present (no-op when real env vars are injected,
// e.g. AI Studio secrets — dotenv never overrides existing values).
dotenv.config();

// ---------------------------------------------------------------------------
// File persistence: the in-memory store is snapshotted to disk periodically
// and on shutdown, and restored on boot when a snapshot exists.
// NOTE: on Cloud Run the filesystem is ephemeral per instance, so this
// protects against process restarts, not instance replacement. A managed
// database remains the right choice for production-critical data.
// ---------------------------------------------------------------------------
const DATA_FILE = process.env.ARCADIA_DATA_FILE || path.join(process.cwd(), 'arcadia-data.json');

function persistState(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(storage.toJSON()));
  } catch (err) {
    console.error(`[STORAGE] Failed to persist state to ${DATA_FILE}:`, (err as Error)?.message || err);
  }
}

function restoreState(): void {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    storage.loadJSON(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Record<string, unknown>);
    console.log(`[STORAGE] Restored persisted state from ${DATA_FILE}.`);
  } catch (err) {
    console.error(`[STORAGE] Failed to restore ${DATA_FILE} — starting from seed data:`, (err as Error)?.message || err);
  }
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const app = express();

  // Restore persisted state before serving any requests.
  restoreState();

  // Persist every 60s and on graceful shutdown.
  const persistTimer = setInterval(persistState, 60_000);
  persistTimer.unref?.();
  const shutdown = (signal: string) => {
    console.log(`[ARCADIA] Received ${signal} — persisting state and exiting.`);
    persistState();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Core Request Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Attach Correlation and Auth Context to every incoming request
  app.use(correlationAndAuthMiddleware);

  // Mount API Domain Routes First
  app.use('/api', apiRouter);

  // Development vs. Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const correlationId = (req as any).correlationId || 'unknown';
    console.error(`[ERROR] [${correlationId}]`, err);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Traced via correlation ID.',
      correlationId
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`[ARCADIA] Foundation Core running at http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FATAL] Failed to start Arcadia server:', err);
  process.exit(1);
});

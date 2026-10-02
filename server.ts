/**
 * ARCADIA SYSTEM - FOUNDATION SERVER ENTRYPOINT
 * Implements Secure Modular Monolith pattern (Express 4 + Vite Middleware)
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { correlationAndAuthMiddleware } from './src/server/auth.ts';
import { storage } from './src/server/storage.ts';
import { createSnapshotStore } from './src/server/snapshotStore.ts';

// Load local .env if present (no-op when real env vars are injected,
// e.g. AI Studio secrets — dotenv never overrides existing values).
dotenv.config();

// ---------------------------------------------------------------------------
// Durable state: the in-memory store is snapshotted through a SnapshotStore
// (Turso when TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set, otherwise a
// local JSON file). Restored on boot, saved every 60s and on shutdown.
// ---------------------------------------------------------------------------
const snapshotStore = createSnapshotStore();

async function restoreState(): Promise<void> {
  const raw = await snapshotStore.load();
  if (!raw) return; // nothing stored yet — keep seed data
  try {
    storage.loadJSON(JSON.parse(raw) as Record<string, unknown>);
    console.log(`[STORAGE] Restored persisted state via ${snapshotStore.name}.`);
  } catch (err) {
    console.error('[STORAGE] Snapshot parse failed — starting from seed data:', (err as Error)?.message || err);
  }
}

function persistState(): void {
  // Fire-and-forget: the store never throws, it logs internally.
  void snapshotStore.save(JSON.stringify(storage.toJSON()));
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const app = express();

  // Restore persisted state before serving any requests.
  await restoreState();

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

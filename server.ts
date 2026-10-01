/**
 * ARCADIA SYSTEM - FOUNDATION SERVER ENTRYPOINT
 * Implements Secure Modular Monolith pattern (Express 4 + Vite Middleware)
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { correlationAndAuthMiddleware } from './src/server/auth.ts';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

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

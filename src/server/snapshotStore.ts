/**
 * ARCADIA SYSTEM - Durable snapshot stores (Node-only; never bundled for the browser).
 *
 * The whole in-memory store is serialized as one JSON snapshot. A SnapshotStore
 * persists that blob durably so state survives Cloud Run instance replacement
 * (the local filesystem alone cannot — it is ephemeral per instance).
 *
 * Backends:
 *  - FileSnapshotStore: local JSON file (dev / single-box deploys).
 *  - TursoSnapshotStore: libSQL/Turso hosted database, one row holding the
 *    snapshot. Needs TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 *
 * Design note: a single JSON blob (rather than 44 relational tables) is a
 * deliberate tradeoff for this app's scale — single operator, low write
 * volume, whole state is ~50-100KB. It keeps the domain engine untouched and
 * makes backup/restore trivial. Last-writer-wins applies if multiple
 * instances ever write concurrently.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface SnapshotStore {
  /** Human-readable backend name for logs. */
  name: string;
  /** Returns the raw JSON snapshot, or null when nothing is stored yet. */
  load(): Promise<string | null>;
  /** Persists the raw JSON snapshot. Must never throw — log and continue. */
  save(json: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Local file backend
// ---------------------------------------------------------------------------
export class FileSnapshotStore implements SnapshotStore {
  readonly name: string;

  constructor(private readonly filePath: string) {
    this.name = `file (${filePath})`;
  }

  async load(): Promise<string | null> {
    try {
      if (!fs.existsSync(this.filePath)) return null;
      return fs.readFileSync(this.filePath, 'utf8');
    } catch (err) {
      console.error(`[STORAGE] File store load failed:`, (err as Error)?.message || err);
      return null;
    }
  }

  async save(json: string): Promise<void> {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, json);
    } catch (err) {
      console.error(`[STORAGE] File store save failed:`, (err as Error)?.message || err);
    }
  }
}

// ---------------------------------------------------------------------------
// Turso (libSQL) backend — one table, one row.
// ---------------------------------------------------------------------------
const TURSO_TABLE = 'arcadia_state';
const TURSO_ROW_ID = 'primary';

export class TursoSnapshotStore implements SnapshotStore {
  readonly name = 'turso';
  private client: any = null;
  private ready: Promise<void> | null = null;

  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async getClient(): Promise<any> {
    if (this.client) return this.client;
    const { createClient } = await import('@libsql/client');
    this.client = createClient({ url: this.url, authToken: this.token });
    return this.client;
  }

  private ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const client = await this.getClient();
        await client.execute(
          `CREATE TABLE IF NOT EXISTS ${TURSO_TABLE} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)`
        );
      })().catch((err) => {
        // Reset so a later attempt retries instead of being stuck.
        this.ready = null;
        throw err;
      });
    }
    return this.ready;
  }

  async load(): Promise<string | null> {
    try {
      await this.ensureReady();
      const client = await this.getClient();
      const rs = await client.execute({
        sql: `SELECT data FROM ${TURSO_TABLE} WHERE id = ?`,
        args: [TURSO_ROW_ID],
      });
      const row = rs.rows?.[0] as any;
      return row?.data ?? null;
    } catch (err) {
      console.error(`[STORAGE] Turso load failed:`, (err as Error)?.message || err);
      return null;
    }
  }

  async save(json: string): Promise<void> {
    try {
      await this.ensureReady();
      const client = await this.getClient();
      await client.execute({
        sql: `INSERT INTO ${TURSO_TABLE} (id, data, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        args: [TURSO_ROW_ID, json, new Date().toISOString()],
      });
    } catch (err) {
      console.error(`[STORAGE] Turso save failed:`, (err as Error)?.message || err);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory: Turso when credentials are present, otherwise local file.
// ---------------------------------------------------------------------------
export function createSnapshotStore(): SnapshotStore {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (url && token) {
    console.log('[STORAGE] Snapshot backend: Turso (durable across instance replacement).');
    return new TursoSnapshotStore(url, token);
  }
  const filePath = process.env.ARCADIA_DATA_FILE || path.join(process.cwd(), 'arcadia-data.json');
  if (!url && !token) {
    console.log(`[STORAGE] Snapshot backend: local file (${filePath}). Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for instance-proof durability.`);
  } else {
    console.warn('[STORAGE] Only one of TURSO_DATABASE_URL / TURSO_AUTH_TOKEN is set — falling back to local file. Set both for Turso.');
  }
  return new FileSnapshotStore(filePath);
}

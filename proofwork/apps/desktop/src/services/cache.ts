// Offline cache: cache_entries(namespace, key, value, updated_at, synced_at, sync_pending) in userData.
// Uses node:sqlite when it loads in Electron; otherwise a JSON file with the same semantics.
import fs from "node:fs";
import path from "node:path";
import { log, errorMessage } from "../log.ts";

export interface CacheRow {
  namespace: string;
  key: string;
  value: string; // JSON text
  updatedAt: number;
  syncedAt: number | null;
  syncPending: boolean;
}

interface CacheBackend {
  readonly name: "node:sqlite" | "json";
  get(namespace: string, key: string): CacheRow | null;
  upsert(row: CacheRow): void;
  remove(namespace: string, key: string): void;
  list(namespace: string): CacheRow[];
  pending(): CacheRow[];
}

const SCHEMA = `CREATE TABLE IF NOT EXISTS cache_entries (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER,
  sync_pending INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (namespace, key)
)`;

interface SqliteStatement {
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
  run(...args: unknown[]): unknown;
}
interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

function toRow(r: Record<string, unknown>): CacheRow {
  return {
    namespace: String(r.namespace),
    key: String(r.key),
    value: String(r.value),
    updatedAt: Number(r.updated_at),
    syncedAt: r.synced_at === null || r.synced_at === undefined ? null : Number(r.synced_at),
    syncPending: Number(r.sync_pending) === 1,
  };
}

class SqliteBackend implements CacheBackend {
  readonly name = "node:sqlite" as const;
  private readonly db: SqliteDb;
  private readonly stmtGet: SqliteStatement;
  private readonly stmtUpsert: SqliteStatement;
  private readonly stmtRemove: SqliteStatement;
  private readonly stmtList: SqliteStatement;
  private readonly stmtPending: SqliteStatement;

  constructor(file: string) {
    // Loaded lazily so a missing module only disables this backend.
    const sqlite = require("node:sqlite") as { DatabaseSync: new (p: string) => SqliteDb };
    this.db = new sqlite.DatabaseSync(file);
    this.db.exec(SCHEMA);
    this.stmtGet = this.db.prepare("SELECT * FROM cache_entries WHERE namespace = ? AND key = ?");
    this.stmtUpsert = this.db.prepare(
      `INSERT INTO cache_entries (namespace, key, value, updated_at, synced_at, sync_pending)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at,
         synced_at = excluded.synced_at, sync_pending = excluded.sync_pending`,
    );
    this.stmtRemove = this.db.prepare("DELETE FROM cache_entries WHERE namespace = ? AND key = ?");
    this.stmtList = this.db.prepare("SELECT * FROM cache_entries WHERE namespace = ? ORDER BY key");
    this.stmtPending = this.db.prepare("SELECT * FROM cache_entries WHERE sync_pending = 1");
  }

  get(namespace: string, key: string): CacheRow | null {
    const r = this.stmtGet.get(namespace, key) as Record<string, unknown> | undefined;
    return r ? toRow(r) : null;
  }
  upsert(row: CacheRow): void {
    this.stmtUpsert.run(row.namespace, row.key, row.value, row.updatedAt, row.syncedAt, row.syncPending ? 1 : 0);
  }
  remove(namespace: string, key: string): void {
    this.stmtRemove.run(namespace, key);
  }
  list(namespace: string): CacheRow[] {
    return (this.stmtList.all(namespace) as Record<string, unknown>[]).map(toRow);
  }
  pending(): CacheRow[] {
    return (this.stmtPending.all() as Record<string, unknown>[]).map(toRow);
  }
}

class JsonBackend implements CacheBackend {
  readonly name = "json" as const;
  private rows = new Map<string, CacheRow>();

  constructor(private readonly file: string) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as CacheRow[];
      for (const row of parsed) this.rows.set(this.id(row.namespace, row.key), row);
    } catch {
      // first run or unreadable file: start empty
    }
  }

  private id(namespace: string, key: string): string {
    return `${namespace}\u0000${key}`;
  }
  private persist(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify([...this.rows.values()]));
    fs.renameSync(tmp, this.file);
  }

  get(namespace: string, key: string): CacheRow | null {
    return this.rows.get(this.id(namespace, key)) ?? null;
  }
  upsert(row: CacheRow): void {
    this.rows.set(this.id(row.namespace, row.key), row);
    this.persist();
  }
  remove(namespace: string, key: string): void {
    this.rows.delete(this.id(namespace, key));
    this.persist();
  }
  list(namespace: string): CacheRow[] {
    return [...this.rows.values()].filter((r) => r.namespace === namespace).sort((a, b) => a.key.localeCompare(b.key));
  }
  pending(): CacheRow[] {
    return [...this.rows.values()].filter((r) => r.syncPending);
  }
}

export class OfflineCache {
  private constructor(private readonly backend: CacheBackend) {}

  static open(userData: string): OfflineCache {
    try {
      return new OfflineCache(new SqliteBackend(path.join(userData, "offline-cache.db")));
    } catch (err) {
      log.warn(`node:sqlite unavailable (${errorMessage(err)}); using JSON cache fallback`);
      return new OfflineCache(new JsonBackend(path.join(userData, "offline-cache.json")));
    }
  }

  get backendName(): string {
    return this.backend.name;
  }

  get<T = unknown>(namespace: string, key: string): T | null {
    const row = this.backend.get(namespace, key);
    return row ? (JSON.parse(row.value) as T) : null;
  }

  set(namespace: string, key: string, value: unknown, opts?: { pendingSync?: boolean }): void {
    const json = JSON.stringify(value);
    if (json === undefined) throw new Error("cache value must be JSON-serialisable");
    const pending = opts?.pendingSync === true;
    const now = Date.now();
    this.backend.upsert({
      namespace,
      key,
      value: json,
      updatedAt: now,
      syncedAt: pending ? (this.backend.get(namespace, key)?.syncedAt ?? null) : now,
      syncPending: pending,
    });
  }

  remove(namespace: string, key: string): void {
    this.backend.remove(namespace, key);
  }

  list<T = unknown>(namespace: string): { key: string; value: T; updatedAt: number }[] {
    return this.backend.list(namespace).map((r) => ({ key: r.key, value: JSON.parse(r.value) as T, updatedAt: r.updatedAt }));
  }

  pending(): { namespace: string; key: string; value: unknown }[] {
    return this.backend.pending().map((r) => ({ namespace: r.namespace, key: r.key, value: JSON.parse(r.value) }));
  }

  markSynced(namespace: string, key: string): void {
    const row = this.backend.get(namespace, key);
    if (!row) return;
    this.backend.upsert({ ...row, syncPending: false, syncedAt: Date.now() });
  }
}

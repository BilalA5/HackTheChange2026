// SQLite access via node:sqlite. Schema is versioned with PRAGMA user_version.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Db = DatabaseSync;
export type SqlValue = string | number | null;

/** Tables that hold rows for one user (used by export and account deletion). */
export const USER_OWNED_TABLES = [
  "ledger",
  "notifications",
  "objectives",
  "xp_events",
  "activity_days",
  "training_library",
  "training_progress",
  "ftux_sessions",
  "chat_messages",
  "applications",
  "bug_reports",
  "uploads",
  "portfolios",
] as const;

const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    career_id TEXT,
    plan TEXT NOT NULL,
    plan_changed_at TEXT,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    vision TEXT,
    settings TEXT NOT NULL
  );
  CREATE TABLE ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    category TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT
  );
  CREATE INDEX ledger_user_idx ON ledger (user_id, created_at);
  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX notifications_user_idx ON notifications (user_id, created_at);
  CREATE TABLE objectives (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, scenario_id)
  );
  CREATE TABLE xp_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    scenario_id TEXT,
    held INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX xp_events_user_idx ON xp_events (user_id, created_at);
  CREATE TABLE activity_days (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    PRIMARY KEY (user_id, day)
  );
  CREATE TABLE training_library (
    user_id TEXT NOT NULL,
    training_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (user_id, training_id)
  );
  CREATE TABLE training_progress (
    user_id TEXT NOT NULL,
    training_id TEXT NOT NULL,
    lesson_index INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, training_id)
  );
  CREATE TABLE ftux_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    view TEXT NOT NULL,
    memory TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX ftux_user_idx ON ftux_sessions (user_id, done);
  CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    at TEXT NOT NULL
  );
  CREATE INDEX chat_user_idx ON chat_messages (user_id, scope);
  CREATE TABLE portfolios (
    user_id TEXT PRIMARY KEY,
    share_slug TEXT NOT NULL UNIQUE,
    headline TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX applications_user_idx ON applications (user_id);
  CREATE TABLE bug_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    feature TEXT NOT NULL,
    screenshot_file TEXT,
    logs TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stored_name TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
];

function migrate(db: Db): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let version = Number(row.user_version); version < MIGRATIONS.length; version++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}

export function openDatabase(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL;");
  migrate(db);
  return db;
}

export function all<T>(db: Db, sql: string, params: SqlValue[] = []): T[] {
  return db.prepare(sql).all(...params) as unknown as T[];
}

export function one<T>(db: Db, sql: string, params: SqlValue[] = []): T | undefined {
  return db.prepare(sql).get(...params) as unknown as T | undefined;
}

/** Runs a write and returns the number of changed rows. */
export function run(db: Db, sql: string, params: SqlValue[] = []): number {
  return Number(db.prepare(sql).run(...params).changes);
}

/** Runs fn inside a transaction (no nesting). */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

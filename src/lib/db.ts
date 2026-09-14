import type { CheckPayload, CheckRecord, CheckStatus } from "./types";

type SqliteDb = {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
};

type D1Db = {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
  exec(sql: string): Promise<unknown>;
};

type Store = { kind: "sqlite"; db: SqliteDb } | { kind: "d1"; db: D1Db };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS otps (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

let sqlite: SqliteDb | null = null;

async function getSqlite(): Promise<SqliteDb> {
  if (sqlite) return sqlite;
  const { DatabaseSync } = await import("node:sqlite");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "secondlook.sqlite")) as unknown as SqliteDb;
  db.exec(SCHEMA);
  sqlite = db;
  return db;
}

async function getStore(): Promise<Store> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as { DB?: D1Db }).DB;
    if (db) return { kind: "d1", db };
  } catch {
    // next dev uses sqlite
  }
  return { kind: "sqlite", db: await getSqlite() };
}

type CheckRow = {
  id: string;
  user_id: string;
  claim: string;
  status: string;
  payload: string;
  created_at: string;
  updated_at: string;
};

function rowToCheck(row: CheckRow): CheckRecord {
  return {
    id: row.id,
    userId: row.user_id,
    claim: row.claim,
    status: row.status as CheckStatus,
    payload: JSON.parse(row.payload) as CheckPayload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUser(id: string, email: string) {
  const now = new Date().toISOString();
  const store = await getStore();
  const e = email.toLowerCase();
  if (store.kind === "d1") {
    await store.db
      .prepare(
        `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET email=excluded.email`,
      )
      .bind(id, e, now)
      .run();
    const row = await store.db
      .prepare(`SELECT id, email FROM users WHERE email = ?`)
      .bind(e)
      .first<{ id: string; email: string }>();
    return row!;
  }
  store.db
    .prepare(
      `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET email=excluded.email`,
    )
    .run(id, e, now);
  return store.db.prepare(`SELECT id, email FROM users WHERE email = ?`).get(e) as {
    id: string;
    email: string;
  };
}

export async function getUserById(id: string) {
  const store = await getStore();
  if (store.kind === "d1") {
    return store.db
      .prepare(`SELECT id, email FROM users WHERE id = ?`)
      .bind(id)
      .first<{ id: string; email: string }>();
  }
  return store.db.prepare(`SELECT id, email FROM users WHERE id = ?`).get(id) as
    | { id: string; email: string }
    | undefined;
}

export async function saveOtp(email: string, codeHash: string, expiresAt: number) {
  const store = await getStore();
  const e = email.toLowerCase();
  if (store.kind === "d1") {
    await store.db
      .prepare(
        `INSERT INTO otps (email, code_hash, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at`,
      )
      .bind(e, codeHash, expiresAt)
      .run();
    return;
  }
  store.db
    .prepare(
      `INSERT INTO otps (email, code_hash, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at`,
    )
    .run(e, codeHash, expiresAt);
}

export async function getOtp(email: string) {
  const store = await getStore();
  const e = email.toLowerCase();
  if (store.kind === "d1") {
    const row = await store.db
      .prepare(`SELECT code_hash as codeHash, expires_at as expiresAt FROM otps WHERE email = ?`)
      .bind(e)
      .first<{ codeHash: string; expiresAt: number }>();
    return row ?? undefined;
  }
  return store.db
    .prepare(`SELECT code_hash as codeHash, expires_at as expiresAt FROM otps WHERE email = ?`)
    .get(e) as { codeHash: string; expiresAt: number } | undefined;
}

export async function deleteOtp(email: string) {
  const store = await getStore();
  const e = email.toLowerCase();
  if (store.kind === "d1") {
    await store.db.prepare(`DELETE FROM otps WHERE email = ?`).bind(e).run();
    return;
  }
  store.db.prepare(`DELETE FROM otps WHERE email = ?`).run(e);
}

export async function insertCheck(record: CheckRecord) {
  const store = await getStore();
  const args = [
    record.id,
    record.userId,
    record.claim,
    record.status,
    JSON.stringify(record.payload),
    record.createdAt,
    record.updatedAt,
  ];
  const sql = `INSERT INTO checks (id, user_id, claim, status, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;
  if (store.kind === "d1") {
    await store.db.prepare(sql).bind(...args).run();
    return;
  }
  store.db.prepare(sql).run(...args);
}

export async function updateCheck(record: CheckRecord) {
  const store = await getStore();
  const sql = `UPDATE checks SET claim=?, status=?, payload=?, updated_at=? WHERE id=? AND user_id=?`;
  const args = [
    record.claim,
    record.status,
    JSON.stringify(record.payload),
    record.updatedAt,
    record.id,
    record.userId,
  ];
  if (store.kind === "d1") {
    await store.db.prepare(sql).bind(...args).run();
    return;
  }
  store.db.prepare(sql).run(...args);
}

export async function getCheck(id: string, userId: string) {
  const store = await getStore();
  const sql = `SELECT * FROM checks WHERE id = ? AND user_id = ?`;
  if (store.kind === "d1") {
    const row = await store.db.prepare(sql).bind(id, userId).first<CheckRow>();
    return row ? rowToCheck(row) : null;
  }
  const row = store.db.prepare(sql).get(id, userId) as CheckRow | undefined;
  return row ? rowToCheck(row) : null;
}

export async function listChecks(userId: string) {
  const store = await getStore();
  const sql = `SELECT * FROM checks WHERE user_id = ? ORDER BY created_at DESC`;
  if (store.kind === "d1") {
    const { results } = await store.db.prepare(sql).bind(userId).all<CheckRow>();
    return (results || []).map(rowToCheck);
  }
  const rows = store.db.prepare(sql).all(userId) as CheckRow[];
  return rows.map(rowToCheck);
}

const CONTACTS_DDL = `CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

export async function saveContact(row: {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}) {
  const store = await getStore();
  const sql = `INSERT INTO contacts (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`;
  if (store.kind === "d1") {
    await store.db
      .prepare(sql)
      .bind(row.id, row.name, row.email, row.message, row.createdAt)
      .run();
    return;
  }
  store.db.exec(CONTACTS_DDL);
  store.db.prepare(sql).run(row.id, row.name, row.email, row.message, row.createdAt);
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const store = await getStore();
  const ddl = `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)`;
  await store.db.exec(ddl);
  const now = Date.now();
  const sql = `INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count`;
  const args = [key, now + windowMs, now, now];
  const row = store.kind === "d1" ? await store.db.prepare(sql).bind(...args).first<{count:number}>() : store.db.prepare(sql).get(...args) as {count:number};
  return (row?.count ?? limit + 1) <= limit;
}

export async function acquireCheckLock(id: string) {
  const store = await getStore();
  await store.db.exec(`CREATE TABLE IF NOT EXISTS check_locks (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL)`);
  const now = Date.now();
  const sql = `INSERT INTO check_locks (id,expires_at) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at<? RETURNING id`;
  const row = store.kind === "d1" ? await store.db.prepare(sql).bind(id,now+180000,now).first() : store.db.prepare(sql).get(id,now+180000,now);
  return Boolean(row);
}

export async function releaseCheckLock(id: string) {
  const store = await getStore();
  const sql = `DELETE FROM check_locks WHERE id=?`;
  if(store.kind === "d1") await store.db.prepare(sql).bind(id).run(); else store.db.prepare(sql).run(id);
}

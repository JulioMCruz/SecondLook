import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { CheckPayload, CheckRecord, CheckStatus } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "secondlook.sqlite");

let db: DatabaseSync | null = null;

function getDb() {
  if (db) return db;
  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
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
  `);
  return db;
}

export function upsertUser(id: string, email: string) {
  const now = new Date().toISOString();
  getDb().prepare(
    `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET email=excluded.email`,
  ).run(id, email.toLowerCase(), now);
  const row = getDb()
    .prepare(`SELECT id, email FROM users WHERE email = ?`)
    .get(email.toLowerCase()) as { id: string; email: string };
  return row;
}

export function getUserById(id: string) {
  return getDb()
    .prepare(`SELECT id, email FROM users WHERE id = ?`)
    .get(id) as { id: string; email: string } | undefined;
}

export function saveOtp(email: string, codeHash: string, expiresAt: number) {
  getDb()
    .prepare(
      `INSERT INTO otps (email, code_hash, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at`,
    )
    .run(email.toLowerCase(), codeHash, expiresAt);
}

export function getOtp(email: string) {
  return getDb()
    .prepare(`SELECT code_hash as codeHash, expires_at as expiresAt FROM otps WHERE email = ?`)
    .get(email.toLowerCase()) as { codeHash: string; expiresAt: number } | undefined;
}

export function deleteOtp(email: string) {
  getDb().prepare(`DELETE FROM otps WHERE email = ?`).run(email.toLowerCase());
}

function rowToCheck(row: {
  id: string;
  user_id: string;
  claim: string;
  status: string;
  payload: string;
  created_at: string;
  updated_at: string;
}): CheckRecord {
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

export function insertCheck(record: CheckRecord) {
  getDb()
    .prepare(
      `INSERT INTO checks (id, user_id, claim, status, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.id,
      record.userId,
      record.claim,
      record.status,
      JSON.stringify(record.payload),
      record.createdAt,
      record.updatedAt,
    );
}

export function updateCheck(record: CheckRecord) {
  getDb()
    .prepare(
      `UPDATE checks SET claim=?, status=?, payload=?, updated_at=? WHERE id=? AND user_id=?`,
    )
    .run(
      record.claim,
      record.status,
      JSON.stringify(record.payload),
      record.updatedAt,
      record.id,
      record.userId,
    );
}

export function getCheck(id: string, userId: string) {
  const row = getDb()
    .prepare(`SELECT * FROM checks WHERE id = ? AND user_id = ?`)
    .get(id, userId) as
    | {
        id: string;
        user_id: string;
        claim: string;
        status: string;
        payload: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;
  return row ? rowToCheck(row) : null;
}

export function listChecks(userId: string) {
  const rows = getDb()
    .prepare(`SELECT * FROM checks WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as Array<{
    id: string;
    user_id: string;
    claim: string;
    status: string;
    payload: string;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map(rowToCheck);
}

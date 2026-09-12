import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getUserById } from "./db";
import type { SessionUser } from "./types";

const COOKIE = "sl_session";
const WEEK = 7 * 24 * 60 * 60;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET missing");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function makeSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const body = `${userId}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, mac] = parts;
  const body = `${userId}.${exp}`;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return userId;
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, makeSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = readSessionToken(token);
  if (!userId) return null;
  const user = await getUserById(userId);
  return user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}

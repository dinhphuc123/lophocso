import { NextResponse } from "next/server";

// Single-teacher auth: one shared password (env TEACHER_PASSWORD) -> signed, expiring cookie.
// shortcut: no per-user accounts/ownerId, upgrade to Auth.js + users table when several teachers share one deployment.
export const AUTH_COOKIE = "ds_teacher";
const TTL_MS = 12 * 60 * 60 * 1000;
const enc = new TextEncoder();

export function teacherPassword(): string | undefined {
  if (process.env.TEACHER_PASSWORD) return process.env.TEACHER_PASSWORD;
  return process.env.NODE_ENV === "production" ? undefined : "giaovien";
}

function secret(): string {
  return process.env.AUTH_SECRET || teacherPassword() || "dev-only-secret";
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function checkPassword(input: string): boolean {
  const pw = teacherPassword();
  return !!pw && safeEqual(input, pw);
}

export async function createToken(): Promise<string> {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifyToken(token?: string): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}

export const AUTH_MAX_AGE_SEC = TTL_MS / 1000;

function cookieOf(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function isTeacher(req: Request): Promise<boolean> {
  return verifyToken(cookieOf(req, AUTH_COOKIE));
}

/** Returns a 401 response when the caller is not the teacher, otherwise null. */
export async function teacherOnly(req: Request): Promise<NextResponse | null> {
  if (await isTeacher(req)) return null;
  return NextResponse.json({ success: false, error: "Cần đăng nhập giáo viên" }, { status: 401 });
}

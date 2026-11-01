import fs from "node:fs";
import path from "node:path";
import { getSupabase } from "./supabase";

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");

export interface TeacherProfile {
  id: string;
  name: string;
  school: string;
  subject: string;
  email: string;
  passwordHash?: string;
  updatedAt: string;
}

function loadDiskProfile(): TeacherProfile | null {
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8")) as TeacherProfile;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveDiskProfile(p: TeacherProfile): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(p, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

// In-memory cache with disk fallback
let cachedProfile: TeacherProfile = loadDiskProfile() || {
  id: "default_teacher",
  name: "Thầy/Cô Giáo",
  school: "Trường THPT",
  subject: "Toán học",
  email: "giaovien@khaothiso.vn",
  updatedAt: new Date().toISOString(),
};

const enc = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = process.env.AUTH_SECRET || "kts_salt_2025";
  const data = enc.encode(`${salt}:${password}`);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getTeacherProfile(): Promise<TeacherProfile> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("teacher_profile")
        .select("*")
        .eq("id", "default_teacher")
        .maybeSingle();

      if (!error && data) {
        cachedProfile = {
          id: data.id || "default_teacher",
          name: data.name || cachedProfile.name,
          school: data.school || cachedProfile.school,
          subject: data.subject || cachedProfile.subject,
          email: data.email || cachedProfile.email,
          passwordHash: data.password_hash || undefined,
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("Supabase getTeacherProfile fallback to memory:", err);
    }
  }
  return cachedProfile;
}

export async function updateTeacherProfile(updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
  cachedProfile = {
    ...cachedProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveDiskProfile(cachedProfile);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("teacher_profile").upsert({
        id: "default_teacher",
        name: cachedProfile.name,
        school: cachedProfile.school,
        subject: cachedProfile.subject,
        email: cachedProfile.email,
        password_hash: cachedProfile.passwordHash || null,
        updated_at: cachedProfile.updatedAt,
      });
    } catch (err) {
      console.warn("Supabase updateTeacherProfile error:", err);
    }
  }

  return cachedProfile;
}

export async function verifyTeacherPassword(input: string): Promise<boolean> {
  // Always accept TEACHER_PASSWORD from .env.local (or default "giaovien") as master login
  const envPw = process.env.TEACHER_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "giaovien");
  if (envPw && input === envPw) {
    return true;
  }

  const profile = await getTeacherProfile();
  if (profile.passwordHash) {
    const hashed = await hashPassword(input);
    return hashed === profile.passwordHash;
  }
  return false;
}

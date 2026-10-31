import fs from "node:fs";
import path from "node:path";
import { Attempt, ClassRoom, Exam, StudentSubmission, DashboardStats } from "./types";
import { getSupabase } from "./supabase";

if (process.env.VERCEL && !getSupabase()) {
  console.warn("[WARNING] Đang chạy trên Vercel nhưng chưa cấu hình SUPABASE_URL / SUPABASE_ANON_KEY. Dữ liệu trong /tmp sẽ bị mất khi function restart!");
}

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  exams: Exam[];
  submissions: StudentSubmission[];
  attempts: Attempt[];
  classes: ClassRoom[];
}

function getInitialData(): DatabaseSchema {
  return { exams: [], submissions: [], attempts: [], classes: [] };
}

function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // keep one backup of the last good state, then replace atomically (tmp + rename)
  if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, `${DB_FILE}.bak`);
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempFile, DB_FILE);
}

// All access is synchronous, so a read-modify-write can never interleave with another request in this process.
// shortcut: whole-file JSON, fine for a classroom; move to SQLite/Postgres for multiple instances or heavy traffic.
function readDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const init = getInitialData();
    writeDb(init);
    return init;
  }
  // A corrupt file must fail loudly: falling back to seed data would overwrite real exams on the next write.
  const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as Partial<DatabaseSchema>;
  return {
    exams: data.exams ?? [],
    submissions: data.submissions ?? [],
    attempts: data.attempts ?? [],
    classes: data.classes ?? [],
  };
}

// Database API
export function getExams(): Exam[] {
  return readDb().exams;
}

export function getExamById(id: string): Exam | undefined {
  return readDb().exams.find((e) => e.id === id);
}

export async function getExamWithFallback(id: string): Promise<Exam | undefined> {
  const local = getExamById(id);
  if (local) return local;

  const supabase = getSupabase();
  if (!supabase) return undefined;

  try {
    const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
    if (!error && data) {
      let targetClass = String(data.target_class || "");
      if (!targetClass && typeof data.description === "string" && data.description.includes("Lớp: ")) {
        targetClass = data.description.split("|")[0].replace("Lớp: ", "").trim();
      }
      if (!targetClass) targetClass = "Toàn trường";

      const exam: Exam = {
        id: String(data.id),
        title: String(data.title),
        subject: String(data.subject || "Toán học"),
        targetClass,
        durationMinutes: Number(data.duration_minutes || data.duration) || 45,
        deadline: data.deadline ? String(data.deadline) : undefined,
        status: (data.status as Exam["status"]) || "open",
        createdAt: String(data.created_at || new Date().toISOString()),
        questions: Array.isArray(data.questions) ? (data.questions as Exam["questions"]) : [],
      };
      saveExam(exam);
      return exam;
    }
  } catch (err) {
    console.warn("getExamWithFallback error:", err);
  }
  return undefined;
}

export function saveExam(exam: Exam): Exam {
  const db = readDb();
  const index = db.exams.findIndex((e) => e.id === exam.id);
  if (index >= 0) {
    db.exams[index] = exam;
  } else {
    db.exams.unshift(exam);
  }
  writeDb(db);
  return exam;
}

/** Deletes the exam with its submissions/attempts and the uploaded images no other exam still uses. */
export function deleteExam(id: string): boolean {
  const db = readDb();
  const gone = db.exams.find((e) => e.id === id);
  if (!gone) return false;
  db.exams = db.exams.filter((e) => e.id !== id);
  db.submissions = db.submissions.filter((s) => s.examId !== id);
  db.attempts = db.attempts.filter((a) => a.examId !== id);
  writeDb(db);

  const stillUsed = new Set(db.exams.flatMap((e) => e.questions.map((q) => q.imageUrl)));
  for (const q of gone.questions) {
    const url = q.imageUrl;
    if (!url || stillUsed.has(url) || !/^\/uploads\/[\w.-]+$/.test(url)) continue;
    fs.rmSync(path.join(process.cwd(), "public", url), { force: true });
  }
  return true;
}

export function getSubmissions(examId?: string): StudentSubmission[] {
  const subs = readDb().submissions;
  if (!examId) return subs;
  return subs.filter((s) => s.examId === examId);
}

const attemptKey = (name: string, cls: string) =>
  `${name.trim().toLowerCase().replace(/\s+/g, " ")}|${cls.trim().toLowerCase()}`;

// In-memory hot store for real-time online status
declare global {
  var __activeExamAttempts: Map<string, Attempt> | undefined;
}

const getHotAttempts = (): Map<string, Attempt> => {
  if (!globalThis.__activeExamAttempts) {
    globalThis.__activeExamAttempts = new Map<string, Attempt>();
  }
  return globalThis.__activeExamAttempts;
};

/** Starts (or resumes) a student's attempt. The server clock owns startedAt. */
export function startAttempt(
  examId: string,
  name: string,
  cls: string
): { attempt: Attempt; resumed: boolean } | { error: "submitted" } {
  const db = readDb();
  const key = attemptKey(name, cls);
  const hotKey = `${examId}:${key}`;
  const hot = getHotAttempts();

  const found = db.attempts.find((a) => a.examId === examId && a.key === key);
  if (found?.submitted) return { error: "submitted" };
  if (found) {
    found.lastActiveAt = new Date().toISOString();
    hot.set(hotKey, found);
    return { attempt: found, resumed: true };
  }
  const attempt: Attempt = {
    examId,
    key,
    studentName: name.trim(),
    studentClass: cls.trim(),
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    answeredCount: 0,
    submitted: false,
  };
  db.attempts.push(attempt);
  writeDb(db);
  hot.set(hotKey, attempt);
  return { attempt, resumed: false };
}

export function recordHeartbeat(
  examId: string,
  name: string,
  cls: string,
  answeredCount?: number,
  totalQuestions?: number
): Attempt | undefined {
  const key = attemptKey(name, cls);
  const hotKey = `${examId}:${key}`;
  const hot = getHotAttempts();

  const db = readDb();
  let attempt = db.attempts.find((a) => a.examId === examId && a.key === key);

  const nowIso = new Date().toISOString();
  if (attempt) {
    attempt.lastActiveAt = nowIso;
    if (typeof answeredCount === "number") attempt.answeredCount = answeredCount;
    if (typeof totalQuestions === "number") attempt.totalQuestions = totalQuestions;
    writeDb(db);
  } else {
    attempt = hot.get(hotKey) || {
      examId,
      key,
      studentName: name.trim(),
      studentClass: cls.trim(),
      startedAt: nowIso,
      lastActiveAt: nowIso,
      answeredCount,
      totalQuestions,
      submitted: false,
    };
  }

  hot.set(hotKey, { ...attempt, lastActiveAt: nowIso, answeredCount, totalQuestions });
  return attempt;
}

export function getActiveAttempts(examId?: string): Attempt[] {
  const { attempts: diskAttempts, exams } = readDb();
  const now = Date.now();
  const hot = getHotAttempts();

  const allMap = new Map<string, Attempt>();
  for (const a of diskAttempts) {
    allMap.set(`${a.examId}:${a.key}`, a);
  }
  for (const [k, a] of hot.entries()) {
    allMap.set(k, { ...allMap.get(k), ...a });
  }

  return Array.from(allMap.values()).filter((a) => {
    if (a.submitted) return false;
    if (examId && a.examId !== examId) return false;
    const exam = exams.find((e) => e.id === a.examId);
    const limit = ((exam?.durationMinutes ?? 45) + 15) * 60_000;
    const startedMs = Date.parse(a.startedAt);
    const lastActiveMs = a.lastActiveAt ? Date.parse(a.lastActiveAt) : startedMs;
    return now - startedMs < limit && now - lastActiveMs < 5 * 60_000;
  });
}

export function getAttempt(examId: string, name: string, cls: string): Attempt | undefined {
  const key = attemptKey(name, cls);
  return readDb().attempts.find((a) => a.examId === examId && a.key === key);
}

export function saveSubmission(submission: StudentSubmission): StudentSubmission {
  const db = readDb();
  db.submissions.unshift(submission);
  const key = attemptKey(submission.studentName, submission.studentClass);
  const attempt = db.attempts.find((a) => a.examId === submission.examId && a.key === key);
  if (attempt) attempt.submitted = true;
  getHotAttempts().delete(`${submission.examId}:${key}`);
  writeDb(db);
  return submission;
}

export function updateSubmission(
  id: string,
  fn: (s: StudentSubmission) => StudentSubmission
): StudentSubmission | undefined {
  const db = readDb();
  const i = db.submissions.findIndex((s) => s.id === id);
  if (i < 0) return undefined;
  db.submissions[i] = fn(db.submissions[i]);
  writeDb(db);
  return db.submissions[i];
}

export function getClasses(): ClassRoom[] {
  return readDb().classes;
}

export function saveClass(c: ClassRoom): ClassRoom {
  const db = readDb();
  const i = db.classes.findIndex((x) => x.id === c.id);
  if (i >= 0) db.classes[i] = c;
  else db.classes.push(c);
  writeDb(db);
  return c;
}

export function deleteClass(id: string): boolean {
  const db = readDb();
  const n = db.classes.length;
  db.classes = db.classes.filter((c) => c.id !== id);
  if (db.classes.length === n) return false;
  writeDb(db);
  return true;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function getDashboardStats(): DashboardStats {
  const { submissions: subs, exams, attempts } = readDb();
  const now = Date.now();
  const age = (s: StudentSubmission) => now - Date.parse(s.submittedAt);

  const thisWeek = subs.filter((s) => age(s) < 7 * DAY_MS).length;
  const lastWeek = subs.filter((s) => age(s) >= 7 * DAY_MS && age(s) < 14 * DAY_MS).length;
  const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

  const pct = (n: number) => (subs.length > 0 ? Math.round((n / subs.length) * 100) : 0);
  const avg = subs.length > 0 ? Number((subs.reduce((a, s) => a + s.score, 0) / subs.length).toFixed(1)) : 0;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY_MS);
    const count = subs.filter((s) => new Date(s.submittedAt).toDateString() === d.toDateString()).length;
    return { day: WEEKDAYS[d.getDay()], count };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const difficult = exams
    .flatMap((exam) => {
      const examSubs = subs.filter((s) => s.examId === exam.id);
      return exam.questions.map((q, i) => {
        const rows = examSubs.map((s) => s.details.find((d) => d.questionId === q.id)).filter((d) => d && !d.needsManualGrade);
        const wrong = rows.filter((d) => d && !d.isCorrect).length;
        return { exam, q, i, total: rows.length, wrong };
      });
    })
    .filter((x) => x.total > 0 && x.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total)
    .slice(0, 3)
    .map((x) => ({
      examTitle: x.exam.title,
      questionNo: `Câu ${x.i + 1}`,
      topic: x.q.text.replace(/\$[^$]*\$/g, "…").replace(/\s+/g, " ").slice(0, 70),
      wrongRate: `${Math.round((x.wrong / x.total) * 100)}%`,
      totalAnswers: x.total,
    }));

  const onlineAttempts = getActiveAttempts();
  const active = onlineAttempts.length;

  const activeAttempts = onlineAttempts
    .slice(-5)
    .map((a) => {
      const exam = exams.find((e) => e.id === a.examId);
      const elapsedMin = Math.max(1, Math.floor((now - Date.parse(a.startedAt)) / 60_000));
      const answered = typeof a.answeredCount === "number" && a.totalQuestions 
        ? `${a.answeredCount}/${a.totalQuestions} câu` 
        : `${elapsedMin}p`;
      return {
        name: a.studentName,
        class: a.studentClass,
        exam: exam?.title || "Đề thi trực tuyến",
        progress: `Đang làm (${answered})`,
        time: `${elapsedMin} phút trước`,
        status: "active" as const,
      };
    });

  const recentSubs = subs
    .slice(-3)
    .reverse()
    .map((s) => {
      const exam = exams.find((e) => e.id === s.examId);
      return {
        name: s.studentName,
        class: s.studentClass,
        exam: exam?.title || "Đề thi trực tuyến",
        progress: `${s.correctCount}/${s.totalQuestions} câu (${s.score}đ)`,
        time: "Vừa nộp bài",
        status: "submitted" as const,
      };
    });

  const liveSessions = [...activeAttempts, ...recentSubs].slice(0, 4);

  return {
    weeklySubmissionsCount: thisWeek,
    weeklyChangePercent: change,
    averageScore: avg,
    highScorePercent: pct(subs.filter((s) => s.score >= 8).length),
    lowScorePercent: pct(subs.filter((s) => s.score < 5).length),
    activeStudentsNow: active,
    pendingGradingCount: subs.filter((s) => s.details.some((d) => d.needsManualGrade)).length,
    expiringExamsCount: exams.filter((e) => e.status === "open").length,
    draftExamsCount: exams.filter((e) => e.status === "draft").length,
    dailySubmissions: days.map((d) => ({ ...d, height: `${Math.max(4, Math.round((d.count / maxDay) * 100))}%` })),
    difficultQuestions: difficult,
    liveSessions,
  };
}

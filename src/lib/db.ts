import fs from "node:fs";
import path from "node:path";
import { Attempt, ClassRoom, Exam, StudentSubmission, DashboardStats } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  exams: Exam[];
  submissions: StudentSubmission[];
  attempts: Attempt[];
  classes: ClassRoom[];
}

function getInitialData(): DatabaseSchema {
  const initialExams: Exam[] = [
    {
      id: "de-toan-12-gk2",
      title: "Đề ôn tập giữa kì 2 môn Toán 12 - Chuẩn BGD 2025",
      subject: "Toán học 12",
      targetClass: "12A1, 12A2",
      durationMinutes: 45,
      deadline: "23:59 hôm nay",
      status: "open",
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          text: "Cho hàm số y = f(x) có đạo hàm f'(x) = x(x - 1)(x + 2)^3. Số điểm cực trị của hàm số đã cho là:",
          options: [
            { id: "A", text: "1" },
            { id: "B", text: "2" },
            { id: "C", text: "3" },
            { id: "D", text: "5" },
          ],
          correctAnswer: "C",
          explanation: "f'(x) đổi dấu khi qua các nghiệm đơn hoặc bội lẻ x = 0, x = 1, x = -2. Cả 3 điểm này đều là điểm cực trị.",
          points: 0.25,
        },
        {
          id: "q2",
          type: "multiple_choice",
          text: "Trong không gian Oxyz, cho mặt phẳng (P): 2x - 3y + z - 5 = 0. Một vectơ pháp tuyến của (P) là:",
          options: [
            { id: "A", text: "n = (2; -3; 1)" },
            { id: "B", text: "n = (2; 3; 1)" },
            { id: "C", text: "n = (2; -3; -5)" },
            { id: "D", text: "n = (-2; 3; 1)" },
          ],
          correctAnswer: "A",
          explanation: "Vectơ pháp tuyến của mặt phẳng Ax + By + Cz + D = 0 là n = (A; B; C) = (2; -3; 1).",
          points: 0.25,
        },
        {
          id: "q3",
          type: "true_false",
          text: "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với đáy (ABCD) và SA = a√3.",
          subQuestions: [
            { id: "a", text: "Đường thẳng SA vuông góc với đường thẳng CD.", isCorrect: true },
            { id: "b", text: "Thể tích khối chóp S.ABCD bằng a³√3.", isCorrect: false },
            { id: "c", text: "Góc giữa đường thẳng SC và mặt phẳng (ABCD) bằng 60°.", isCorrect: false },
            { id: "d", text: "Khoảng cách từ điểm A đến mặt phẳng (SBD) bằng (a√6)/3.", isCorrect: false },
          ],
          explanation: "a) Đúng vì SA ⊥ (ABCD) => SA ⊥ CD. b) V = (1/3)*SA*S_ABCD = (a³√3)/3 => Sai. c) AC = a√2 => tan(SCA) = SA/AC = √3/√2 = √(3/2) ≠ √3 (không phải 60°) => Sai.",
          points: 1.0,
        },
        {
          id: "q4",
          type: "short_answer",
          text: "Tìm giá trị lớn nhất của hàm số f(x) = -x⁴ + 12x² + 1 trên đoạn [-1; 2].",
          correctAnswers: ["33", "33.0"],
          explanation: "f'(x) = -4x³ + 24x = -4x(x² - 6). Trên đoạn [-1; 2], f'(x) = 0 khi x = 0. Tính f(-1)=12, f(0)=1, f(2)=33. Vậy GTLN bằng 33 tại x = 2.",
          points: 0.5,
        },
      ],
    },
    {
      id: "de-15p-dao-ham",
      title: "Kiểm tra 15 phút: Đạo hàm và Khảo sát hàm số",
      subject: "Toán học 12",
      targetClass: "12A3",
      durationMinutes: 15,
      deadline: "Đã hết hạn",
      status: "grading",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          text: "Đạo hàm của hàm số y = ln(2x + 1) là:",
          options: [
            { id: "A", text: "y' = 1 / (2x + 1)" },
            { id: "B", text: "y' = 2 / (2x + 1)" },
            { id: "C", text: "y' = 2x / (2x + 1)" },
            { id: "D", text: "y' = -2 / (2x + 1)²" },
          ],
          correctAnswer: "B",
          explanation: "(ln u)' = u'/u => (2x + 1)' / (2x + 1) = 2 / (2x + 1).",
          points: 1.0,
        },
      ],
    },
  ];

  const initialSubmissions: StudentSubmission[] = [
    {
      id: "sub-1",
      examId: "de-toan-12-gk2",
      studentName: "Trần Minh Quân",
      studentClass: "12A1",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      submittedAt: new Date(Date.now() - 1800000).toISOString(),
      score: 8.5,
      totalScore: 10,
      correctCount: 3,
      totalQuestions: 4,
      answers: { q1: "C", q2: "A", q3: { a: true, b: false, c: false, d: false }, q4: "33" },
      details: [],
    },
    {
      id: "sub-2",
      examId: "de-toan-12-gk2",
      studentName: "Lê Hoàng Yến",
      studentClass: "12A1",
      startedAt: new Date(Date.now() - 4000000).toISOString(),
      submittedAt: new Date(Date.now() - 2100000).toISOString(),
      score: 9.0,
      totalScore: 10,
      correctCount: 4,
      totalQuestions: 4,
      answers: { q1: "C", q2: "A", q3: { a: true, b: false, c: false, d: false }, q4: "33" },
      details: [],
    },
    {
      id: "sub-3",
      examId: "de-toan-12-gk2",
      studentName: "Nguyễn Đức Anh",
      studentClass: "12A2",
      startedAt: new Date(Date.now() - 5000000).toISOString(),
      submittedAt: new Date(Date.now() - 3200000).toISOString(),
      score: 7.0,
      totalScore: 10,
      correctCount: 2,
      totalQuestions: 4,
      answers: { q1: "B", q2: "A", q3: { a: true, b: true, c: false, d: false }, q4: "33" },
      details: [],
    },
  ];

  return { exams: initialExams, submissions: initialSubmissions, attempts: [], classes: [] };
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

/** Starts (or resumes) a student's attempt. The server clock owns startedAt. */
export function startAttempt(
  examId: string,
  name: string,
  cls: string
): { attempt: Attempt; resumed: boolean } | { error: "submitted" } {
  const db = readDb();
  const key = attemptKey(name, cls);
  const found = db.attempts.find((a) => a.examId === examId && a.key === key);
  if (found?.submitted) return { error: "submitted" };
  if (found) return { attempt: found, resumed: true };
  const attempt: Attempt = {
    examId,
    key,
    studentName: name.trim(),
    studentClass: cls.trim(),
    startedAt: new Date().toISOString(),
    submitted: false,
  };
  db.attempts.push(attempt);
  writeDb(db);
  return { attempt, resumed: false };
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

  const active = attempts.filter((a) => {
    const exam = exams.find((e) => e.id === a.examId);
    const limit = ((exam?.durationMinutes ?? 45) + 5) * 60_000;
    return !a.submitted && now - Date.parse(a.startedAt) < limit;
  }).length;

  const activeAttempts = attempts
    .filter((a) => !a.submitted)
    .slice(-3)
    .map((a) => {
      const exam = exams.find((e) => e.id === a.examId);
      const elapsedMin = Math.max(1, Math.floor((now - Date.parse(a.startedAt)) / 60_000));
      return {
        name: a.studentName,
        class: a.studentClass,
        exam: exam?.title || "Đề thi trực tuyến",
        progress: `Đang làm (${elapsedMin}p)`,
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

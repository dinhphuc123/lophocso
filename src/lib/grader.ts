import { Exam, StudentSubmission } from "./types";

/** "4,9" == "4.9" == " 4.90 ", "3 200" == "3200". Falls back to text compare when not numeric. */
export function matchShort(user: unknown, accepted: string[]): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "").replace(/,/g, ".");
  const u = norm(String(user ?? ""));
  if (!u) return false;
  return accepted.some((a) => {
    const n = norm(a);
    if (!n) return false;
    if (n === u) return true;
    const nu = Number(u);
    const nn = Number(n);
    return Number.isFinite(nu) && Number.isFinite(nn) && Math.abs(nu - nn) < 1e-9;
  });
}

type Detail = StudentSubmission["details"][number];

function gradeQuestion(q: Exam["questions"][number], userAns: unknown): Detail {
  const maxPoints = q.points || (q.type === "true_false" ? 1.0 : 0.25);
  const base = { questionId: q.id, maxPoints, explanation: q.explanation };

  if (q.type === "multiple_choice") {
    const ok = userAns === q.correctAnswer;
    return { ...base, isCorrect: ok, earnedPoints: ok ? maxPoints : 0, userAnswer: userAns ?? "Chưa làm", correctAnswer: q.correctAnswer };
  }

  if (q.type === "true_false") {
    // BGD 2025: 1 sub-item right 0.1, 2 → 0.25, 3 → 0.5, 4 → 1.0 (scaled by the question's max points)
    const sub = (userAns as Record<string, boolean>) || {};
    const right = q.subQuestions.filter((s) => sub[s.id] === s.isCorrect).length;
    const ratio = [0, 0.1, 0.25, 0.5, 1][Math.min(right, 4)];
    return {
      ...base,
      isCorrect: right === q.subQuestions.length && right > 0,
      earnedPoints: Number((ratio * maxPoints).toFixed(3)),
      userAnswer: sub,
      correctAnswer: Object.fromEntries(q.subQuestions.map((s) => [s.id, s.isCorrect])),
    };
  }

  if (q.type === "essay") {
    return { ...base, isCorrect: false, earnedPoints: 0, userAnswer: userAns ?? "Chưa làm", correctAnswer: "Chờ giáo viên chấm", needsManualGrade: true };
  }

  const ok = matchShort(userAns, q.correctAnswers);
  return { ...base, isCorrect: ok, earnedPoints: ok ? maxPoints : 0, userAnswer: userAns ?? "Chưa làm", correctAnswer: q.correctAnswers.join(" hoặc ") };
}

/** Score is always derived from the details so manual essay grading can recompute it. */
export function summarize(details: Detail[]): { score: number; correctCount: number } {
  const earned = details.reduce((a, d) => a + d.earnedPoints, 0);
  const max = details.reduce((a, d) => a + d.maxPoints, 0);
  return {
    score: max > 0 ? Number(((earned / max) * 10).toFixed(2)) : 0,
    correctCount: details.filter((d) => d.isCorrect).length,
  };
}

export function gradeSubmission(
  exam: Exam,
  studentName: string,
  studentClass: string,
  userAnswers: Record<string, unknown>,
  startedAt: string
): StudentSubmission {
  const details = exam.questions.map((q) => gradeQuestion(q, userAnswers[q.id]));
  const { score, correctCount } = summarize(details);
  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    examId: exam.id,
    studentName: studentName.trim(),
    studentClass: studentClass.trim(),
    startedAt,
    submittedAt: new Date().toISOString(),
    score,
    totalScore: 10,
    correctCount,
    totalQuestions: exam.questions.length,
    answers: userAnswers,
    details,
  };
}

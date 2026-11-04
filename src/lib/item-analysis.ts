import { Exam, Question, StudentSubmission } from "./types";

export interface QuestionAnalysisItem {
  questionId: string;
  index: number;
  type: Question["type"];
  level?: string;
  text: string;
  attemptCount: number;
  correctCount: number;
  correctRate: number; // 0..100
  avgEarnedPoints: number;
  maxPoints: number;
  difficultyTag: "Dễ" | "Vừa sức" | "Khó" | "Rất khó";
  optionDistribution?: Record<"A" | "B" | "C" | "D", number>;
}

/**
 * Computes per-question accuracy, average earned points, and option choice distribution
 * across all student submissions of an exam.
 */
export function analyzeExamQuestions(
  exam: Exam,
  submissions: StudentSubmission[]
): QuestionAnalysisItem[] {
  const totalSubs = submissions.length;

  return exam.questions.map((q, idx) => {
    const maxPoints = q.points || (q.type === "true_false" ? 1.0 : q.type === "short_answer" ? 0.5 : 0.25);
    let correctCount = 0;
    let totalEarned = 0;
    const optionDist: Record<"A" | "B" | "C" | "D", number> = { A: 0, B: 0, C: 0, D: 0 };

    for (const sub of submissions) {
      const det = sub.details.find((d) => d.questionId === q.id);
      if (det) {
        if (det.isCorrect) correctCount++;
        totalEarned += det.earnedPoints || 0;
        if (q.type === "multiple_choice") {
          const choice = String(det.userAnswer || "").toUpperCase();
          if (choice === "A" || choice === "B" || choice === "C" || choice === "D") {
            optionDist[choice]++;
          }
        }
      }
    }

    const correctRate = totalSubs > 0 ? Math.round((correctCount / totalSubs) * 100) : 0;
    const avgEarnedPoints = totalSubs > 0 ? Number((totalEarned / totalSubs).toFixed(2)) : 0;

    let difficultyTag: QuestionAnalysisItem["difficultyTag"] = "Vừa sức";
    if (totalSubs > 0) {
      if (correctRate >= 80) difficultyTag = "Dễ";
      else if (correctRate >= 50) difficultyTag = "Vừa sức";
      else if (correctRate >= 25) difficultyTag = "Khó";
      else difficultyTag = "Rất khó";
    }

    return {
      questionId: q.id,
      index: idx + 1,
      type: q.type,
      level: q.level,
      text: q.text,
      attemptCount: totalSubs,
      correctCount,
      correctRate,
      avgEarnedPoints,
      maxPoints,
      difficultyTag,
      optionDistribution: q.type === "multiple_choice" ? optionDist : undefined,
    };
  });
}

/**
 * Distributes points across questions according to either:
 * - "bgd2025": Multiple Choice = 0.25đ, True/False = 1.0đ, Short Answer = 0.5đ, Essay = 1.0đ
 * - "equal10": Splits 10.0 points equally across all questions
 */
export function distributeExamPoints(
  questions: Question[],
  mode: "bgd2025" | "equal10"
): Question[] {
  if (questions.length === 0) return [];
  if (mode === "equal10") {
    const base = Math.floor((10 / questions.length) * 100) / 100;
    return questions.map((q, i) => ({
      ...q,
      points:
        i === questions.length - 1
          ? Number((10 - base * (questions.length - 1)).toFixed(2))
          : base,
    }));
  }

  return questions.map((q) => ({
    ...q,
    points:
      q.type === "multiple_choice"
        ? 0.25
        : q.type === "true_false"
        ? 1.0
        : q.type === "short_answer"
        ? 0.5
        : 1.0,
  }));
}

export interface ExamAuditIssue {
  questionIndex: number; // 1-based
  message: string;
}

/**
 * Checks an exam's question list for common Word-import pitfalls highlighted by dethiso.vn:
 * - Missing answer key (answerUnknown on MC, empty correctAnswers on short_answer)
 * - True/False question not having 4 sub-statements (a, b, c, d)
 * - Empty question text or empty option text
 */
export function auditExamQuestions(questions: Question[]): ExamAuditIssue[] {
  const issues: ExamAuditIssue[] = [];

  questions.forEach((q, i) => {
    const qNum = i + 1;
    if (!q.text || !q.text.trim()) {
      issues.push({ questionIndex: qNum, message: `Câu ${qNum}: Chưa có nội dung đề bài.` });
    }
    if (q.type === "multiple_choice") {
      if (q.answerUnknown) {
        issues.push({
          questionIndex: qNum,
          message: `Câu ${qNum}: Chưa xác định đáp án đúng từ file Word (đang mặc định chọn A).`,
        });
      }
      if (q.options.some((o) => !o.text || !o.text.trim())) {
        issues.push({
          questionIndex: qNum,
          message: `Câu ${qNum}: Có phương án lựa chọn A/B/C/D bị bỏ trống.`,
        });
      }
    } else if (q.type === "true_false") {
      if (!q.subQuestions || q.subQuestions.length !== 4) {
        issues.push({
          questionIndex: qNum,
          message: `Câu ${qNum}: Câu Đúng/Sai chuẩn BGD 2025 cần đủ 4 mệnh đề a, b, c, d (hiện có ${q.subQuestions?.length || 0} ý).`,
        });
      }
    } else if (q.type === "short_answer") {
      if (!q.correctAnswers || q.correctAnswers.length === 0 || !q.correctAnswers[0]?.trim()) {
        issues.push({
          questionIndex: qNum,
          message: `Câu ${qNum}: Câu trả lời ngắn chưa nhập đáp án đúng.`,
        });
      }
    }
  });

  return issues;
}

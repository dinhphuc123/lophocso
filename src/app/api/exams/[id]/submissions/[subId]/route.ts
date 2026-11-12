import { NextResponse } from "next/server";
import { getExamWithFallback, updateSubmission } from "@/lib/db";
import { summarize } from "@/lib/grader";
import { teacherOnly } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

/**
 * Teacher enters points/feedback for essay answers:
 * Supports both:
 * - { grades: { [questionId]: { points: number, feedback?: string } } } (from UI)
 * - { scores: { [questionId]: number } } (legacy/API)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  const { id, subId } = await params;
  const exam = await getExamWithFallback(id);
  if (!exam) {
    return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const rawScores = body?.scores && typeof body.scores === "object" ? body.scores : null;
  const rawGrades = body?.grades && typeof body.grades === "object" ? body.grades : null;

  if (!rawScores && !rawGrades) {
    return NextResponse.json({ success: false, error: "Thiếu điểm cần lưu" }, { status: 400 });
  }

  const updated = updateSubmission(subId, (s) => {
    if (s.examId !== id) return s;
    const details = s.details.map((d) => {
      let pts: number | undefined;
      let feedback: string | undefined = d.teacherFeedback;

      if (rawGrades && rawGrades[d.questionId] && typeof rawGrades[d.questionId] === "object") {
        const g = rawGrades[d.questionId] as { points?: unknown; feedback?: unknown };
        if (typeof g.points === "number" || typeof g.points === "string") {
          pts = Number(g.points);
        }
        if (typeof g.feedback === "string") {
          feedback = g.feedback;
        }
      } else if (rawScores && typeof rawScores[d.questionId] === "number") {
        pts = rawScores[d.questionId];
      }

      if (!d.needsManualGrade || pts === undefined || !Number.isFinite(pts)) return d;
      const earned = Math.min(Math.max(pts, 0), d.maxPoints);
      return {
        ...d,
        earnedPoints: earned,
        isCorrect: earned >= d.maxPoints,
        teacherFeedback: feedback,
        correctAnswer: `Giáo viên chấm: ${earned}/${d.maxPoints}`,
      };
    });
    return { ...s, details, ...summarize(details) };
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: "Không tìm thấy bài nộp" }, { status: 404 });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("submissions").upsert({
        id: updated.id,
        exam_id: updated.examId,
        student_name: updated.studentName,
        class_name: updated.studentClass,
        score: updated.score,
        total_score: updated.totalScore,
        answers: updated.answers,
        details: updated.details,
        started_at: updated.startedAt,
        submitted_at: updated.submittedAt,
      });
    } catch (err) {
      console.warn("Supabase updateSubmission sync error:", err);
    }
  }

  return NextResponse.json({ success: true, submission: updated });
}

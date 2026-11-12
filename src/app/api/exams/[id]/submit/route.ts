import { NextResponse } from "next/server";
import { getAttempt, getExamWithFallback, saveSubmission } from "@/lib/db";
import { gradeSubmission } from "@/lib/grader";
import { shuffleExam } from "@/lib/shuffler";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";

const GRACE_MS = 60_000; // network + auto-submit slack

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`submit:${clientIp(req)}`, 120, 60_000)) {
      return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
    }
    const { id } = await params;
    const exam = await getExamWithFallback(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
    }

    const { studentName, studentClass, answers, code, startedAt: clientStartedAt } = await req.json();
    const name = typeof studentName === "string" ? studentName.trim() : "";
    if (!name) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập họ và tên học sinh" }, { status: 400 });
    }
    const cls = typeof studentClass === "string" ? studentClass.trim() : "";

    // Check if student already submitted on local disk or Supabase
    let attempt = getAttempt(id, name, cls);
    if (attempt?.submitted) {
      return NextResponse.json({ success: false, error: "Em đã nộp bài này rồi" }, { status: 409 });
    }

    // On serverless (Vercel), /start and /submit may hit different lambda instances.
    // Reconstruct attempt safely if local /tmp was cold-started.
    const validClientStart =
      typeof clientStartedAt === "string" && Number.isFinite(Date.parse(clientStartedAt))
        ? clientStartedAt
        : new Date().toISOString();
    const effectiveStartedAt = attempt?.startedAt || validClientStart;

    if (Date.now() - Date.parse(effectiveStartedAt) > exam.durationMinutes * 60_000 + GRACE_MS) {
      return NextResponse.json({ success: false, error: "Đã hết thời gian làm bài" }, { status: 403 });
    }

    const clean = answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {};
    const targetExam = typeof code === "string" && code ? shuffleExam(exam, code) : exam;
    const submission = gradeSubmission(targetExam, attempt?.studentName || name, attempt?.studentClass || cls || "Tự do", clean, effectiveStartedAt);
    saveSubmission(submission);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from("submissions").upsert({
          id: submission.id,
          exam_id: submission.examId,
          student_name: submission.studentName,
          class_name: submission.studentClass,
          score: submission.score,
          total_score: submission.totalScore,
          answers: submission.answers,
          details: submission.details,
          started_at: submission.startedAt,
          submitted_at: submission.submittedAt,
        });
      } catch (err) {
        console.error("Supabase saveSubmission error:", err);
      }
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

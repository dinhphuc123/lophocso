import { NextResponse } from "next/server";
import { getAttempt, getExamById, saveSubmission } from "@/lib/db";
import { gradeSubmission } from "@/lib/grader";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";

const GRACE_MS = 60_000; // network + auto-submit slack

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`submit:${clientIp(req)}`, 120, 60_000)) {
      return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
    }
    const { id } = await params;
    const exam = getExamById(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
    }

    const { studentName, studentClass, answers } = await req.json();
    const name = typeof studentName === "string" ? studentName.trim() : "";
    if (!name) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập họ và tên học sinh" }, { status: 400 });
    }

    // the attempt created by /start is the only source of truth for start time and one-submission-only
    const attempt = getAttempt(id, name, typeof studentClass === "string" ? studentClass : "");
    if (!attempt) {
      return NextResponse.json({ success: false, error: "Chưa bắt đầu bài làm. Hãy tải lại trang và bấm Bắt đầu." }, { status: 403 });
    }
    if (attempt.submitted) {
      return NextResponse.json({ success: false, error: "Em đã nộp bài này rồi" }, { status: 409 });
    }
    if (Date.now() - Date.parse(attempt.startedAt) > exam.durationMinutes * 60_000 + GRACE_MS) {
      return NextResponse.json({ success: false, error: "Đã hết thời gian làm bài" }, { status: 403 });
    }

    const clean = answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {};
    const submission = gradeSubmission(exam, attempt.studentName, attempt.studentClass || "Tự do", clean, attempt.startedAt);
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

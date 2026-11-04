import { NextResponse } from "next/server";
import { getSubmissions, getExamById, getExamWithFallback, getActiveAttempts, saveSubmission } from "@/lib/db";
import { teacherOnly } from "@/lib/auth";
import { gradeSubmission } from "@/lib/grader";
import { shuffleExam } from "@/lib/shuffler";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const exam = getExamById(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
    }
    return NextResponse.json({ 
      success: true, 
      exam, 
      submissions: getSubmissions(id),
      activeAttempts: getActiveAttempts(id)
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const exam = await getExamWithFallback(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
    }

    const { studentName, studentClass, answers, code, overrideScore } = await req.json();
    const name = typeof studentName === "string" && studentName.trim() ? studentName.trim() : "Học sinh OMR";
    const cls = typeof studentClass === "string" && studentClass.trim() ? studentClass.trim() : exam.targetClass || "12A1";
    const cleanAnswers = answers && typeof answers === "object" && !Array.isArray(answers) ? answers : {};
    const targetExam = typeof code === "string" && code ? shuffleExam(exam, code) : exam;

    const submission = gradeSubmission(targetExam, name, cls, cleanAnswers, new Date().toISOString());
    if (typeof overrideScore === "number" && Number.isFinite(overrideScore)) {
      submission.score = Math.min(10, Math.max(0, Number(overrideScore.toFixed(2))));
    }

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
        console.error("Supabase OMR saveSubmission error:", err);
      }
    }

    return NextResponse.json({ success: true, submission });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

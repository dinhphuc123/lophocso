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
    const exam = await getExamWithFallback(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
    }

    let submissions = getSubmissions(id);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("exam_id", id)
          .order("submitted_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const localMap = new Map(submissions.map((s) => [s.id, s]));
          for (const row of data) {
            const subId = String(row.id);
            if (!localMap.has(subId)) {
              const details = Array.isArray(row.details) ? row.details : [];
              const mapped = {
                id: subId,
                examId: String(row.exam_id || id),
                studentName: String(row.student_name || "Học sinh"),
                studentClass: String(row.class_name || "Tự do"),
                startedAt: String(row.started_at || row.submitted_at || new Date().toISOString()),
                submittedAt: String(row.submitted_at || new Date().toISOString()),
                score: Number(row.score) || 0,
                totalScore: Number(row.total_score) || 10,
                correctCount: details.filter((d: { isCorrect?: boolean }) => d?.isCorrect).length,
                totalQuestions: exam.questions.length,
                answers: (row.answers && typeof row.answers === "object" ? row.answers : {}) as Record<string, unknown>,
                details,
              };
              saveSubmission(mapped);
              localMap.set(subId, mapped);
            }
          }
          submissions = Array.from(localMap.values());
        }
      } catch (err) {
        console.warn("Supabase fetch submissions fallback error:", err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      exam, 
      submissions,
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

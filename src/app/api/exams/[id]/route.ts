import { NextResponse } from "next/server";
import { getExamWithFallback, deleteExam, saveExam } from "@/lib/db";
import { isTeacher, teacherOnly } from "@/lib/auth";
import { toPublicExam } from "@/lib/sanitize";
import { shuffleExam } from "@/lib/shuffler";
import { getSupabase } from "@/lib/supabase";
import { Exam } from "@/lib/types";

// Teachers get the full exam; everyone else gets it without answer key or solutions.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const code = new URL(req.url).searchParams.get("code");
    let exam = await getExamWithFallback(id);

    if (!exam) {
      return NextResponse.json({ success: false, error: "Không tìm thấy đề thi" }, { status: 404 });
    }
    if (code) exam = shuffleExam(exam, code);

    if (await isTeacher(req)) return NextResponse.json({ success: true, exam });
    if (exam.status === "draft" || exam.status === "closed") {
      return NextResponse.json({ success: false, error: "Đề thi chưa mở hoặc đã đóng" }, { status: 403 });
    }
    return NextResponse.json({ success: true, exam: toPublicExam(exam) });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("exams").delete().eq("id", id);
        if (error) {
          console.error("Supabase deleteExam error:", error);
        }
      } catch (err) {
        console.error("Supabase deleteExam exception:", err);
      }
    }

    deleteExam(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();
    const { targetClass, durationMinutes, deadline, status, title, subject, questions } = body;

    let exam = await getExamWithFallback(id);
    const supabase = getSupabase();

    if (!exam) {
      return NextResponse.json({ success: false, error: "Không tìm thấy đề thi" }, { status: 404 });
    }

    if (targetClass !== undefined) exam.targetClass = String(targetClass).trim();
    if (durationMinutes !== undefined) exam.durationMinutes = Number(durationMinutes) || 45;
    if (deadline !== undefined) exam.deadline = deadline ? String(deadline) : undefined;
    if (status !== undefined) exam.status = status;
    if (title !== undefined) exam.title = String(title).trim();
    if (subject !== undefined) exam.subject = String(subject).trim();
    if (Array.isArray(questions)) exam.questions = questions;

    saveExam(exam);

    if (supabase) {
      const fullUpdate: Record<string, unknown> = {
        title: exam.title,
        subject: exam.subject,
        target_class: exam.targetClass,
        duration_minutes: exam.durationMinutes,
        duration: exam.durationMinutes,
        deadline: exam.deadline || null,
        status: exam.status,
        questions: exam.questions,
        total_questions: exam.questions.length,
        description: `Lớp: ${exam.targetClass} | Thời lượng: ${exam.durationMinutes} phút`,
        updated_at: new Date().toISOString(),
      };
      const res1 = await supabase.from("exams").update(fullUpdate).eq("id", id);
      if (res1.error) {
        const baseUpdate: Record<string, unknown> = {
          title: exam.title,
          duration: exam.durationMinutes,
          status: exam.status,
          questions: exam.questions,
          total_questions: exam.questions.length,
          description: `Lớp: ${exam.targetClass} | Thời lượng: ${exam.durationMinutes} phút`,
          updated_at: new Date().toISOString(),
        };
        await supabase.from("exams").update(baseUpdate).eq("id", id);
      }
    }

    return NextResponse.json({ success: true, exam });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

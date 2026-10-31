import { NextResponse } from "next/server";
import { getExamById, deleteExam, saveExam } from "@/lib/db";
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
    let exam = getExamById(id);

    if (!exam) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
          if (!error && data) {
            exam = {
              id: String(data.id),
              title: String(data.title),
              subject: String(data.subject || "Toán học"),
              targetClass: String(data.target_class || "Toàn trường"),
              durationMinutes: Number(data.duration_minutes || data.duration) || 45,
              deadline: data.deadline ? String(data.deadline) : undefined,
              status: (data.status as Exam["status"]) || "open",
              createdAt: String(data.created_at || new Date().toISOString()),
              questions: Array.isArray(data.questions) ? (data.questions as Exam["questions"]) : [],
            };
            saveExam(exam); // Cache in memory
          }
        } catch (err) {
          console.warn("Supabase getExamById error:", err);
        }
      }
    }

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
        await supabase.from("exams").delete().eq("id", id);
      } catch (err) {
        console.error("Supabase deleteExam error:", err);
      }
    }

    deleteExam(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

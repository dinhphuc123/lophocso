import { NextResponse } from "next/server";
import { getExams, saveExam } from "@/lib/db";
import { parseExamText } from "@/lib/parser";
import { teacherOnly } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Exam } from "@/lib/types";

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const exams: Exam[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title),
          subject: String(row.subject || "Toán học"),
          targetClass: String(row.target_class || "Toàn trường"),
          durationMinutes: Number(row.duration_minutes || row.duration) || 45,
          deadline: row.deadline ? String(row.deadline) : undefined,
          status: (row.status as Exam["status"]) || "open",
          createdAt: String(row.created_at || new Date().toISOString()),
          questions: Array.isArray(row.questions) ? (row.questions as Exam["questions"]) : [],
        }));
        return NextResponse.json({ success: true, exams });
      }
    } catch (err) {
      console.warn("Supabase getExams error:", err);
    }
  }

  try {
    return NextResponse.json({ success: true, exams: getExams() });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { title, subject, targetClass, durationMinutes, deadline, rawText, questions } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Tiêu đề đề thi không được để trống" }, { status: 400 });
    }

    let parsedQuestions = questions;
    if ((!parsedQuestions || parsedQuestions.length === 0) && rawText) {
      parsedQuestions = parseExamText(rawText);
    }

    if (!parsedQuestions || parsedQuestions.length === 0) {
      return NextResponse.json({ success: false, error: "Không tìm thấy câu hỏi hợp lệ nào trong nội dung" }, { status: 400 });
    }

    const id = `de-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newExam: Exam = {
      id,
      title: title.trim(),
      subject: subject || "Toán học",
      targetClass: targetClass || "Toàn trường",
      durationMinutes: Math.min(Math.max(Number(durationMinutes) || 45, 1), 300),
      deadline: deadline || undefined,
      status: "open",
      createdAt: new Date().toISOString(),
      questions: parsedQuestions,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("exams").upsert({
          id: newExam.id,
          title: newExam.title,
          subject: newExam.subject,
          target_class: newExam.targetClass,
          duration_minutes: newExam.durationMinutes,
          duration: newExam.durationMinutes,
          deadline: newExam.deadline,
          status: newExam.status,
          total_questions: newExam.questions.length,
          questions: newExam.questions,
          created_at: newExam.createdAt,
        });
        if (error) {
          console.error("Supabase upsert exam error:", error);
        }
      } catch (err) {
        console.error("Supabase saveExam failed:", err);
      }
    }

    saveExam(newExam);
    return NextResponse.json({ success: true, exam: newExam });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

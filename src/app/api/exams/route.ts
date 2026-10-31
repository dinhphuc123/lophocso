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

      if (!error && Array.isArray(data)) {
        const exams: Exam[] = data.map((row: Record<string, unknown>) => {
          let targetClass = String(row.target_class || "");
          if (!targetClass && typeof row.description === "string" && row.description.includes("Lớp: ")) {
            targetClass = row.description.split("|")[0].replace("Lớp: ", "").trim();
          }
          if (!targetClass) targetClass = "Toàn trường";

          return {
            id: String(row.id),
            title: String(row.title),
            subject: String(row.subject || "Toán học"),
            targetClass,
            durationMinutes: Number(row.duration_minutes || row.duration) || 45,
            deadline: row.deadline ? String(row.deadline) : undefined,
            status: (row.status as Exam["status"]) || "open",
            createdAt: String(row.created_at || new Date().toISOString()),
            questions: Array.isArray(row.questions) ? (row.questions as Exam["questions"]) : [],
          };
        });

        // Also cache in local memory for offline fallback
        for (const ex of exams) {
          saveExam(ex);
        }

        return NextResponse.json({ success: true, exams });
      } else if (error) {
        console.warn("Supabase getExams query error, falling back to local memory:", error);
      }
    } catch (err) {
      console.warn("Supabase getExams exception, falling back to local memory:", err);
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
      // 1. Attempt insert with extended schema
      const fullRecord: Record<string, unknown> = {
        id: newExam.id,
        title: newExam.title,
        subject: newExam.subject,
        grade: "12",
        status: newExam.status,
        duration: newExam.durationMinutes,
        duration_minutes: newExam.durationMinutes,
        target_class: newExam.targetClass,
        deadline: newExam.deadline || null,
        total_questions: newExam.questions.length,
        questions: newExam.questions,
        description: `Lớp: ${newExam.targetClass} | Thời lượng: ${newExam.durationMinutes} phút`,
        created_at: newExam.createdAt,
        updated_at: newExam.createdAt,
      };

      const res1 = await supabase.from("exams").upsert(fullRecord);
      if (res1.error) {
        console.warn("Supabase upsert with extended columns failed, falling back to base columns:", res1.error);

        // 2. Fallback to base schema in case user didn't run ALTER TABLE
        const baseRecord: Record<string, unknown> = {
          id: newExam.id,
          title: newExam.title,
          subject: newExam.subject,
          grade: "12",
          status: newExam.status,
          duration: newExam.durationMinutes,
          total_questions: newExam.questions.length,
          questions: newExam.questions,
          description: `Lớp: ${newExam.targetClass} | Thời lượng: ${newExam.durationMinutes} phút`,
          created_at: newExam.createdAt,
        };

        const res2 = await supabase.from("exams").upsert(baseRecord);
        if (res2.error) {
          console.error("Supabase upsert with base columns also failed:", res2.error);
          return NextResponse.json({
            success: false,
            error: `Lỗi Supabase: ${res2.error.message}. Vui lòng kiểm tra quyền RLS hoặc bảng exams trong Supabase.`,
          }, { status: 500 });
        }
      }
    }

    saveExam(newExam);
    return NextResponse.json({ success: true, exam: newExam });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

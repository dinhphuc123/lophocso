import { NextResponse } from "next/server";
import { getExams, saveExam } from "@/lib/db";
import { parseExamText } from "@/lib/parser";
import { teacherOnly } from "@/lib/auth";
import { Exam } from "@/lib/types";

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
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

    return NextResponse.json({ success: true, exam: saveExam(newExam) });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

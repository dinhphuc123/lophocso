import { NextResponse } from "next/server";
import { getExamById, deleteExam } from "@/lib/db";
import { isTeacher, teacherOnly } from "@/lib/auth";
import { toPublicExam } from "@/lib/sanitize";
import { shuffleExam } from "@/lib/shuffler";

// Teachers get the full exam; everyone else gets it without answer key or solutions.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const code = new URL(req.url).searchParams.get("code");
    let exam = getExamById(id);
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
    if (!deleteExam(id)) {
      return NextResponse.json({ success: false, error: "Đề thi không tồn tại hoặc đã bị xoá" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

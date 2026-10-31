import { NextResponse } from "next/server";
import { getExamById, startAttempt } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Student starts (or resumes) an attempt; the server records the start time. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`start:${clientIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ success: false, error: "Quá nhiều yêu cầu, thử lại sau" }, { status: 429 });
  }
  const { id } = await params;
  const exam = getExamById(id);
  if (!exam || exam.status === "draft" || exam.status === "closed") {
    return NextResponse.json({ success: false, error: "Đề thi chưa mở hoặc đã đóng" }, { status: 403 });
  }
  const { studentName, studentClass } = await req.json().catch(() => ({}));
  const name = typeof studentName === "string" ? studentName.trim().slice(0, 60) : "";
  if (!name) {
    return NextResponse.json({ success: false, error: "Vui lòng nhập họ và tên học sinh" }, { status: 400 });
  }
  const cls = typeof studentClass === "string" ? studentClass.trim().slice(0, 20) : "";
  const res = startAttempt(id, name, cls);
  if ("error" in res) {
    return NextResponse.json({ success: false, error: "Em đã nộp bài này rồi" }, { status: 409 });
  }
  return NextResponse.json({
    success: true,
    startedAt: res.attempt.startedAt,
    resumed: res.resumed,
    serverNow: new Date().toISOString(),
  });
}

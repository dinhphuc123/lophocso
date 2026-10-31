import { NextResponse } from "next/server";
import { getExamById, updateSubmission } from "@/lib/db";
import { summarize } from "@/lib/grader";
import { teacherOnly } from "@/lib/auth";

/** Teacher enters points for essay answers: body { scores: { [questionId]: number } } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; subId: string }> }) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  const { id, subId } = await params;
  if (!getExamById(id)) {
    return NextResponse.json({ success: false, error: "Đề thi không tồn tại" }, { status: 404 });
  }
  const { scores } = await req.json().catch(() => ({ scores: null }));
  if (!scores || typeof scores !== "object") {
    return NextResponse.json({ success: false, error: "Thiếu điểm cần lưu" }, { status: 400 });
  }

  const updated = updateSubmission(subId, (s) => {
    if (s.examId !== id) return s;
    const details = s.details.map((d) => {
      if (!d.needsManualGrade || typeof scores[d.questionId] !== "number") return d;
      const earned = Math.min(Math.max(scores[d.questionId], 0), d.maxPoints);
      return { ...d, earnedPoints: earned, isCorrect: earned >= d.maxPoints, correctAnswer: `Giáo viên chấm: ${earned}/${d.maxPoints}` };
    });
    return { ...s, details, ...summarize(details) };
  });
  if (!updated) {
    return NextResponse.json({ success: false, error: "Không tìm thấy bài nộp" }, { status: 404 });
  }
  return NextResponse.json({ success: true, submission: updated });
}

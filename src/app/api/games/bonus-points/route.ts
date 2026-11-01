import { NextResponse } from "next/server";
import { teacherOnly } from "@/lib/auth";
import { saveSubmission, saveExam } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { Exam, StudentSubmission } from "@/lib/types";

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { className, gameTitle, players } = body as {
      className: string;
      gameTitle: string;
      players: Array<{ name: string; bonusScore: number; gameScore: number; rank: number }>;
    };

    if (!className || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ success: false, error: "Dữ liệu cộng điểm không hợp lệ" }, { status: 400 });
    }

    const examId = `game-bonus-${Date.now().toString(36)}`;
    const bonusExam: Exam = {
      id: examId,
      title: `Điểm cộng: ${gameTitle || "Đấu trí lớp học"}`,
      subject: "Toán học",
      targetClass: className,
      durationMinutes: 15,
      status: "closed",
      createdAt: new Date().toISOString(),
      questions: [],
    };

    // Save virtual exam for gradebook column header
    saveExam(bonusExam);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from("exams").upsert({
          id: bonusExam.id,
          title: bonusExam.title,
          subject: bonusExam.subject,
          grade: "12",
          status: bonusExam.status,
          duration: bonusExam.durationMinutes,
          target_class: bonusExam.targetClass,
          total_questions: 0,
          questions: [],
          created_at: bonusExam.createdAt,
        });
      } catch (err) {
        console.warn("Supabase upsert bonusExam error:", err);
      }
    }

    // Create submissions for each awarded player
    const nowIso = new Date().toISOString();
    for (const p of players) {
      if (p.bonusScore <= 0) continue;
      const sub: StudentSubmission = {
        id: `sub-bonus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        examId: bonusExam.id,
        studentName: p.name,
        studentClass: className,
        score: Number(p.bonusScore.toFixed(1)),
        totalScore: 10,
        correctCount: p.rank <= 3 ? 3 : 1,
        totalQuestions: 3,
        answers: {},
        details: [],
        startedAt: nowIso,
        submittedAt: nowIso,
      };

      saveSubmission(sub);

      if (supabase) {
        try {
          await supabase.from("submissions").upsert({
            id: sub.id,
            exam_id: sub.examId,
            student_name: sub.studentName,
            class_name: sub.studentClass,
            score: sub.score,
            total_score: sub.totalScore,
            answers: {},
            details: [],
            started_at: sub.startedAt,
            submitted_at: sub.submittedAt,
          });
        } catch (err) {
          console.warn("Supabase upsert bonus submission error:", err);
        }
      }
    }

    return NextResponse.json({ success: true, examId: bonusExam.id });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

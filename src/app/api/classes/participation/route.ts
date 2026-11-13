import { NextResponse } from "next/server";
import { teacherOnly } from "@/lib/auth";
import { getClasses, saveClass, saveExam, saveSubmission } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import {
  ActivityCategory,
  ClassGroup,
  ClassRoom,
  Exam,
  ParticipationConfig,
  ParticipationLog,
  StudentSubmission,
} from "@/lib/types";
import {
  computeStudentParticipation,
  getEffectiveConfig,
} from "@/lib/participation";

async function syncClassToSupabase(cls: ClassRoom) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const extRecord = {
      id: cls.id,
      name: cls.name,
      grade: cls.grade || "12",
      students: cls.students || [],
      student_count: (cls.students || []).length,
      groups: cls.groups || [],
      participation_logs: cls.participationLogs || [],
      participation_config: cls.participationConfig || null,
    };
    const res = await supabase.from("classes").upsert(extRecord);
    if (res.error) {
      // Fallback to base columns if Supabase schema doesn't have groups / participation_logs yet
      await supabase.from("classes").upsert({
        id: cls.id,
        name: cls.name,
        grade: cls.grade || "12",
        students: cls.students || [],
        student_count: (cls.students || []).length,
      });
    }
  } catch (err) {
    console.warn("Supabase syncClassToSupabase error:", err);
  }
}

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { action, classId, className } = body;

    const classes = getClasses();
    let cls = classes.find(
      (c) =>
        (classId && c.id === classId) ||
        (className && c.name.toLowerCase() === String(className).toLowerCase())
    );

    if (!cls && classId) {
      cls = {
        id: String(classId),
        name: String(className || "12A1"),
        grade: "12",
        students: Array.isArray(body.students) ? body.students : [],
        groups: [],
        participationLogs: [],
      };
    }

    if (!cls) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy lớp học" },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const currentLogs = [...(cls.participationLogs || [])];
    const currentGroups = [...(cls.groups || [])];
    const currentConfig = getEffectiveConfig(cls);

    // 1. Add individual or bulk participation log(s)
    if (action === "add_logs") {
      const entries = Array.isArray(body.entries) ? body.entries : [];
      if (entries.length === 0) {
        return NextResponse.json(
          { success: false, error: "Chưa chọn học sinh để cộng điểm" },
          { status: 400 }
        );
      }

      const addedLogs: ParticipationLog[] = [];
      for (const item of entries) {
        const studentName = String(item.studentName || "").trim();
        const stars = Number(item.stars) || 1;
        const category = (item.category as ActivityCategory) || "speech";
        if (!studentName || stars === 0) continue;

        const newLog: ParticipationLog = {
          id: `plog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          classId: cls.id,
          studentName,
          category,
          stars,
          groupId: item.groupId ? String(item.groupId) : undefined,
          groupName: item.groupName ? String(item.groupName) : undefined,
          isPresenter: Boolean(item.isPresenter),
          note: item.note ? String(item.note).trim() : undefined,
          createdAt: nowIso,
        };
        addedLogs.push(newLog);
      }

      cls.participationLogs = [...addedLogs, ...currentLogs].slice(0, 2000);
      saveClass(cls);
      await syncClassToSupabase(cls);

      return NextResponse.json({
        success: true,
        class: cls,
        addedCount: addedLogs.length,
      });
    }

    // 2. Delete / Undo a specific log
    if (action === "delete_log") {
      const logId = String(body.logId || "");
      cls.participationLogs = currentLogs.filter((l) => l.id !== logId);
      saveClass(cls);
      await syncClassToSupabase(cls);
      return NextResponse.json({ success: true, class: cls });
    }

    // 3. Clear all logs for class (reset semester)
    if (action === "clear_logs") {
      cls.participationLogs = [];
      saveClass(cls);
      await syncClassToSupabase(cls);
      return NextResponse.json({ success: true, class: cls });
    }

    // 4. Save / update groups for the class
    if (action === "save_groups") {
      const groups = Array.isArray(body.groups) ? (body.groups as ClassGroup[]) : [];
      cls.groups = groups;
      saveClass(cls);
      await syncClassToSupabase(cls);
      return NextResponse.json({ success: true, class: cls });
    }

    // 5. Save / update conversion config for the class
    if (action === "save_config") {
      const nextCfg: ParticipationConfig = {
        ...currentConfig,
        ...(body.config || {}),
      };
      cls.participationConfig = nextCfg;
      saveClass(cls);
      await syncClassToSupabase(cls);
      return NextResponse.json({ success: true, class: cls });
    }

    // 6. Export accumulated stars into a standalone ĐGTX Gradebook Column
    if (action === "create_dgtx_column") {
      const columnTitle =
        typeof body.columnTitle === "string" && body.columnTitle.trim()
          ? body.columnTitle.trim()
          : `ĐGTX: Chuyên cần & Hoạt động nhóm (${new Date().toLocaleDateString("vi-VN")})`;

      const examId = `dgtx-part-${Date.now().toString(36)}`;
      const dgtxExam: Exam = {
        id: examId,
        title: columnTitle,
        subject: "Toán học",
        targetClass: cls.name,
        durationMinutes: 15,
        status: "closed",
        createdAt: nowIso,
        questions: [],
      };

      saveExam(dgtxExam);

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from("exams").upsert({
            id: dgtxExam.id,
            title: dgtxExam.title,
            subject: dgtxExam.subject,
            grade: cls.grade || "12",
            status: dgtxExam.status,
            duration: dgtxExam.durationMinutes,
            target_class: dgtxExam.targetClass,
            total_questions: 0,
            questions: [],
            created_at: dgtxExam.createdAt,
          });
        } catch (err) {
          console.warn("Supabase upsert dgtxExam error:", err);
        }
      }

      const createdSubs: StudentSubmission[] = [];
      for (const studentName of cls.students || []) {
        const bd = computeStudentParticipation(
          studentName,
          currentLogs,
          currentGroups,
          currentConfig
        );
        if (bd.totalStars <= 0) continue;

        const sub: StudentSubmission = {
          id: `sub-dgtx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          examId: dgtxExam.id,
          studentName,
          studentClass: cls.name,
          score: bd.standaloneScore10,
          totalScore: 10,
          correctCount: bd.totalStars,
          totalQuestions: currentConfig.standaloneColumnStars,
          answers: {},
          details: [],
          startedAt: nowIso,
          submittedAt: nowIso,
        };

        saveSubmission(sub);
        createdSubs.push(sub);

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
            console.warn("Supabase upsert dgtx submission error:", err);
          }
        }
      }

      return NextResponse.json({
        success: true,
        exam: dgtxExam,
        submissionsCount: createdSubs.length,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action không hợp lệ" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

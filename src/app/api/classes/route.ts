import { NextResponse } from "next/server";
import { deleteClass, getClasses, saveClass, getSubmissions, getExams } from "@/lib/db";
import { teacherOnly } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { ClassRoom } from "@/lib/types";

const parseStudents = (v: unknown): string[] =>
  (Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 200);

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const gradebook = url.searchParams.get("gradebook");
  const supabase = getSupabase();

  // 1. Sổ điểm: Trả về danh sách lớp kèm bài nộp để tổng hợp
  if (gradebook === "true") {
    let classes: ClassRoom[] = [];
    let submissions: Array<{
      id: string;
      examId: string;
      studentName: string;
      studentClass?: string;
      score: number;
      submittedAt: string;
    }> = [];
    let exams: Array<{ id: string; title: string }> = [];

    if (supabase) {
      try {
        const [cRes, sRes, eRes] = await Promise.all([
          supabase.from("classes").select("*").order("name"),
          supabase.from("submissions").select("id, exam_id, student_name, class_name, score, submitted_at"),
          supabase.from("exams").select("id, title"),
        ]);

        const localClasses = getClasses();
        const localMap = new Map(localClasses.map((c) => [c.id, c]));
        const localByName = new Map(localClasses.map((c) => [c.name.toLowerCase(), c]));

        if (cRes.data && Array.isArray(cRes.data)) {
          classes = cRes.data.map((c: Record<string, unknown>) => {
            const id = String(c.id);
            const name = String(c.name || "");
            const local = localMap.get(id) || localByName.get(name.toLowerCase());
            const supaStudents = Array.isArray(c.students) && c.students.length > 0 ? (c.students as string[]) : null;
            const supaGroups = Array.isArray(c.groups) ? (c.groups as ClassRoom["groups"]) : undefined;
            const supaLogs = Array.isArray(c.participation_logs) ? (c.participation_logs as ClassRoom["participationLogs"]) : undefined;
            const supaConfig = c.participation_config && typeof c.participation_config === "object" ? (c.participation_config as ClassRoom["participationConfig"]) : undefined;
            return {
              id,
              name,
              grade: c.grade ? String(c.grade) : undefined,
              students: supaStudents || local?.students || [],
              groups: supaGroups || local?.groups || [],
              participationLogs: supaLogs || local?.participationLogs || [],
              participationConfig: supaConfig || local?.participationConfig,
            };
          });
        }
        if (sRes.data && Array.isArray(sRes.data)) {
          submissions = sRes.data.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            examId: String(s.exam_id),
            studentName: String(s.student_name),
            studentClass: s.class_name ? String(s.class_name) : undefined,
            score: Number(s.score) || 0,
            submittedAt: String(s.submitted_at || new Date().toISOString()),
          }));
        }
        if (eRes.data && Array.isArray(eRes.data)) {
          exams = eRes.data.map((e: Record<string, unknown>) => ({
            id: String(e.id),
            title: String(e.title),
          }));
        }
      } catch (err) {
        console.warn("Supabase gradebook query error:", err);
      }
    }

    // Merge with local classes if any are missing from Supabase
    const supabaseClassIds = new Set(classes.map((c) => c.id));
    const localClasses = getClasses().filter((c) => !supabaseClassIds.has(c.id));
    const mergedClasses = [...classes, ...localClasses];

    // Merge with local submissions if Supabase has none
    if (submissions.length === 0) {
      submissions = getSubmissions().map((s) => ({
        id: s.id,
        examId: s.examId,
        studentName: s.studentName,
        studentClass: s.studentClass,
        score: s.score,
        submittedAt: s.submittedAt,
      }));
    }
    if (exams.length === 0) {
      exams = getExams().map((e) => ({ id: e.id, title: e.title }));
    }

    return NextResponse.json({ success: true, classes: mergedClasses, submissions, exams });
  }

  // 2. Danh sách lớp thông thường
  if (supabase) {
    try {
      const { data, error } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
      if (!error && data && Array.isArray(data)) {
        const localClasses = getClasses();
        const localMap = new Map(localClasses.map((c) => [c.id, c]));
        const localByName = new Map(localClasses.map((c) => [c.name.toLowerCase(), c]));

        const classes: ClassRoom[] = data.map((row: Record<string, unknown>) => {
          const id = String(row.id);
          const name = String(row.name || "");
          const local = localMap.get(id) || localByName.get(name.toLowerCase());
          const supaStudents = Array.isArray(row.students) && row.students.length > 0 ? (row.students as string[]) : null;
          const supaGroups = Array.isArray(row.groups) ? (row.groups as ClassRoom["groups"]) : undefined;
          const supaLogs = Array.isArray(row.participation_logs) ? (row.participation_logs as ClassRoom["participationLogs"]) : undefined;
          const supaConfig = row.participation_config && typeof row.participation_config === "object" ? (row.participation_config as ClassRoom["participationConfig"]) : undefined;
          return {
            id,
            name,
            grade: row.grade ? String(row.grade) : undefined,
            students: supaStudents || local?.students || [],
            groups: supaGroups || local?.groups || [],
            participationLogs: supaLogs || local?.participationLogs || [],
            participationConfig: supaConfig || local?.participationConfig,
          };
        });

        // Merge with any local classes not yet in Supabase
        const supabaseIds = new Set(classes.map((c) => c.id));
        const extraLocal = localClasses.filter((c) => !supabaseIds.has(c.id));
        const merged = [...classes, ...extraLocal];

        return NextResponse.json({ success: true, classes: merged });
      }
    } catch (e) {
      console.warn("Supabase classes query error:", e);
    }
  }

  return NextResponse.json({ success: true, classes: getClasses() });
}

/** Create or update: body { id?, name, grade?, students (array or newline text) } */
export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
  if (!name) return NextResponse.json({ success: false, error: "Tên lớp không được để trống" }, { status: 400 });

  const id = typeof body.id === "string" && body.id ? body.id : `lop-${Date.now().toString(36)}`;
  const existingLocal = getClasses().find((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase());
  const grade = typeof body.grade === "string" ? body.grade : existingLocal?.grade || "12";
  const students = body.students !== undefined ? parseStudents(body.students) : existingLocal?.students || [];
  const groups = Array.isArray(body.groups) ? body.groups : existingLocal?.groups || [];
  const participationLogs = Array.isArray(body.participationLogs)
    ? body.participationLogs
    : existingLocal?.participationLogs || [];
  const participationConfig =
    body.participationConfig && typeof body.participationConfig === "object"
      ? body.participationConfig
      : existingLocal?.participationConfig;

  const newClass: ClassRoom = {
    id,
    name,
    grade,
    students,
    groups,
    participationLogs,
    participationConfig,
  };

  // Always save locally first so the class is never lost
  saveClass(newClass);

  let supabaseWarning: string | null = null;
  let sqlToRun: string | null = null;

  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. Attempt insert with full columns
      const fullRecord = {
        id: newClass.id,
        name: newClass.name,
        grade: newClass.grade,
        students: newClass.students,
        student_count: newClass.students.length,
      };

      const res1 = await supabase.from("classes").upsert(fullRecord);
      if (res1.error) {
        console.warn("Supabase classes upsert fullRecord failed, retrying with base columns:", res1.error);
        const errMsg = res1.error.message || "";
        const isMissingStudentsCol = 
          errMsg.toLowerCase().includes("students") || 
          errMsg.toLowerCase().includes("column") || 
          errMsg.toLowerCase().includes("schema cache") ||
          res1.error.code === "PGRST204";
        const isRls = 
          errMsg.toLowerCase().includes("row-level security") || 
          errMsg.toLowerCase().includes("policy");

        if (isMissingStudentsCol) {
          supabaseWarning = `Bảng 'classes' trên Supabase đang thiếu cột 'students' (JSONB). Danh sách ${newClass.students.length} học sinh hiện đã được lưu tạm trong trình duyệt và máy chủ. Để đồng bộ vĩnh viễn lên Supabase, Thầy/Cô vui lòng bấm sao chép và chạy lệnh SQL bên dưới vào Supabase SQL Editor.`;
          sqlToRun = "ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS students JSONB DEFAULT '[]'::jsonb;\nALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;";
        } else if (isRls) {
          supabaseWarning = "Bảng 'classes' trên Supabase đang bật Row Level Security (RLS) chặn quyền ghi dữ liệu từ xa.";
          sqlToRun = "ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;";
        } else {
          supabaseWarning = `Cảnh báo Supabase khi lưu học sinh: ${errMsg}`;
          sqlToRun = "ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS students JSONB DEFAULT '[]'::jsonb;\nALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;";
        }

        // Fallback to base columns so at least the class row exists in Supabase
        const baseRecord = {
          id: newClass.id,
          name: newClass.name,
          grade: newClass.grade,
          student_count: newClass.students.length,
        };

        const res2 = await supabase.from("classes").upsert(baseRecord);
        if (res2.error) {
          console.error("Supabase classes upsert failed completely:", res2.error);
        }
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("Supabase saveClass exception:", err);
      supabaseWarning = `Đã lưu lớp cục bộ. Không thể kết nối Supabase: ${err}`;
    }
  }

  return NextResponse.json({ 
    success: true, 
    class: newClass,
    warning: supabaseWarning,
    sqlToRun: sqlToRun
  });
}

export async function DELETE(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ success: false, error: "Thiếu ID lớp" }, { status: 400 });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("classes").delete().eq("id", id);
    } catch (e) {
      console.error("Supabase deleteClass failed:", e);
    }
  }

  deleteClass(id);
  return NextResponse.json({ success: true });
}

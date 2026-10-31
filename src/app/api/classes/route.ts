import { NextResponse } from "next/server";
import { deleteClass, getClasses, saveClass } from "@/lib/db";
import { teacherOnly } from "@/lib/auth";

const parseStudents = (v: unknown): string[] =>
  (Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 200);

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  return NextResponse.json({ success: true, classes: getClasses() });
}

/** Create or update: body { id?, name, students (array or newline text) } */
export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
  if (!name) return NextResponse.json({ success: false, error: "Tên lớp không được để trống" }, { status: 400 });
  const id = typeof body.id === "string" && body.id ? body.id : `lop-${Date.now().toString(36)}`;
  const grade = typeof body.grade === "string" ? body.grade : undefined;
  return NextResponse.json({ success: true, class: saveClass({ id, name, grade, students: parseStudents(body.students) }) });
}

export async function DELETE(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!deleteClass(id)) return NextResponse.json({ success: false, error: "Không tìm thấy lớp" }, { status: 404 });
  return NextResponse.json({ success: true });
}

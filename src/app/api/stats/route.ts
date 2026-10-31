import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db";
import { teacherOnly } from "@/lib/auth";

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, stats: getDashboardStats() });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

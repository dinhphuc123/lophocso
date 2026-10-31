import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`hb:${clientIp(req)}`, 180, 60_000)) {
    return NextResponse.json({ success: false, error: "Rate limit" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { studentName, studentClass, answeredCount, totalQuestions } = body;

  const name = typeof studentName === "string" ? studentName.trim().slice(0, 60) : "";
  if (!name) {
    return NextResponse.json({ success: false, error: "Thiếu tên học sinh" }, { status: 400 });
  }

  const cls = typeof studentClass === "string" ? studentClass.trim().slice(0, 20) : "";
  const attempt = recordHeartbeat(
    id,
    name,
    cls,
    typeof answeredCount === "number" ? answeredCount : undefined,
    typeof totalQuestions === "number" ? totalQuestions : undefined
  );

  return NextResponse.json({ success: true, attempt });
}

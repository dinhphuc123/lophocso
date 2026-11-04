import { NextResponse } from "next/server";
import { createGameRoom, GameMode, viewRoom } from "@/lib/game-store";
import { teacherOnly } from "@/lib/auth";

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const { examId, mode = "arena" } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: "Thiếu mã đề thi examId" }, { status: 400 });
    }

    const room = await createGameRoom(examId, mode as GameMode);
    return NextResponse.json({ success: true, room: viewRoom(room) });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

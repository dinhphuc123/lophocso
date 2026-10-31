import { NextResponse } from "next/server";
import { createGameRoom, GameMode } from "@/lib/game-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, mode = "arena" } = body;

    if (!examId) {
      return NextResponse.json({ success: false, error: "Thiếu mã đề thi examId" }, { status: 400 });
    }

    const room = await createGameRoom(examId, mode as GameMode);
    return NextResponse.json({ success: true, room });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

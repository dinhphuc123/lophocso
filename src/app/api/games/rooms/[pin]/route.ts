import { NextResponse } from "next/server";
import { getGameRoom, joinGameRoom, submitPlayerAnswer, updateRoomControl, viewRoom } from "@/lib/game-store";
import { teacherOnly } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const room = await getGameRoom(pin);

  if (!room) {
    return NextResponse.json({ success: false, error: "Phòng thi không tồn tại" }, { status: 404 });
  }

  return NextResponse.json({ success: true, room: viewRoom(room) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  try {
    const { pin } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === "join") {
      const { playerName, avatar, playerId } = body;
      const res = await joinGameRoom(pin, playerName, avatar, playerId);
      return NextResponse.json({
        success: true,
        player: res.player,
        room: viewRoom(res.room),
      });
    }

    if (action === "answer") {
      const { playerId, questionIndex, answer } = body;
      const res = await submitPlayerAnswer(pin, playerId, questionIndex, answer);
      return NextResponse.json({
        success: true,
        isCorrect: res.isCorrect,
        earnedScore: res.earnedScore,
        room: viewRoom(res.room),
      });
    }

    if (action === "control") {
      const authErr = await teacherOnly(req);
      if (authErr) return authErr;

      const { command } = body; // 'start' | 'next' | 'reveal' | 'end'
      const updated = await updateRoomControl(pin, command);
      return NextResponse.json({ success: true, room: viewRoom(updated) });
    }

    return NextResponse.json({ success: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

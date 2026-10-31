"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { 
  Users, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  Flame,
  Heart,
  Volume2,
  VolumeX,
  Camera,
  Printer
} from "lucide-react";
import { RoomView, PlayerView } from "@/lib/game-store";
import { MathText } from "@/components/MathText";
import { playSfx, launchConfetti, setSoundMuted } from "@/lib/effects";

export default function GameHostPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);

  const [room, setRoom] = useState<RoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const prevRoomState = useRef<string | null>(null);
  const prevBossHp = useRef<number | null>(null);

  // Sound & FX transitions
  useEffect(() => {
    if (!room) return;
    if (prevRoomState.current && prevRoomState.current !== room.state) {
      if (room.state === "reveal") {
        playSfx(room.mode === "bomb" ? "explosion" : "correct");
      } else if (room.state === "ended") {
        playSfx("victory");
        launchConfetti(4500);
      }
    }
    prevRoomState.current = room.state;

    if (prevBossHp.current !== null && room.bossHp < prevBossHp.current) {
      playSfx("hit");
    }
    prevBossHp.current = room.bossHp;
  }, [room]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  // Real-time SSE with polling fallback
  useEffect(() => {
    let es: EventSource | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(() => {
        fetch(`/api/games/rooms/${pin}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.room) {
              setRoom(d.room);
              setLoading(false);
            } else if (d.error) {
              setError(d.error);
            }
          })
          .catch(() => {});
      }, 1500);
    };

    try {
      es = new EventSource(`/api/games/rooms/${pin}/events`);
      es.onmessage = (e) => {
        try {
          const view = JSON.parse(e.data) as RoomView;
          setRoom(view);
          setLoading(false);
        } catch {
          // ignore malformed
        }
      };
      es.onerror = () => {
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      es?.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [pin]);

  const sendControl = async (command: "start" | "next" | "reveal" | "end") => {
    try {
      const res = await fetch(`/api/games/rooms/${pin}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "control", command }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm">
        <Sparkles className="w-5 h-5 animate-spin text-amber-400 mr-2" />
        <span>Đang khởi tạo đấu trường lớp học...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-xl font-bold text-rose-400">⚠️ {error || "Phòng không tồn tại"}</div>
        <Link href="/teacher/games" className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700">
          Về danh sách trò chơi
        </Link>
      </div>
    );
  }

  const playersList: PlayerView[] = room.players || [];
  const currentQ = room.question;
  const answeredCount = playersList.filter((p) => p.answered).length;

  // ==========================================
  // VIEW 1: LOBBY
  // ==========================================
  if (room.state === "lobby") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {room.mode === "arena"
                ? "⚔️"
                : room.mode === "bomb"
                ? "💣"
                : room.mode === "farm"
                ? "🌾"
                : room.mode === "race"
                ? "🏎️"
                : room.mode === "golden_bell"
                ? "🔔"
                : "💃"}
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-amber-400 uppercase tracking-wider">
                {room.mode === "arena"
                  ? "Đấu Trường RPG"
                  : room.mode === "bomb"
                  ? "Gỡ Bom Sinh Tử"
                  : room.mode === "farm"
                  ? "Nông Trại Vui Vẻ"
                  : room.mode === "race"
                  ? "Đường Đua Tri Thức F1"
                  : room.mode === "golden_bell"
                  ? "Rung Chuông Vàng"
                  : "Vũ Điệu Tri Thức"}
              </h1>
              <p className="text-xs text-slate-400 line-clamp-1">{room.examTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/teacher/games/scan/${pin}`}
              target="_blank"
              className="px-3 py-1.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="Mở camera điện thoại quét thẻ trả lời của học sinh"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quét thẻ Mobile</span>
            </Link>

            <Link
              href="/teacher/cards-print"
              target="_blank"
              className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="In thẻ trắc nghiệm giấy A4 cho học sinh"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>In thẻ A4</span>
            </Link>

            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isMuted
                  ? "border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              }`}
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{playersList.length} Học sinh đã vào</span>
            </span>
          </div>
        </div>

        {/* Center: PIN Callout */}
        <div className="my-auto py-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">
              Học sinh dùng điện thoại hoặc máy tính truy cập:
            </p>
            <div className="inline-block px-6 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xl sm:text-2xl font-bold tracking-wider">
              {typeof window !== "undefined" ? window.location.origin : ""}/play
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest text-slate-400">Và nhập mã PIN:</div>
            <div className="text-6xl sm:text-8xl font-black tracking-widest font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 drop-shadow-md select-all">
              {room.pin}
            </div>
          </div>

          {/* Joined Players */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Danh sách học sinh sẵn sàng ({playersList.length}):</span>
            </div>

            {playersList.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-xs text-slate-500 animate-pulse">
                Đang đợi các em học sinh nhập mã PIN...
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-h-48 overflow-y-auto p-2">
                {playersList.map((p) => (
                  <div
                    key={p.id}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <Link
            href="/teacher/games"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Hủy phòng
          </Link>

          <button
            type="button"
            onClick={() => sendControl("start")}
            disabled={playersList.length === 0}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt đầu trận đấu ({playersList.length} HS)</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: GAMEPLAY (Question & Reveal)
  // ==========================================
  if (room.state === "question" || room.state === "reveal") {
    const isReveal = room.state === "reveal";
    const hpPercent = Math.max(0, Math.round((room.bossHp / room.maxBossHp) * 100));
    const activeBombSurvivors = playersList.filter((p) => (p.lives ?? 3) > 0);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 space-y-4">
        {/* Game Mode HUD Header */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Mode Arena: Boss HP */}
          {room.mode === "arena" && (
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="text-3xl animate-bounce">🐲</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    RỒNG HẮC LONG (BOSS THỬ THÁCH)
                  </span>
                  <span className="font-mono text-amber-300">
                    {room.bossHp} / {room.maxBossHp} HP
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode Bomb */}
          {room.mode === "bomb" && (
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">💣</span>
              <div>
                <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">
                  Gỡ bom khẩn cấp ({activeBombSurvivors.length}/{playersList.length} còn sống)
                </div>
                <div className="text-sm font-black text-amber-300">
                  Mỗi câu sai hoặc hết giờ trừ 1 tim!
                </div>
              </div>
            </div>
          )}

          {/* Mode Farm */}
          {room.mode === "farm" && (
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">🥕</span>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Nông trại trù phú
                </div>
                <div className="text-sm font-black text-emerald-300">
                  Tổng nông sản thu hoạch: {room.farmCrops} 🌾
                </div>
              </div>
            </div>
          )}

          {/* Mode Race: Đường đua tri thức F1 */}
          {room.mode === "race" && (
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">🏎️</span>
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Đường Đua Tri Thức F1 (Về đích tốc độ)
                </div>
                <div className="text-sm font-black text-blue-200">
                  Top 1 đang dẫn đầu: {playersList[0]?.name || "Chưa có"} ({playersList[0]?.score || 0} km/h)
                </div>
              </div>
            </div>
          )}

          {/* Mode Golden Bell: Rung chuông vàng */}
          {room.mode === "golden_bell" && (
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">🔔</span>
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Rung Chuông Vàng ({playersList.filter(p => (p.lives ?? 3) > 0).length}/{playersList.length} thí sinh trên sàn)
                </div>
                <div className="text-sm font-black text-amber-200">
                  Ai sẽ là người trụ lại cuối cùng rung chuông?
                </div>
              </div>
            </div>
          )}

          {/* Mode Dance: Vũ điệu tri thức */}
          {room.mode === "dance" && (
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">💃</span>
              <div>
                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  Vũ Điệu Tri Thức (Combo Dance Fever)
                </div>
                <div className="text-sm font-black text-purple-200">
                  Chuỗi combo cao nhất: {Math.max(0, ...playersList.map(p => p.streak || 0))} Hits 🔥
                </div>
              </div>
            </div>
          )}

          {/* Question Counter & Submissions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isMuted
                  ? "border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              }`}
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {room.remainingMs > 0 && !isReveal && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs font-mono font-bold">
                ⏳ {Math.ceil(room.remainingMs / 1000)}s
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
              Câu {room.currentQuestionIndex + 1} / {room.totalQuestions}
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold">
              Đã nộp: {answeredCount}/{playersList.length}
            </div>
          </div>
        </div>

        {/* Question Board */}
        {currentQ ? (
          <div className="my-auto max-w-4xl mx-auto w-full space-y-6 text-center py-4">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                {currentQ.level && `[${currentQ.level}] · `}
                {currentQ.type === "multiple_choice"
                  ? "Chọn 1 đáp án đúng"
                  : currentQ.type === "true_false"
                  ? "Đúng / Sai"
                  : "Trả lời ngắn"}
              </div>

              <div className="text-lg sm:text-2xl font-bold leading-relaxed text-slate-100">
                <MathText content={currentQ.text} />
              </div>

              {currentQ.imageUrl && (
                <div className="flex justify-center pt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentQ.imageUrl}
                    alt="Hình minh họa"
                    className="max-h-60 rounded-xl bg-white p-2 border border-slate-700 shadow-md object-contain"
                  />
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            {currentQ.type === "multiple_choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                {currentQ.options.map((opt) => {
                  const isCorrect = isReveal && opt.id === room.correct;
                  const bgColors: Record<string, string> = {
                    A: "bg-red-600 hover:bg-red-700 border-red-500",
                    B: "bg-blue-600 hover:bg-blue-700 border-blue-500",
                    C: "bg-amber-600 hover:bg-amber-700 border-amber-500",
                    D: "bg-emerald-600 hover:bg-emerald-700 border-emerald-500",
                  };

                  return (
                    <div
                      key={opt.id}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-white shadow-md flex items-center justify-between transition-all ${
                        bgColors[opt.id] || "bg-slate-800"
                      } ${isReveal && !isCorrect ? "opacity-30" : ""} ${
                        isReveal && isCorrect ? "ring-4 ring-white scale-102 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                          {opt.id}
                        </span>
                        <span className="text-sm sm:text-base font-semibold">
                          <MathText content={opt.text} />
                        </span>
                      </div>

                      {isCorrect && (
                        <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* True / False Reveal */}
            {isReveal && currentQ.type === "true_false" && typeof room.correct === "object" && room.correct !== null && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase">Đáp án Đúng/Sai:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(room.correct as Record<string, boolean>).map(([stmtId, val]) => (
                    <div key={stmtId} className="p-2 rounded-xl bg-slate-800 flex items-center justify-between text-xs font-bold">
                      <span>Ý {stmtId}:</span>
                      <span className={val ? "text-emerald-400" : "text-rose-400"}>
                        {val ? "ĐÚNG" : "SAI"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer Reveal */}
            {isReveal && currentQ.type === "short_answer" && (
              <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-bold text-center">
                🎯 Đáp án chấp nhận: <span className="font-mono text-white">{String(room.correct)}</span>
              </div>
            )}

            {/* Explanation */}
            {isReveal && room.explanation && (
              <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-800 text-blue-200 text-xs sm:text-sm text-left">
                <strong>💡 Lời giải chi tiết:</strong>{" "}
                <MathText content={room.explanation} />
              </div>
            )}
          </div>
        ) : (
          <div className="my-auto text-center text-slate-500">Đang tải câu hỏi...</div>
        )}

        {/* Host Control Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              PIN: <strong className="text-amber-400 font-mono text-sm">{room.pin}</strong>
            </span>
            <Link
              href={`/teacher/games/scan/${pin}`}
              target="_blank"
              className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-semibold flex items-center gap-1.5 transition"
              title="Mở camera điện thoại quét thẻ trả lời của học sinh"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quét thẻ ({answeredCount}/{playersList.length})</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!isReveal ? (
              <button
                type="button"
                onClick={() => sendControl("reveal")}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Hiển thị đáp án đúng
              </button>
            ) : (
              <button
                type="button"
                onClick={() => sendControl("next")}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <span>
                  {room.currentQuestionIndex + 1 < room.totalQuestions ? "Câu tiếp theo" : "Xem bảng xếp hạng"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: PODIUM & LEADERBOARD (Ended)
  // ==========================================
  const top1 = playersList[0];
  const top2 = playersList[1];
  const top3 = playersList[2];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500">
          🎉 TỔNG KẾT TRẬN ĐẤU 🎉
        </h1>
        <p className="text-xs text-slate-400">{room.examTitle}</p>
        {room.mode === "arena" && (
          <p className="text-sm font-bold text-emerald-400 pt-1">
            {room.winner === "class" ? "🏆 CẢ LỚP ĐÃ ĐÁNH BẠI ĐƯỢC BOSS RỒNG!" : "💀 BOSS RỒNG ĐÃ CHIẾN THẮNG!"}
          </p>
        )}
      </div>

      {/* Podium */}
      <div className="max-w-2xl mx-auto w-full flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4">
        {/* Top 2: Silver */}
        {top2 && (
          <div className="flex-1 flex flex-col items-center space-y-2">
            <div className="text-xs font-bold text-slate-300 line-clamp-1">{top2.name}</div>
            <div className="text-xs font-mono text-amber-300">{top2.score} đ</div>
            <div className="w-full h-32 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-2xl border-t-4 border-slate-400 flex items-center justify-center font-black text-2xl text-slate-300 shadow-lg">
              2
            </div>
          </div>
        )}

        {/* Top 1: Gold */}
        {top1 && (
          <div className="flex-1 flex flex-col items-center space-y-2 relative -top-6">
            <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
            <div className="text-sm font-black text-amber-300 line-clamp-1">{top1.name}</div>
            <div className="text-xs font-mono text-amber-200 font-bold">{top1.score} đ</div>
            <div className="w-full h-44 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl border-t-4 border-amber-300 flex items-center justify-center font-black text-4xl text-white shadow-xl shadow-amber-500/20">
              1
            </div>
          </div>
        )}

        {/* Top 3: Bronze */}
        {top3 && (
          <div className="flex-1 flex flex-col items-center space-y-2">
            <div className="text-xs font-bold text-amber-700 line-clamp-1">{top3.name}</div>
            <div className="text-xs font-mono text-amber-300">{top3.score} đ</div>
            <div className="w-full h-24 bg-gradient-to-t from-amber-950 to-amber-900 rounded-t-2xl border-t-4 border-amber-700 flex items-center justify-center font-black text-2xl text-amber-600 shadow-lg">
              3
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="max-w-xl mx-auto w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Bảng tổng sắp toàn lớp:</h3>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {playersList.map((p, idx) => (
            <div
              key={p.id}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                <span className="font-semibold text-slate-200">{p.name}</span>
                {room.mode === "bomb" && (
                  <span className="flex items-center text-rose-400 text-[10px]">
                    <Heart className="w-3 h-3 fill-rose-500 inline mr-0.5" /> {p.lives}
                  </span>
                )}
                {room.mode === "farm" && (
                  <span className="text-emerald-400 text-[10px]">
                    🌾 {p.crops}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-amber-400">{p.score} điểm</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link
          href="/teacher/games"
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
        >
          Trận đấu mới
        </Link>
        <Link
          href="/teacher/exams"
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors"
        >
          Về kho đề thi
        </Link>
      </div>
    </div>
  );
}

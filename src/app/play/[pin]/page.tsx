"use client";

import { useState, useEffect, use, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Check, 
  X, 
  Sparkles, 
  Flame, 
  Trophy, 
  Send,
  Heart
} from "lucide-react";
import { RoomView, PlayerView } from "@/lib/game-store";
import { playSfx, launchConfetti } from "@/lib/effects";

function PlaySessionContent({ pin }: { pin: string }) {
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";

  const [room, setRoom] = useState<RoomView | null>(null);
  const [player, setPlayer] = useState<PlayerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User input states
  const [selectedAnswer, setSelectedAnswer] = useState<unknown>(null);
  const [hasSubmittedThisQ, setHasSubmittedThisQ] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({});

  // 1. Join room (persisting player id across page reloads)
  useEffect(() => {
    const storageKey = `dethiso_player_${pin}`;
    const savedId = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

    const join = async () => {
      try {
        const res = await fetch(`/api/games/rooms/${pin}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join",
            playerId: savedId || undefined,
            playerName: initialName || (savedId ? "Học sinh" : `Học sinh ${Math.floor(10 + Math.random() * 90)}`),
          }),
        });
        const data = await res.json();
        if (data.success && data.player && data.room) {
          setPlayer(data.player);
          setRoom(data.room);
          try {
            localStorage.setItem(storageKey, data.player.id);
          } catch {}
        } else {
          setError(data.error || "Không thể tham gia phòng");
        }
      } catch {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    join();
  }, [pin, initialName]);

  // 2. Real-time updates via SSE with fallback polling
  useEffect(() => {
    if (!player) return;

    let es: EventSource | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const syncRoom = (view: RoomView) => {
      setRoom(view);
      const me = view.players?.find((p) => p.id === player.id);
      if (me) setPlayer(me);
    };

    const startPolling = () => {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(() => {
        fetch(`/api/games/rooms/${pin}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.room) syncRoom(d.room);
          })
          .catch(() => {});
      }, 1500);
    };

    try {
      es = new EventSource(`/api/games/rooms/${pin}/events`);
      es.onmessage = (e) => {
        try {
          const view = JSON.parse(e.data) as RoomView;
          syncRoom(view);
        } catch {}
      };
      es.onerror = () => startPolling();
    } catch {
      startPolling();
    }

    return () => {
      es?.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [pin, player?.id]);

  // Reset answers when question advances
  const currentIdx = room?.currentQuestionIndex ?? -1;
  const [prevIdx, setPrevIdx] = useState<number>(-1);
  useEffect(() => {
    if (currentIdx !== prevIdx) {
      setPrevIdx(currentIdx);
      setSelectedAnswer(null);
      setHasSubmittedThisQ(false);
      setShortAnswerInput("");
      setTfAnswers({});
    }
  }, [currentIdx, prevIdx]);

  // Audio & confetti transitions for student
  const prevRoomState = useRef<string | null>(null);
  useEffect(() => {
    if (!room) return;
    if (prevRoomState.current && prevRoomState.current !== room.state) {
      if (room.state === "reveal") {
        playSfx(player?.lastCorrect ? "correct" : "wrong");
      } else if (room.state === "ended") {
        playSfx("victory");
        const allPlayers = room.players ? [...room.players] : [];
        allPlayers.sort((a, b) => b.score - a.score);
        const myRank = allPlayers.findIndex((p) => p.id === player?.id) + 1;
        if (myRank <= 3 && myRank > 0) {
          launchConfetti(4000);
        }
      }
    }
    prevRoomState.current = room.state;
  }, [room, player]);

  // Countdown timer (client-side, synced with server remainingMs)
  const [countdown, setCountdown] = useState<number>(0);
  useEffect(() => {
    if (!room || room.state !== "question") { setCountdown(0); return; }
    // Initialise from server-provided remainingMs so client never drifts by more than 1 tick
    setCountdown(Math.ceil((room.remainingMs ?? 0) / 1000));
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.currentQuestionIndex, room?.state]);

  // Submit Answer
  const handleAnswer = async (ans: unknown) => {
    if (!player || !room || hasSubmittedThisQ || room.state !== "question") return;

    setSelectedAnswer(ans);
    setHasSubmittedThisQ(true);

    try {
      const res = await fetch(`/api/games/rooms/${pin}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          playerId: player.id,
          questionIndex: room.currentQuestionIndex,
          answer: ans,
        }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        const me = data.room.players?.find((p: PlayerView) => p.id === player.id);
        if (me) setPlayer(me);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm p-4 text-center">
        <Sparkles className="w-5 h-5 animate-spin text-amber-400 mr-2" />
        <span>Đang kết nối vào phòng thi...</span>
      </div>
    );
  }

  if (error || !room || !player) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="text-xl font-bold text-rose-400">⚠️ {error || "Phòng không tồn tại"}</div>
        <Link href="/play" className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700">
          Nhập lại mã PIN
        </Link>
      </div>
    );
  }

  const currentQ = room.question;
  // Bug fix: golden_bell cũng loại học sinh khi lives = 0
  const isEliminated = (room.mode === "bomb" || room.mode === "golden_bell") && (player.lives ?? 3) <= 0;

  // ==========================================
  // VIEW: LOBBY
  // ==========================================
  if (room.state === "lobby") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 text-center">
        <div className="text-xs text-slate-400 font-mono">PIN: {pin}</div>

        <div className="space-y-4 my-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 mx-auto flex items-center justify-center text-3xl font-black shadow-xl shadow-amber-500/20">
            {player.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{player.name}</h2>
            <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Đã vào phòng thi an toàn!</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-xs mx-auto animate-pulse">
            👀 Hãy nhìn lên màn hình máy chiếu của thầy cô và sẵn sàng nhé!
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Khảo Thí Số · Game tương tác lớp học
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: REVEAL
  // ==========================================
  if (room.state === "reveal") {
    const isCorrect = player.lastCorrect ?? false;
    const earned = player.lastEarned ?? 0;

    return (
      <div className={`min-h-screen text-white flex flex-col justify-between p-6 text-center ${
        isCorrect ? "bg-emerald-950" : "bg-rose-950"
      }`}>
        <div className="text-xs opacity-75 font-mono">CÂU {room.currentQuestionIndex + 1}</div>

        <div className="space-y-4 my-auto animate-in zoom-in-75 duration-300">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl shadow-2xl ${
            isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {isCorrect ? <Check className="w-12 h-12 stroke-[3]" /> : <X className="w-12 h-12 stroke-[3]" />}
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">
              {isCorrect ? "CHÍNH XÁC!" : "CHƯA ĐÚNG!"}
            </h2>
            {isCorrect && (
              <div className="text-base font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-300" />
                <span>+{earned} ĐIỂM (Chuỗi x{player.streak})</span>
              </div>
            )}
            {!isCorrect && (
              <p className="text-xs opacity-80">
                {room.mode === "bomb"
                  ? "💥 Bạn bị nổ bom và mất 1 tim!"
                  : room.mode === "golden_bell"
                  ? "🔔 Sai rồi — bạn bị loại khỏi sân đấu!"
                  : room.mode === "dance"
                  ? "😢 Chuỗi combo bị phá vỡ! Lấy lại nhịp nào!"
                  : room.mode === "race"
                  ? "🏎️ Trượt! Đối thủ đang bứt phá về đích rồi!"
                  : "Đừng nản, tập trung cho câu tiếp theo nhé!"}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 max-w-xs mx-auto text-xs font-mono font-bold">
            Tổng điểm của em: <span className="text-amber-300 text-base">{player.score}</span> điểm
          </div>
        </div>

        <div className="text-xs opacity-75 animate-pulse">
          Chờ thầy cô chuyển sang câu hỏi kế tiếp...
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ENDED
  // ==========================================
  if (room.state === "ended") {
    const allPlayers: PlayerView[] = room.players ? [...room.players] : [];
    allPlayers.sort((a, b) => b.score - a.score);
    const myRank = allPlayers.findIndex((p) => p.id === player.id) + 1;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 text-center space-y-6">
        <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
          KẾT THÚC TRẬN ĐẤU
        </div>

        <div className="space-y-4 my-auto">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{player.name}</h2>
            <div className="text-4xl font-black text-amber-400 font-mono my-2">
              {player.score} <span className="text-sm font-normal text-slate-400">điểm</span>
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">
              Xếp hạng: #{myRank > 0 ? myRank : "-"} trên {allPlayers.length} bạn
            </div>
          </div>
        </div>

        <Link
          href="/play"
          className="w-full py-3.5 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-wider"
        >
          Tham gia phòng khác
        </Link>
      </div>
    );
  }

  // ==========================================
  // VIEW: ELIMINATED (Bomb / Golden Bell)
  // ==========================================
  if (isEliminated) {
    const isGoldenBell = room.mode === "golden_bell";
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 text-center space-y-4">
        <div className={`text-xs font-bold uppercase tracking-widest ${isGoldenBell ? "text-amber-400" : "text-rose-400"}`}>
          {isGoldenBell ? "Rung chuông vàng" : "Gỡ bom sinh tử"}
        </div>
        <div className="space-y-4 my-auto">
          <div className="text-6xl animate-bounce">{isGoldenBell ? "🔔" : "💥"}</div>
          <h2 className={`text-2xl font-black ${isGoldenBell ? "text-amber-400" : "text-rose-400"}`}>
            {isGoldenBell ? "BẠN ĐÃ BỊ LOẠI!" : "BẠN ĐÃ HẾT TIM!"}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isGoldenBell
              ? "Em trả lời sai và rời sân đấu. Hãy nhìn lên màn hình cổ vũ các bạn còn lại!"
              : "Em đã bị nổ bom 3 lần. Giờ hãy nhìn lên màn hình cổ vũ các bạn còn lại nhé!"}
          </p>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300">
            Điểm tích lũy: {player.score} điểm
          </div>

          {/* Live leaderboard for spectators */}
          <div className="mt-4 max-w-xs mx-auto space-y-1.5 max-h-48 overflow-y-auto">
            {room.players
              .filter((p) => (p.lives ?? 0) > 0)
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold">#{i + 1}</span>
                  <span className="text-slate-200 font-semibold flex-1 text-left ml-2 truncate">{p.name}</span>
                  <span className="font-mono text-amber-300">{p.score} đ</span>
                </div>
              ))}
          </div>
        </div>
        <div className="text-[11px] text-slate-600">Khảo Thí Số · Chế độ khán giả</div>
      </div>
    );
  }

  // ==========================================
  // VIEW: QUESTION (Gameplay Answering)
  // ==========================================
  // timerPct/timerColor computed from top-level countdown state
  const timerPct = room.timeLimitSec > 0 ? (countdown / room.timeLimitSec) * 100 : 0;
  const timerColor = timerPct > 50 ? "bg-emerald-500" : timerPct > 25 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 space-y-4 select-none">
      {/* Top Status Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-800">
          <span className="text-amber-400">
            Câu {room.currentQuestionIndex + 1} / {room.totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            {/* Mode-specific HUD */}
            {room.mode === "bomb" && (
              <span className="flex items-center text-rose-400">
                {Array.from({ length: player.lives ?? 3 }).map((_, i) => (
                  <Heart key={i} className="w-3.5 h-3.5 fill-rose-500 inline" />
                ))}
              </span>
            )}
            {room.mode === "golden_bell" && (
              <span className="text-amber-400 font-bold">🔔 {player.lives ?? 1} mạng</span>
            )}
            {room.mode === "farm" && (
              <span className="text-emerald-400 text-xs">🌾 {player.crops ?? 0}</span>
            )}
            {room.mode === "dance" && player.streak > 0 && (
              <span className="text-purple-400 font-bold text-xs">🔥 ×{player.streak} Combo</span>
            )}
            {room.mode === "race" && (
              <span className="text-blue-400 font-bold text-xs">🏎️ {player.score} km/h</span>
            )}
            <span className="text-slate-300">{player.name}</span>
            <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
              {player.score} đ
            </span>
          </div>
        </div>

        {/* Countdown Timer Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
          <span className={`text-xs font-black font-mono w-6 text-right ${countdown <= 5 ? "text-rose-400 animate-pulse" : "text-slate-300"}`}>
            {countdown}
          </span>
        </div>
      </div>

      {/* When answer submitted: waiting state */}
      {hasSubmittedThisQ ? (
        <div className="my-auto text-center space-y-4 animate-in fade-in-50 duration-200">
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-400/10">
            {typeof selectedAnswer === "string" ? selectedAnswer : "✓"}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Đã ghi nhận câu trả lời!</h3>
            <p className="text-xs text-slate-400">Hãy quan sát màn hình lớp học để xem kết quả...</p>
          </div>
        </div>
      ) : (
        /* Action buttons for answering */
        <div className="my-auto w-full max-w-md mx-auto space-y-3">
          {/* MULTIPLE CHOICE */}
          {(!currentQ || currentQ.type === "multiple_choice") && (
            <div className="grid grid-cols-2 gap-3.5 h-[65vh]">
              {(["A", "B", "C", "D"] as const).map((ch) => {
                const colors: Record<string, string> = {
                  A: "bg-red-600 active:bg-red-700 shadow-red-600/30",
                  B: "bg-blue-600 active:bg-blue-700 shadow-blue-600/30",
                  C: "bg-amber-600 active:bg-amber-700 shadow-amber-600/30",
                  D: "bg-emerald-600 active:bg-emerald-700 shadow-emerald-600/30",
                };

                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleAnswer(ch)}
                    className={`${colors[ch]} rounded-3xl text-white font-black text-4xl flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          )}

          {/* TRUE / FALSE */}
          {currentQ?.type === "true_false" && (
            <div className="space-y-4 p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold text-amber-400 uppercase text-center">
                Chọn Đúng / Sai cho từng ý:
              </div>
              <div className="space-y-2.5">
                {(["a", "b", "c", "d"] as const).map((stmtId) => {
                  const val = tfAnswers[stmtId];
                  return (
                    <div key={stmtId} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="font-bold text-sm text-slate-200 uppercase">Ý {stmtId})</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTfAnswers({ ...tfAnswers, [stmtId]: true })}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            val === true ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => setTfAnswers({ ...tfAnswers, [stmtId]: false })}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            val === false ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={Object.keys(tfAnswers).length < 4}
                onClick={() => handleAnswer(tfAnswers)}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                Xác nhận nộp bài Đúng/Sai
              </button>
            </div>
          )}

          {/* SHORT ANSWER */}
          {currentQ?.type === "short_answer" && (
            <div className="space-y-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center">
              <label className="text-xs font-bold text-slate-300">
                Nhập kết quả hoặc số câu trả lời:
              </label>
              <input
                type="text"
                autoFocus
                value={shortAnswerInput}
                onChange={(e) => setShortAnswerInput(e.target.value)}
                placeholder="VD: 4.9 hoặc 43"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border-2 border-slate-700 text-center font-bold text-xl text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                disabled={!shortAnswerInput.trim()}
                onClick={() => handleAnswer(shortAnswerInput.trim())}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Gửi đáp án</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="text-center text-[10px] text-slate-600">
        Khảo Thí Số · Bấm nhanh để nhận thêm điểm bạo kích tốc độ!
      </div>
    </div>
  );
}

export default function PlayRoomPage({ params }: { params: Promise<{ pin: string }> }) {
  const resolvedParams = use(params);
  const pin = resolvedParams.pin;

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Đang tải...</div>}>
      <PlaySessionContent pin={pin} />
    </Suspense>
  );
}

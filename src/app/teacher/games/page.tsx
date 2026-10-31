"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords, Bomb, Sprout, Sparkles, Users, Play, Trophy, Bell, Music, Gauge } from "lucide-react";
import { Exam } from "@/lib/types";

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExamId = searchParams.get("examId");
  const modeParam = searchParams.get("mode") as "arena" | "bomb" | "farm" | "race" | "golden_bell" | "dance" | null;

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(preselectedExamId || "");
  const [selectedMode, setSelectedMode] = useState<"arena" | "bomb" | "farm" | "race" | "golden_bell" | "dance">(
    modeParam && ["arena", "bomb", "farm", "race", "golden_bell", "dance"].includes(modeParam) ? modeParam : "race"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMode = (mode: "arena" | "bomb" | "farm" | "race" | "golden_bell" | "dance") => {
    setSelectedMode(mode);
    router.replace(`/teacher/games?mode=${mode}`, { scroll: false });
  };

  useEffect(() => {
    if (modeParam && ["arena", "bomb", "farm", "race", "golden_bell", "dance"].includes(modeParam)) {
      setSelectedMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setExams(d.exams || []);
          if (!selectedExamId && d.exams?.length > 0) {
            setSelectedExamId(d.exams[0].id);
          }
        }
      });
  }, [selectedExamId]);

  const handleCreateRoom = async () => {
    if (!selectedExamId) {
      setError("Vui lòng chọn một đề thi để bắt đầu");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExamId, mode: selectedMode }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        router.push(`/teacher/games/host/${data.room.pin}`);
      } else {
        setError(data.error || "Không thể tạo phòng game");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kho đề thi</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <span>🎮 Gamification Lớp Học</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              MỚI
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Biến đề kiểm tra thành trò chơi tương tác kịch tính — học sinh tham gia bằng điện thoại qua mã PIN
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 1. Choose Game Mode */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">1. Chọn chế độ trò chơi:</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Mode 1: Race - Đường đua tri thức */}
          <div
            onClick={() => handleSelectMode("race")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "race"
                ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md"
                : "border-border bg-card hover:border-blue-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>Đường đua tri thức</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold">HOT</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cuộc đua xe F1 tốc độ cao. Trả lời đúng và cực nhanh để phóng vọt về đích trước đối thủ!
              </p>
            </div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Tốc độ · Bứt phá F1
            </div>
          </div>

          {/* Mode 2: Golden Bell - Rung chuông vàng */}
          <div
            onClick={() => handleSelectMode("golden_bell")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "golden_bell"
                ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 shadow-md"
                : "border-border bg-card hover:border-amber-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>Rung chuông vàng</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-semibold">HOT</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Đấu trường sinh tồn học thuật kinh điển. Sai 1 câu rời sàn thi đấu, người trụ lại cuối cùng rung chuông!
              </p>
            </div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Kịch tính · Loại trực tiếp
            </div>
          </div>

          {/* Mode 3: Dance - Vũ điệu tri thức */}
          <div
            onClick={() => handleSelectMode("dance")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "dance"
                ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 shadow-md"
                : "border-border bg-card hover:border-purple-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>Vũ điệu tri thức</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-semibold">HOT</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Âm nhạc rộn rã, chuỗi liên hoàn (Streak combo). Học sinh nhảy múa theo nhịp đúng của từng phương án!
              </p>
            </div>
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
              Âm nhạc · Chuỗi combo
            </div>
          </div>

          {/* Mode 4: Arena */}
          <div
            onClick={() => handleSelectMode("arena")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "arena"
                ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 shadow-md"
                : "border-border bg-card hover:border-amber-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Đấu trường RPG (Boss Battle)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cả lớp hiệp lực đánh Rồng Lửa. Trả lời đúng gây sát thương, trả lời nhanh gây bạo kích!
              </p>
            </div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Hào hứng · Đối kháng
            </div>
          </div>

          {/* Mode 5: Bomb */}
          <div
            onClick={() => handleSelectMode("bomb")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "bomb"
                ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 shadow-md"
                : "border-border bg-card hover:border-rose-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
              <Bomb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Gỡ bom sinh tử (Bomb Defusal)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Đồng hồ đếm ngược từng giây. Chọn đúng phương án để cắt dây an toàn trước khi bom nổ!
              </p>
            </div>
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              Nghẹt thở · Tốc độ
            </div>
          </div>

          {/* Mode 6: Farm */}
          <div
            onClick={() => handleSelectMode("farm")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
              selectedMode === "farm"
                ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md"
                : "border-border bg-card hover:border-emerald-300"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Nông trại vui vẻ (Farm Harvest)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Trả lời đúng để tưới nước, gieo hạt và thu hoạch củ cải, cà rốt xây dựng nông trại trù phú.
              </p>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Thư giãn · Tích lũy
            </div>
          </div>
        </div>
      </div>

      {/* 2. Choose Exam */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-bold text-foreground">2. Chọn đề thi áp dụng:</label>
        {exams.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed text-xs text-muted-foreground text-center">
            Chưa có đề thi nào. Hãy tạo đề thi trước khi mở phòng game!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
            {exams.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setSelectedExamId(ex.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedExamId === ex.id
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-foreground font-semibold"
                    : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold line-clamp-1">{ex.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ex.subject} · {ex.questions.length} câu · Lớp {ex.targetClass}
                  </div>
                </div>
                {selectedExamId === ex.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 ml-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Submit */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Học sinh vào thi qua link <strong>/play</strong> hoặc quét mã QR trên màn hình chiếu</span>
        </div>

        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={loading || !selectedExamId}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>Tạo phòng &amp; Chiếu lên màn hình</span>
        </button>
      </div>
    </div>
  );
}

export default function TeacherGamesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Đang tải...</div>}>
      <GamesContent />
    </Suspense>
  );
}

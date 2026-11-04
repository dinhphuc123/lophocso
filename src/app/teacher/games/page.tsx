"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Swords,
  Bomb,
  Sprout,
  Sparkles,
  Users,
  Play,
  Trophy,
  Bell,
  Music,
  Gauge,
  Gamepad2,
  Clock,
  BookOpen,
  Presentation,
  Shield,
} from "lucide-react";
import { Exam } from "@/lib/types";
import { GameMode } from "@/lib/game-store";
import { CYBER_GATES_PACKS } from "@/lib/cyber-gates-presets";
import { ARCADE_GAMES, ARCADE_CATEGORIES } from "@/lib/arcade-catalog";

const VALID_MODES: GameMode[] = ["arena", "bomb", "farm", "race", "golden_bell", "dance", "cyber_gates"];

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExamId = searchParams.get("examId");
  const modeParam = searchParams.get("mode") as GameMode | null;
  const tabParam = searchParams.get("tab") as "multiplayer" | "arcade" | null;

  const [activeTab, setActiveTab] = useState<"multiplayer" | "arcade">(
    tabParam === "arcade" ? "arcade" : "multiplayer"
  );
  const [selectedArcadeCat, setSelectedArcadeCat] = useState<string>("Tất cả");

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(preselectedExamId || CYBER_GATES_PACKS[0].exam.id);
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    modeParam && VALID_MODES.includes(modeParam) ? modeParam : "cyber_gates"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    if (mode === "cyber_gates" && !selectedExamId.startsWith("preset-cyber-gates-")) {
      setSelectedExamId(CYBER_GATES_PACKS[0].exam.id);
    }
    router.replace(`/teacher/games?mode=${mode}&tab=multiplayer`, { scroll: false });
  };

  const handleSwitchTab = (tab: "multiplayer" | "arcade") => {
    setActiveTab(tab);
    router.replace(`/teacher/games?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (modeParam && VALID_MODES.includes(modeParam)) {
      setSelectedMode(modeParam);
    }
    if (tabParam === "arcade") {
      setActiveTab("arcade");
    }
  }, [modeParam, tabParam]);

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

  const filteredArcadeGames =
    selectedArcadeCat === "Tất cả"
      ? ARCADE_GAMES
      : ARCADE_GAMES.filter((g) => g.category === selectedArcadeCat);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
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
            Tổ chức trò chơi học tập tương tác: đấu trường trực tiếp bằng mã PIN hoặc trình chiếu game khởi động tư duy.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
          <button
            type="button"
            onClick={() => handleSwitchTab("multiplayer")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "multiplayer"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Đấu trường Đề thi (PIN)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab("arcade")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "arcade"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Game Khởi động (Hạt Mầm)</span>
          </button>
        </div>
      </div>

      {activeTab === "multiplayer" ? (
        <>
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              {error.includes("đề thi") && (
                <Link
                  href="/teacher/exams/create"
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 ml-2"
                >
                  + Tạo đề thi mới
                </Link>
              )}
            </div>
          )}

          {/* 1. Choose Game Mode */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">1. Chọn chế độ trò chơi:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mode 7 (Featured): Cyber Gates - Mật vụ Toán học: Giải mã 5 Cánh Cổng */}
              <div
                onClick={() => handleSelectMode("cyber_gates")}
                className={`sm:col-span-3 p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                  selectedMode === "cyber_gates"
                    ? "border-cyan-500 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 text-white shadow-lg shadow-cyan-500/20"
                    : "border-cyan-500/40 bg-card hover:border-cyan-400"
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 flex items-center justify-center shrink-0">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-black text-base ${selectedMode === "cyber_gates" ? "text-cyan-300" : "text-foreground"}`}>
                        🛡️ Mật Vụ Toán Học: Giải Mã 5 Cánh Cổng Bí Ẩn
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold uppercase">
                        MỚI · CHẾ ĐỘ THỨ 7
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${selectedMode === "cyber_gates" ? "text-slate-200" : "text-muted-foreground"}`}>
                      Cả lớp hóa thân thành Đội Đặc Nhiệm Toán Học vượt qua lộ trình Zic-zắc 5 Cánh Cổng, mở Kính Lúp Manh Mối, nghe Giọng Đọc Trợ Lý AI, thu thập 5 Chìa Khóa Vàng &amp; ghép 5 Mảnh Khiên Hộ Vệ!
                    </p>
                  </div>
                </div>
                <div className={`text-[11px] font-extrabold uppercase tracking-wider shrink-0 px-3 py-1.5 rounded-xl border ${
                  selectedMode === "cyber_gates"
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                }`}>
                  🔑 5 Cánh Cổng · Kính Lúp · Giọng Đọc AI
                </div>
              </div>

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

          {/* 2. Choose Exam or Preset Pack */}
          {selectedMode === "cyber_gates" && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>2A. Chọn Bộ Chuyên Đề 5 Cánh Cổng Toán THPT (Sẵn dùng kèm Hình Mô Phỏng SVG &amp; Kính Lúp Manh Mối):</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-extrabold">
                  KHUYÊN DÙNG
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {CYBER_GATES_PACKS.map((pack) => {
                  const isSelected = selectedExamId === pack.exam.id;
                  return (
                    <div
                      key={pack.exam.id}
                      onClick={() => setSelectedExamId(pack.exam.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-950/90 text-white shadow-md shadow-cyan-500/20"
                          : "border-border bg-card hover:border-cyan-400 text-foreground"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-amber-400 text-slate-950" : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                          }`}>
                            {pack.packTag}
                          </span>
                          <span className={`text-[10px] font-bold ${isSelected ? "text-cyan-300" : "text-muted-foreground"}`}>
                            5 Cổng · Lớp {pack.exam.targetClass}
                          </span>
                        </div>
                        <div className="font-extrabold text-xs sm:text-sm leading-snug">
                          {pack.exam.title}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isSelected ? "text-slate-300" : "text-muted-foreground"}`}>
                          {pack.packSummary}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[10px] font-bold">
                        <span className={isSelected ? "text-emerald-300" : "text-muted-foreground"}>
                          {pack.stages.map((s) => s.icon).join(" ")} 5 Mảnh Khiên
                        </span>
                        {isSelected && <span className="text-amber-300">✓ Đã chọn</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-foreground">
              {selectedMode === "cyber_gates" ? "2B. Hoặc chọn Đề thi bất kỳ từ Kho đề của bạn:" : "2. Chọn đề thi áp dụng:"}
            </label>
            {exams.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border bg-card text-xs text-muted-foreground text-center space-y-3">
                <div>
                  {selectedMode === "cyber_gates"
                    ? "Bạn có thể dùng ngay 3 Bộ Chuyên Đề 5 Cánh Cổng ở mục 2A phía trên, hoặc tạo thêm đề thi riêng."
                    : "Chưa có đề thi nào trong hệ thống. Hãy tạo đề thi trước khi mở phòng game!"}
                </div>
                <div>
                  <Link
                    href="/teacher/exams/create"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    + Tạo đề thi mới ngay
                  </Link>
                </div>
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
        </>
      ) : (
        /* Arcade / Hat Mam 2D Games Tab */
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {ARCADE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedArcadeCat(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedArcadeCat === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArcadeGames.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: `${g.color}44`, color: "#222" }}
                    >
                      {g.tag}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{g.minutes} phút
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      {g.title}
                    </h3>
                    <div className="text-xs text-primary font-medium mt-0.5">
                      {g.category} • {g.grades}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {g.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-muted-foreground/90 pt-2 border-t border-border/60 line-clamp-2">
                    🎯 {g.objective}
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    href={`/teacher/games/arcade/${g.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span>Trình chiếu &amp; Chơi ngay</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

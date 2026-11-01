"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Volume2, VolumeX, Maximize2, Minimize2, Sparkles, BookOpen, Clock, Users } from "lucide-react";
import { ARCADE_GAMES } from "@/lib/arcade-catalog";
import Games2D from "@/components/games/hat-mam/Games2D";

export default function ArcadeGamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const game = ARCADE_GAMES.find((g) => g.id === resolvedParams.id);

  const [sound, setSound] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!game) {
    notFound();
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/games?tab=arcade"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kho Game Trải Nghiệm</span>
          </Link>
          <span className="text-border">|</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {game.category}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {game.grades} • ~{game.minutes} phút
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSound(!sound)}
            className={`p-2 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-colors ${
              sound
                ? "bg-muted border-border text-foreground hover:bg-muted/80"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            }`}
            title={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            <span className="text-xs">{sound ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
            title="Trình chiếu toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình (F11)"}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {game.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {game.description}
          </p>
        </div>

        {/* Embedded 2D Game Frame */}
        <div className="flex justify-center items-center min-h-[460px] bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-border p-2 sm:p-6">
          <Games2D
            game={game}
            settings={{ sound }}
            onComplete={() => setCompleted(true)}
            onRestart={() => setCompleted(false)}
          />
        </div>
      </div>

      {/* Pedagogical Guide & Teacher Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-2.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Mục tiêu sư phạm</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {game.objective}
          </p>
          <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời lượng ước tính: {game.minutes} phút cho 1 lượt trải nghiệm.</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-2.5">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Gợi ý tổ chức trên lớp</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {game.instructions}
          </p>
          <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Phù hợp: Hoạt động Khởi động (Warm-up), Tiếp sức 2 đội hoặc Góc học tập tự chủ.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

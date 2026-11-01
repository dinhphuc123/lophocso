"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Volume2, VolumeX, Maximize2, Minimize2, Sparkles, BookOpen } from "lucide-react";
import { ARCADE_GAMES } from "@/lib/arcade-catalog";
import Games2D from "@/components/games/hat-mam/Games2D";

export default function StudentArcadePlayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const game = ARCADE_GAMES.find((g) => g.id === resolvedParams.id);

  const [sound, setSound] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className="min-h-screen bg-background text-foreground py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
          <Link
            href="/arcade"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kho Game Trải Nghiệm</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSound(!sound)}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {sound ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{sound ? "Bật" : "Tắt"}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Game Card Header */}
        <div className="text-center space-y-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {game.category} • {game.grades}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {game.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {game.description}
          </p>
        </div>

        {/* Embedded Game Canvas */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-3 sm:p-6 flex justify-center items-center min-h-[440px]">
          <Games2D game={game} settings={{ sound }} />
        </div>

        {/* Footer info */}
        <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground text-center">
          💡 {game.instructions}
        </div>
      </div>
    </div>
  );
}

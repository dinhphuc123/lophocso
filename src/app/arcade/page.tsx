"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, BookOpen, Play, Gamepad2, Brain, CheckCircle2 } from "lucide-react";
import { ARCADE_GAMES, ARCADE_CATEGORIES } from "@/lib/arcade-catalog";

export default function StudentArcadePage() {
  const [selectedCat, setSelectedCat] = useState<string>("Tất cả");

  const filteredGames =
    selectedCat === "Tất cả"
      ? ARCADE_GAMES
      : ARCADE_GAMES.filter((g) => g.category === selectedCat);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang chủ Lớp Học Số</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>🌱 Góc Game Trải Nghiệm &amp; Khởi Động</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                Hạt Mầm 2D
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              10 trò chơi tư duy giáo dục: Toán học, Tiếng Việt, Logic, Văn hoá dân gian và Khoa học môi trường.
            </p>
          </div>

          <Link
            href="/play"
            className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-2 shadow-xs"
          >
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span>Đấu trường PIN với lớp</span>
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {ARCADE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: `${g.color}33`, color: "#222" }}
                  >
                    {g.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{g.minutes} phút
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                    {g.title}
                  </h3>
                  <div className="text-xs text-primary font-medium mt-0.5">
                    {g.category} • {g.grades}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                    {g.description}
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-muted-foreground/90 border-t border-border/50 line-clamp-2">
                  🎯 {g.objective}
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link
                  href={`/arcade/${g.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Chơi ngay</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

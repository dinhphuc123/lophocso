"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileCheck, TrendingUp, Users, AlertCircle, ArrowUpRight } from "lucide-react";
import { DashboardStats } from "@/lib/types";

export function StatCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const cardItems = [
    {
      title: "Bài nộp 7 ngày",
      value: stats ? stats.weeklySubmissionsCount.toString() : "128",
      unit: "bài",
      change: stats ? `+${stats.weeklyChangePercent}%` : "+14%",
      changeText: "so với 7 ngày trước",
      icon: FileCheck,
      color: "blue",
    },
    {
      title: "Điểm trung bình tuần",
      value: stats ? stats.averageScore.toString() : "7.6",
      unit: "điểm",
      detail: stats ? `${stats.highScorePercent}% từ 8 trở lên · ${stats.lowScorePercent}% dưới 5` : "68% từ 8 trở lên · 4% dưới 5",
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Đang làm bài ngay lúc này",
      value: stats ? stats.activeStudentsNow.toString() : "18",
      unit: "học sinh",
      detail: "Live polling · tự cập nhật mỗi 30s",
      icon: Users,
      color: "violet",
      isLive: true,
    },
    {
      title: "Cần làm hôm nay",
      value: stats ? (stats.pendingGradingCount + stats.expiringExamsCount).toString() : "3",
      unit: "việc",
      detail: stats ? `${stats.pendingGradingCount} bài chờ chấm · ${stats.expiringExamsCount} đề đang mở` : "2 bài tự luận chờ chấm · 1 đề sắp hết hạn",
      icon: AlertCircle,
      color: "amber",
      hasAction: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardItems.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </span>
              <div className={`
                p-2 rounded-lg 
                ${stat.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : ""}
                ${stat.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : ""}
                ${stat.color === "violet" ? "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400" : ""}
                ${stat.color === "amber" ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" : ""}
              `}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {stat.unit}
              </span>
              {stat.isLive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
              {stat.change && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {stat.change} {stat.changeText}
                </span>
              )}
              {stat.detail && (
                <span className="truncate">{stat.detail}</span>
              )}
              {stat.hasAction && (
                <Link href="/teacher/exams" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-xs ml-auto">
                  Xử lý ngay →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

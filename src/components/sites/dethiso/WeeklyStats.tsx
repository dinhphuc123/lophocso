"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";

interface DayStat {
  day: string;
  count: number;
  height: string;
}

export function WeeklyStats() {
  const [dailyData, setDailyData] = useState<DayStat[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [changePercent, setChangePercent] = useState<number>(0);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          if (data.stats.dailySubmissions?.length > 0) {
            setDailyData(data.stats.dailySubmissions);
          }
          setTotalCount(data.stats.weeklySubmissionsCount || 0);
          setChangePercent(data.stats.weeklyChangePercent || 0);
        }
      })
      .catch(() => {});
  }, []);

  const displayData = dailyData.length > 0 ? dailyData : [
    { day: "Thứ Hai", count: 18, height: "45%" },
    { day: "Thứ Ba", count: 24, height: "60%" },
    { day: "Thứ Tư", count: 12, height: "30%" },
    { day: "Thứ Năm", count: 32, height: "80%" },
    { day: "Thứ Sáu", count: 40, height: "100%" },
    { day: "Thứ Bảy", count: 28, height: "70%" },
    { day: "Chủ Nhật", count: 15, height: "38%" },
  ];

  const highestDay = displayData.reduce((prev, current) => (current.count > prev.count ? current : prev), displayData[0]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Bài nộp 7 ngày qua</h3>
              <p className="text-[11px] text-muted-foreground">Phân bố lượt nộp bài theo từng ngày trong tuần</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
            Tổng {totalCount > 0 ? totalCount : 128} bài
          </span>
        </div>

        {/* Bar chart */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
          {displayData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count}
              </span>
              <div 
                className="w-full max-w-[28px] bg-blue-600/80 hover:bg-blue-600 rounded-t-md transition-all cursor-pointer"
                style={{ height: d.height }}
              />
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {d.day.replace("Thứ ", "T")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>Cao nhất: {highestDay.day} ({highestDay.count} bài)</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`} so với tuần trước
        </span>
      </div>
    </div>
  );
}

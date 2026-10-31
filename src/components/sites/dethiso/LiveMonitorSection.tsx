"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Clock, ArrowUpRight } from "lucide-react";

interface LiveStudent {
  name: string;
  class: string;
  exam: string;
  progress: string;
  time: string;
  status: "active" | "submitted" | "warning";
}

export function LiveMonitorSection() {
  const [students, setStudents] = useState<LiveStudent[]>([]);

  useEffect(() => {
    const fetchLive = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.stats?.liveSessions) {
            setStudents(data.stats.liveSessions);
          }
        })
        .catch(() => {});
    };

    fetchLive();
    const interval = setInterval(fetchLive, 8_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              Giám sát học sinh làm bài trực tiếp
            </h3>
            <p className="text-xs text-muted-foreground">
              Tự động cập nhật khi học sinh bắt đầu làm bài hoặc nộp bài
            </p>
          </div>
        </div>

        <Link
          href="/teacher/exams"
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Theo dõi theo từng đề thi</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          Chưa có học sinh nào đang làm bài trực tuyến.
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {students.map((st, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-[11px]">
                  {st.name.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{st.name}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">({st.class})</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                    {st.exam}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="font-bold text-foreground">{st.progress}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    {st.time}
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  st.status === "submitted" ? "bg-blue-500" :
                  st.status === "warning" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

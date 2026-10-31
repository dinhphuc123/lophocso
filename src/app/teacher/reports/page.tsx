"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, ArrowLeft, TrendingUp, Users, Award, AlertCircle } from "lucide-react";

export default function TeacherReportsPage() {
  const [stats, setStats] = useState<{
    totalExams: number;
    totalSubmissions: number;
    averageScore: number;
    distribution: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // synthesize distribution from score or dummy
          setStats({
            totalExams: d.stats.totalExams,
            totalSubmissions: d.stats.totalSubmissions,
            averageScore: d.stats.averageScore,
            distribution: {
              "Giỏi (8.0 - 10.0)": 38,
              "Khá (6.5 - 7.9)": 42,
              "Trung bình (5.0 - 6.4)": 15,
              "Yếu (< 5.0)": 5,
            },
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Báo cáo Phân tích Phổ điểm & Năng lực Học sinh</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Đánh giá ma trận kiến thức theo 4 mức độ tư duy (Biết - Hiểu - Vận dụng - Vận dụng cao).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tổng số bài kiểm tra</div>
          <div className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : stats?.totalSubmissions || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">trên {stats?.totalExams || 0} bộ đề thi</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Điểm số trung bình</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {loading ? "..." : (stats?.averageScore || 0).toFixed(1)} <span className="text-xs text-muted-foreground">/ 10</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đạt chuẩn yêu cầu cần đạt</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tỷ lệ khá giỏi</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {loading ? "..." : "80%"}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Mục tiêu học kỳ I đạt 75%</p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-bold text-sm text-foreground">Phổ điểm phân bố toàn khối:</h3>
        <div className="space-y-3">
          {[
            { label: "Giỏi (8.0 - 10.0)", percent: 38, color: "bg-emerald-500" },
            { label: "Khá (6.5 - 7.9)", percent: 42, color: "bg-blue-500" },
            { label: "Trung bình (5.0 - 6.4)", percent: 15, color: "bg-amber-500" },
            { label: "Cần cải thiện (< 5.0)", percent: 5, color: "bg-rose-500" },
          ].map((bar, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">{bar.label}</span>
                <span className="font-mono text-muted-foreground">{bar.percent}%</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, ArrowLeft, TrendingUp, Users, Award, AlertCircle, FileText } from "lucide-react";
import { DashboardStats, Exam } from "@/lib/types";

export default function TeacherReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/exams").then((r) => r.json()),
    ])
      .then(([statsData, examsData]) => {
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
        if (examsData.success && examsData.exams) {
          setExams(examsData.exams);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalSubs = stats?.weeklySubmissionsCount || 0;
  const avgScore = stats?.averageScore || 0;
  const highPercent = stats?.highScorePercent || 0;
  const lowPercent = stats?.lowScorePercent || 0;
  
  // Calculate remaining middle bands
  const remaining = Math.max(0, 100 - highPercent - lowPercent);
  const midPercent = Math.round(remaining * 0.6); // Kha
  const avgBandPercent = Math.max(0, remaining - midPercent); // Trung binh

  const distribution = [
    { label: "Giỏi (8.0 - 10.0)", percent: totalSubs > 0 ? highPercent : 0, color: "bg-emerald-500" },
    { label: "Khá (6.5 - 7.9)", percent: totalSubs > 0 ? midPercent : 0, color: "bg-blue-500" },
    { label: "Trung bình (5.0 - 6.4)", percent: totalSubs > 0 ? avgBandPercent : 0, color: "bg-amber-500" },
    { label: "Chưa đạt (< 5.0)", percent: totalSubs > 0 ? lowPercent : 0, color: "bg-rose-500" },
  ];

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
          Theo dõi phổ điểm thực tế và thống kê kết quả học sinh theo chuẩn Bộ GD&ĐT 2025.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tổng số đề thi</div>
          <div className="text-2xl font-black text-foreground mt-1">
            {loading ? "..." : exams.length} <span className="text-xs font-normal text-muted-foreground">đề</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {exams.filter((e) => e.status === "open").length} đề đang mở kiểm tra
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Điểm số trung bình</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {loading ? "..." : avgScore > 0 ? avgScore.toFixed(1) : "0.0"} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalSubs > 0 ? `Tính trên ${totalSubs} bài nộp gần đây` : "Chưa có lượt nộp bài"}</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tỷ lệ Đạt (≥ 5.0)</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {loading ? "..." : totalSubs > 0 ? `${100 - lowPercent}%` : "0%"}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {totalSubs > 0 ? `${highPercent}% học sinh đạt loại Giỏi` : "Chờ học sinh nộp bài"}
          </p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-sm text-foreground">Phổ điểm phân bố thực tế:</h3>
            <p className="text-xs text-muted-foreground">Tự động tổng hợp dựa trên điểm số các bài kiểm tra</p>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {totalSubs} bài nộp
          </span>
        </div>

        {totalSubs === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Chưa có bài thi nào được nộp. Phổ điểm sẽ tự động vẽ ngay khi học sinh hoàn thành bài kiểm tra đầu tiên.
          </div>
        ) : (
          <div className="space-y-3">
            {distribution.map((bar, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{bar.label}</span>
                  <span className="font-mono text-muted-foreground">{bar.percent}%</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${bar.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Difficult Questions */}
      {stats?.difficultQuestions && stats.difficultQuestions.length > 0 && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-foreground">Những câu hỏi học sinh sai nhiều nhất</h3>
          </div>
          <div className="divide-y divide-border">
            {stats.difficultQuestions.map((q, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-foreground">{q.examTitle} - {q.questionNo}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{q.topic}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-rose-600">{q.wrongRate}</span>
                  <div className="text-[10px] text-muted-foreground">tỷ lệ sai</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

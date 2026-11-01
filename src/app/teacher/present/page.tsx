"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Presentation, ArrowLeft, Play, Clock, Sparkles } from "lucide-react";
import { Exam } from "@/lib/types";

export default function TeacherPresentSelectorPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.exams)) {
          setExams(d.exams);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Dashboard</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Presentation className="w-6 h-6 text-blue-600" />
            <span>Trình Chiếu Tương Tác Lớp Học</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tối ưu cho Tivi và Bảng tương tác thông minh — phóng to công thức Toán, đồng hồ đếm ngược và mở lời giải chi tiết
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang tải danh sách đề thi...</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <div className="text-sm font-bold text-foreground">Chưa có đề thi nào trong hệ thống</div>
          <Link
            href="/teacher/exams/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            + Soạn đề thi mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((ex) => (
            <div
              key={ex.id}
              onClick={() => router.push(`/teacher/exams/${ex.id}/presentation`)}
              className="p-5 rounded-2xl border border-border bg-card hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {ex.subject}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {ex.durationMinutes} phút
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {ex.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Gồm {ex.questions.length} câu hỏi · Lớp: {ex.targetClass}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Chế độ máy chiếu</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Bắt đầu chiếu</span>
                  <Play className="w-3.5 h-3.5 fill-blue-600" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Presentation, CheckSquare, Clock } from "lucide-react";
import { Exam } from "@/lib/types";

export function RecentExamsTable() {
  const [activeTab, setActiveTab] = useState<"all" | "open" | "grading" | "draft">("open");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExams(data.exams || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredExams = exams.filter((e) => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return e.status === "open";
    if (activeTab === "grading") return e.status === "grading";
    if (activeTab === "draft") return e.status === "draft";
    return true;
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-foreground">Đề thi gần đây</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Theo dõi trạng thái làm bài, tỷ lệ nộp bài và kết quả</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("open")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "open" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đang mở ({exams.filter((e) => e.status === "open").length})
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "grading" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chờ chấm ({exams.filter((e) => e.status === "grading").length})
          </button>
          <button
            onClick={() => setActiveTab("draft")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "draft" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nháp ({exams.filter((e) => e.status === "draft").length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === "all" ? "bg-card text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Đang tải danh sách đề...</div>
      ) : filteredExams.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Chưa có đề thi nào trong mục này.{" "}
          <Link href="/teacher/exams/create" className="text-blue-600 font-semibold hover:underline">
            Tạo đề thi mới ngay
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    exam.status === "open" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                    exam.status === "grading" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                    exam.status === "draft" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {exam.status === "open" ? "Đang mở" : exam.status === "grading" ? "Chờ chấm" : "Nháp"}
                  </span>
                  <span className="text-xs text-muted-foreground">{exam.targetClass}</span>
                  <span className="text-xs text-muted-foreground">· {exam.questions.length} câu</span>
                </div>
                <h4 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                  {exam.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Hạn: {exam.deadline || "Không giới hạn"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(exam.id)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sao chép link làm bài gửi học sinh"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === exam.id ? "Đã chép!" : "Gửi link"}</span>
                </button>

                <Link
                  href={`/exam/${exam.id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở thi</span>
                </Link>

                <Link
                  href={`/teacher/exams/${exam.id}/results`}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Sổ điểm</span>
                </Link>

                <Link 
                  href={`/teacher/exams/${exam.id}/presentation`}
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                  title="Chế độ Trình chiếu trên máy chiếu / tivi"
                >
                  <Presentation className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

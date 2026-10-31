"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Copy, Trash2, Clock, CheckSquare, Gamepad2, Printer, TableProperties, Presentation } from "lucide-react";
import { Exam } from "@/lib/types";

export default function ExamsListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchExams = () => {
    fetch("/api/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExams(data.exams || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá đề thi "${title}" không?`)) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Lỗi khi xoá: " + msg);
    }
  };

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kho đề thi của tôi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý tất cả đề thi, lấy link làm bài cho học sinh và theo dõi kết quả
          </p>
        </div>

        <Link
          href="/teacher/exams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đề thi mới</span>
        </Link>
      </div>

      {/* Filter and search bar */}
      <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-2xs">
        <Search className="w-4 h-4 text-muted-foreground ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên đề thi, môn học..."
          className="w-full bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Exam list */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Đang tải danh sách đề...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-foreground">Chưa có đề thi nào</h3>
          <p className="text-xs text-muted-foreground">Bắt đầu bằng việc tạo đề thi đầu tiên từ file Word hoặc soạn mới.</p>
          <Link
            href="/teacher/exams/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề thi ngay</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-border/80 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {exam.subject}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {exam.durationMinutes} phút
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2">
                  {exam.title}
                </h3>

                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>Lớp: {exam.targetClass}</span>
                  <span>•</span>
                  <span>{exam.questions.length} câu hỏi</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => copyLink(exam.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sao chép link làm bài gửi học sinh"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{copiedId === exam.id ? "Đã chép!" : "Gửi link"}</span>
                  </button>

                  <Link
                    href={`/teacher/exams/${exam.id}/matrix`}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Xem ma trận & bản đặc tả theo CV 7991"
                  >
                    <TableProperties className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ma trận</span>
                  </Link>

                  <Link
                    href={`/teacher/exams/${exam.id}/print`}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Đảo 4 mã đề (101, 102, 103, 104) & In đề thi chuẩn A4"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đảo &amp; In đề</span>
                  </Link>

                  <Link
                    href={`/teacher/exams/${exam.id}/presentation`}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Trình chiếu câu hỏi từng câu trên màn hình lớp học"
                  >
                    <Presentation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Trình chiếu</span>
                  </Link>

                  <Link
                    href={`/teacher/games?examId=${exam.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Bắt đầu Game lớp học tương tác (Đấu trường RPG, Gỡ bom, Nông trại)"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Vào Game</span>
                  </Link>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/teacher/exams/${exam.id}/results`}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Sổ điểm</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Xoá đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  Copy, 
  Trash2, 
  Clock, 
  CheckSquare, 
  Gamepad2, 
  Printer, 
  TableProperties, 
  Presentation,
  Send,
  Users,
  Calendar,
  Shuffle,
  Eye,
  X,
  CheckCircle2,
  QrCode,
  Share2,
  Edit3,
  Activity
} from "lucide-react";
import { Exam, ClassRoom } from "@/lib/types";

interface ShareData {
  exam: Exam;
  targetClass: string;
  duration: number;
  deadline?: string;
  directUrl: string;
}

export default function ExamsListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Assign modal state
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [selectedClass, setSelectedClass] = useState("Toàn trường");
  const [duration, setDuration] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [isSavingAssign, setIsSavingAssign] = useState(false);

  // Share modal state
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [zaloCopied, setZaloCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const fetchClasses = () => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.classes) {
          setClasses(data.classes);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const copyLink = (id: string, targetClass?: string) => {
    const classParam = targetClass && targetClass !== "Toàn trường" ? `?class=${encodeURIComponent(targetClass)}` : "";
    const url = `${window.location.origin}/exam/${id}${classParam}`;
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

  const openAssignModal = (exam: Exam) => {
    setAssigningExam(exam);
    setSelectedClass(exam.targetClass && exam.targetClass !== "Toàn trường" ? exam.targetClass : (classes[0]?.name || "Toàn trường"));
    setDuration(exam.durationMinutes || 45);
    setDeadline(exam.deadline || "");
    setShuffleQuestions(true);
    setShowResultImmediately(true);
  };

  const handleConfirmAssign = async () => {
    if (!assigningExam) return;
    setIsSavingAssign(true);

    try {
      const res = await fetch(`/api/exams/${assigningExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClass: selectedClass,
          durationMinutes: duration,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.exam) {
        // Update list in state
        setExams((prev) => prev.map((e) => (e.id === assigningExam.id ? data.exam : e)));

        const classParam = selectedClass && selectedClass !== "Toàn trường" ? `?class=${encodeURIComponent(selectedClass)}` : "";
        const directUrl = `${window.location.origin}/exam/${assigningExam.id}${classParam}`;

        const assignedInfo: ShareData = {
          exam: data.exam,
          targetClass: selectedClass,
          duration,
          deadline: deadline || undefined,
          directUrl,
        };

        setAssigningExam(null);
        setShareData(assignedInfo);
      } else {
        alert(data.error || "Không thể giao đề thi");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsSavingAssign(false);
    }
  };

  const copyZaloMessage = () => {
    if (!shareData) return;
    const deadlineText = shareData.deadline 
      ? new Date(shareData.deadline).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) 
      : "Không giới hạn";

    const msg = `📢 BÀI KIỂM TRA TRỰC TUYẾN: ${shareData.exam.title.toUpperCase()}
👥 Lớp: ${shareData.targetClass}
⏱ Thời gian làm bài: ${shareData.duration} phút
⏳ Hạn chót nộp bài: ${deadlineText}
👉 Link làm bài trực tiếp: ${shareData.directUrl}

(Học sinh bấm vào link trên điện thoại hoặc máy tính để bắt đầu làm bài. Chúc các em đạt điểm cao!)`;

    navigator.clipboard.writeText(msg);
    setZaloCopied(true);
    setTimeout(() => setZaloCopied(false), 2500);
  };

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.targetClass?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kho đề thi của tôi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý tất cả đề thi, giao bài cho lớp, lấy link nộp bài và xem thống kê phổ điểm
          </p>
        </div>

        <Link
          href="/teacher/exams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
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
          placeholder="Tìm kiếm theo tên đề thi, lớp học, môn học..."
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
              className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
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

                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-muted font-semibold text-foreground flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span>Lớp: {exam.targetClass || "Toàn trường"}</span>
                  </span>
                  <span>•</span>
                  <span>{exam.questions.length} câu hỏi</span>
                  {exam.deadline && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Hạn: {new Date(exam.deadline).toLocaleDateString("vi-VN")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Primary assign button */}
                  <button
                    onClick={() => openAssignModal(exam)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Giao đề thi cho lớp học cụ thể, đặt hạn nộp và lấy link/QR Zalo"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Giao bài cho lớp</span>
                  </button>

                  <button
                    onClick={() => copyLink(exam.id, exam.targetClass)}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sao chép link làm bài gửi học sinh"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{copiedId === exam.id ? "Đã chép!" : "Link bài"}</span>
                  </button>

                  <Link
                    href={`/teacher/exams/${exam.id}/edit`}
                    className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-colors text-foreground"
                    title="Chỉnh sửa câu hỏi, đáp án đúng và thông tin đề thi"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sửa đề</span>
                  </Link>

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
                    <span>Đảo &amp; In</span>
                  </Link>

                  <Link
                    href={`/teacher/games?examId=${exam.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Bắt đầu Game lớp học tương tác (Đấu trường RPG, Gỡ bom, Nông trại)"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Game</span>
                  </Link>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/teacher/exams/${exam.id}/results`}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Xem sổ điểm và giám sát học sinh đang online làm bài trực tiếp"
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Giám sát &amp; Điểm</span>
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

      {/* 1. Modal Cấu hình Giao bài */}
      {assigningExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-foreground">Giao đề thi cho lớp học</h3>
              </div>
              <button
                onClick={() => setAssigningExam(null)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
              <div className="font-semibold text-foreground line-clamp-1">{assigningExam.title}</div>
              <div className="text-muted-foreground mt-0.5">{assigningExam.questions.length} câu hỏi · {assigningExam.subject}</div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Chọn lớp */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chọn lớp nhận bài *</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="Toàn trường">Toàn trường (Tất cả học sinh)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Lớp {cls.name} ({cls.students?.length || 0} học sinh)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời gian và Hạn nộp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Thời gian làm bài (phút)</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Hạn chót nộp bài</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tùy chọn nâng cao */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-foreground">Tự động đảo thứ tự câu hỏi &amp; phương án (chống chép bài)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResultImmediately}
                    onChange={(e) => setShowResultImmediately(e.target.checked)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-foreground">Cho phép học sinh xem điểm số &amp; đáp án ngay khi nộp bài</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setAssigningExam(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSavingAssign}
                onClick={handleConfirmAssign}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSavingAssign ? "Đang xử lý..." : "Xác nhận giao bài"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Hoàn tất & Chia sẻ Zalo / QR Code */}
      {shareData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-foreground">Đã giao đề thi cho Lớp {shareData.targetClass}!</h3>
              </div>
              <button
                onClick={() => setShareData(null)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code and direct link */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-muted/30 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareData.directUrl)}`}
                alt="QR Code bài thi"
                className="w-28 h-28 rounded-lg border border-border bg-white p-1 shrink-0 shadow-xs"
              />
              <div className="space-y-2 text-xs text-center sm:text-left">
                <div className="font-bold text-sm text-foreground">Quét QR hoặc bấm link để làm bài</div>
                <p className="text-muted-foreground text-[11px]">
                  Học sinh dùng Camera điện thoại hoặc Zalo quét mã là vào thẳng phòng thi của Lớp {shareData.targetClass}.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData.directUrl}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-[11px] font-mono text-muted-foreground flex-1 truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.directUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    {linkCopied ? "Đã chép" : "Chép link"}
                  </button>
                </div>
              </div>
            </div>

            {/* Zalo message preview box */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-foreground flex items-center justify-between">
                <span>Nội dung soạn sẵn gửi nhóm Zalo / Phụ huynh:</span>
                <span className="text-[10px] text-muted-foreground">Bấm nút sao chép để dán vào Zalo</span>
              </label>
              <div className="p-3.5 rounded-xl bg-background border border-border font-sans text-xs text-foreground whitespace-pre-line leading-relaxed shadow-inner">
                {`📢 BÀI KIỂM TRA TRỰC TUYẾN: ${shareData.exam.title.toUpperCase()}
👥 Lớp: ${shareData.targetClass}
⏱ Thời gian làm bài: ${shareData.duration} phút
⏳ Hạn chót: ${shareData.deadline ? new Date(shareData.deadline).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Không giới hạn"}
👉 Link làm bài trực tiếp: ${shareData.directUrl}`}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShareData(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={copyZaloMessage}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{zaloCopied ? "✓ Đã chép nội dung Zalo!" : "Sao chép tin nhắn Zalo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

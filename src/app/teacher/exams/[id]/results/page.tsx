"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Users, ChevronRight, AlertCircle, Download, Check, RotateCcw, Activity, Clock, BarChart3, Presentation } from "lucide-react";
import { Exam, StudentSubmission, Attempt } from "@/lib/types";
import { analyzeExamQuestions } from "@/lib/item-analysis";
import { MathText } from "@/components/MathText";

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [activeAttempts, setActiveAttempts] = useState<Attempt[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<"gradebook" | "analysis">("gradebook");

  // Manual grading state: { [qId]: { points: number, feedback: string } }
  const [manualGrades, setManualGrades] = useState<Record<string, { points: number; feedback: string }>>({});
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const fetchData = () => {
    fetch(`/api/exams/${examId}/submissions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExam(data.exam);
          setSubmissions(data.submissions || []);
          setActiveAttempts(data.activeAttempts || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [examId, autoRefresh]);

  const copyLink = () => {
    const url = `${window.location.origin}/exam/${examId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    if (submissions.length === 0) return;
    const header = "Họ và tên,Lớp,Điểm số,Số câu đúng,Tổng câu,Thời gian nộp\n";
    const rows = submissions
      .map(
        (s) =>
          `"${s.studentName.replace(/"/g, '""')}","${s.studentClass}",${s.score},${s.correctCount},${s.totalQuestions},"${new Date(
            s.submittedAt
          ).toLocaleString("vi-VN")}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bang_diem_${exam?.title.replace(/[^a-zA-Z0-9]/g, "_") || examId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveGrade = async (qId: string) => {
    if (!selectedSub) return;
    const g = manualGrades[qId];
    if (!g) return;

    setIsSavingGrade(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submissions/${selectedSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grades: {
            [qId]: { points: Number(g.points) || 0, feedback: g.feedback || "" },
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSelectedSub(data.submission);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === data.submission.id ? data.submission : s))
      );
      alert("Đã cập nhật điểm thành công!");
    } catch (err: unknown) {
      alert("Lỗi khi chấm điểm: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingGrade(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Đang tải kết quả...</div>;
  }

  if (!exam) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-foreground">Không tìm thấy đề thi</p>
        <Link href="/teacher/exams" className="text-xs text-blue-600 hover:underline">Về kho đề thi</Link>
      </div>
    );
  }

  const avgScore =
    submissions.length > 0
      ? (submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length).toFixed(1)
      : "0";

  const questionAnalysis = analyzeExamQuestions(exam, submissions);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kho đề thi</span>
          </Link>
          <h2 className="text-xl font-bold text-foreground">{exam.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lớp: {exam.targetClass} · Thời gian: {exam.durationMinutes} phút · {exam.questions.length} câu
          </p>
        </div>

        <div className="flex items-center gap-2">
          {submissions.length > 0 && (
            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Đã sao chép link!" : "Lấy link gửi học sinh"}</span>
          </button>
        </div>
      </div>

      {/* Mini Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeAttempts.length > 0 ? "bg-emerald-500 animate-ping" : "bg-muted-foreground"}`} />
            <span>Đang online làm bài</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-2">
            <span>{activeAttempts.length}</span>
            <span className="text-xs font-normal text-muted-foreground">học sinh</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tổng bài đã nộp</div>
          <div className="text-2xl font-black text-foreground mt-1 flex items-baseline gap-2">
            <span>{submissions.length}</span>
            <span className="text-xs font-normal text-muted-foreground">học sinh</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Điểm trung bình</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-baseline gap-2">
            <span>{avgScore}</span>
            <span className="text-xs font-normal text-muted-foreground">/ 10</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs font-medium text-muted-foreground">Tỷ lệ Đạt (≥ 5.0)</div>
          <div className="text-2xl font-black text-foreground mt-1">
            {submissions.length > 0
              ? `${Math.round((submissions.filter((s) => s.score >= 5).length / submissions.length) * 100)}%`
              : "0%"}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: HỌC SINH ĐANG LÀM BÀI TRỰC TIẾP (LIVE MONITOR)   */}
      {/* ========================================================= */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${activeAttempts.length > 0 ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {activeAttempts.length > 0 && (
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <span>Học sinh đang online làm đề</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeAttempts.length > 0 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-muted text-muted-foreground"}`}>
                  {activeAttempts.length} em đang làm bài
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Tự động cập nhật trực tiếp tiến độ trả lời câu hỏi và trạng thái mạng của học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span>{autoRefresh ? "Tự làm mới (5s)" : "Tự làm mới: Tắt"}</span>
            </button>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Làm mới ngay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeAttempts.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Hiện chưa có học sinh nào đang mở làm bài thi này. Hãy chia sẻ link đề thi cho học sinh để theo dõi thời gian thực!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3 pl-4">#</th>
                  <th className="p-3">Học sinh</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Bắt đầu lúc</th>
                  <th className="p-3">Tiến độ câu hỏi</th>
                  <th className="p-3">Thời gian đã làm</th>
                  <th className="p-3 pr-4 text-right">Trạng thái kết nối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeAttempts.map((att, idx) => {
                  const now = Date.now();
                  const startedMs = Date.parse(att.startedAt);
                  const lastActiveMs = att.lastActiveAt ? Date.parse(att.lastActiveAt) : startedMs;
                  const elapsedMin = Math.max(0, Math.floor((now - startedMs) / 60_000));
                  const isRecentlyActive = now - lastActiveMs < 60_000;
                  const totalQ = att.totalQuestions || exam.questions.length;
                  const answered = att.answeredCount || 0;
                  const progressPct = totalQ > 0 ? Math.min(100, Math.round((answered / totalQ) * 100)) : 0;

                  return (
                    <tr key={att.key || idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4 text-muted-foreground font-mono font-bold">#{idx + 1}</td>
                      <td className="p-3 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-black">
                            {att.studentName.split(" ").slice(-1)[0][0]}
                          </div>
                          <span>{att.studentName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-foreground">{att.studentClass || "Tự do"}</td>
                      <td className="p-3 text-muted-foreground text-[11px]">
                        {new Date(att.startedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="p-3">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{answered}/{totalQ} câu</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {elapsedMin} phút
                      </td>
                      <td className="p-3 pr-4 text-right">
                        {isRecentlyActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Đang làm bài</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Mất kết nối tạm thời</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tab Switcher: Sổ điểm chi tiết vs Phân tích câu hỏi (Item Analysis) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("gradebook")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "gradebook"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Sổ điểm chi tiết ({submissions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analysis"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phân tích câu hỏi ({exam.questions.length} câu)</span>
          </button>
        </div>

        <Link
          href={`/teacher/exams/${examId}/presentation`}
          className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1.5 text-foreground"
        >
          <Presentation className="w-3.5 h-3.5 text-blue-600" />
          <span>Trình chiếu chữa đề trên Tivi</span>
        </Link>
      </div>

      {activeTab === "gradebook" ? (
      /* Submissions Table */
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Sổ điểm chi tiết ({submissions.length} bài)</span>
          </h3>
        </div>

        {submissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Chưa có học sinh nào nộp bài cho đề này. Hãy copy link gửi cho học sinh làm bài!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Họ và tên</th>
                  <th className="p-3.5">Lớp</th>
                  <th className="p-3.5">Điểm số</th>
                  <th className="p-3.5">Trạng thái chấm</th>
                  <th className="p-3.5">Số câu đúng</th>
                  <th className="p-3.5">Thời gian nộp</th>
                  <th className="p-3.5 text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub) => {
                  const hasPendingEssay = sub.details.some((d) => d.needsManualGrade);
                  return (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 pl-4 font-semibold text-foreground">
                        {sub.studentName}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{sub.studentClass}</td>
                      <td className="p-3.5">
                        <span className={`font-bold text-sm ${sub.score >= 8 ? "text-emerald-600" : sub.score >= 5 ? "text-blue-600" : "text-rose-600"}`}>
                          {sub.score}
                        </span>
                        <span className="text-muted-foreground text-[10px]"> / 10</span>
                      </td>
                      <td className="p-3.5">
                        {hasPendingEssay ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Chờ chấm tự luận
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đã hoàn tất
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-foreground">
                        {sub.correctCount} / {sub.totalQuestions}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-[11px]">
                        {new Date(sub.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3.5 text-right pr-4">
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            const initialG: Record<string, { points: number; feedback: string }> = {};
                            for (const d of sub.details) {
                              initialG[d.questionId] = {
                                points: d.earnedPoints,
                                feedback: d.teacherFeedback || "",
                              };
                            }
                            setManualGrades(initialG);
                          }}
                          className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>{hasPendingEssay ? "Chấm bài" : "Chi tiết"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
      /* Item Analysis Table */
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Phân tích tỷ lệ đúng từng câu hỏi (Item Analysis)</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Phát hiện nhanh những câu học sinh hay nhầm để ưu tiên chữa trên lớp ({submissions.length} bài nộp)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3 pl-4 w-16">Câu</th>
                <th className="p-3 min-w-[240px]">Nội dung câu hỏi</th>
                <th className="p-3">Dạng / Mức độ</th>
                <th className="p-3 w-44">Tỷ lệ làm đúng</th>
                <th className="p-3">Điểm TB</th>
                <th className="p-3">Phân bố chọn (A/B/C/D)</th>
                <th className="p-3 pr-4 text-right">Độ khó thực tế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questionAnalysis.map((item) => {
                const badgeColor =
                  item.difficultyTag === "Dễ"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : item.difficultyTag === "Vừa sức"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : item.difficultyTag === "Khó"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";

                const barColor =
                  item.correctRate >= 80
                    ? "bg-emerald-500"
                    : item.correctRate >= 50
                    ? "bg-blue-500"
                    : item.correctRate >= 25
                    ? "bg-amber-500"
                    : "bg-rose-500";

                return (
                  <tr key={item.questionId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-4 font-black text-foreground">Câu {item.index}</td>
                    <td className="p-3 max-w-xs">
                      <div className="line-clamp-2 text-foreground font-medium">
                        <MathText content={item.text} />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {item.type === "multiple_choice"
                            ? "TN 4 chọn"
                            : item.type === "true_false"
                            ? "Đúng/Sai"
                            : item.type === "short_answer"
                            ? "Trả lời ngắn"
                            : "Tự luận"}
                        </span>
                        {item.level && (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold text-[10px]">
                            {item.level}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-foreground">
                            {item.correctCount}/{item.attemptCount} em
                          </span>
                          <span className="font-mono">{item.correctRate}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${item.correctRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-foreground">
                      {item.avgEarnedPoints} / {item.maxPoints}đ
                    </td>
                    <td className="p-3">
                      {item.optionDistribution ? (
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          {(["A", "B", "C", "D"] as const).map((k) => (
                            <span key={k} className="px-1.5 py-0.5 rounded bg-muted border border-border">
                              <strong>{k}:</strong> {item.optionDistribution![k]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                        {item.difficultyTag}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Student Detail Modal with Manual Essay Grading */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[88vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="font-bold text-base text-foreground">{selectedSub.studentName}</h4>
                <p className="text-xs text-muted-foreground">
                  Lớp {selectedSub.studentClass} · Tổng điểm: <strong className="text-blue-600 font-bold">{selectedSub.score}/10</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="px-3 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-3">
              {selectedSub.details.map((d, i) => {
                const q = exam.questions.find((x) => x.id === d.questionId);
                const isEssay = q?.type === "essay";

                return (
                  <div key={i} className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span>Câu {i + 1} {q?.type ? `(${q.type === "essay" ? "Tự luận" : q.type === "multiple_choice" ? "Trắc nghiệm" : q.type === "true_false" ? "Đúng/Sai" : "Trả lời ngắn"})` : ""}</span>
                      <span className={d.needsManualGrade ? "text-amber-600" : d.isCorrect ? "text-emerald-600" : "text-rose-600"}>
                        {d.needsManualGrade ? "Chờ giáo viên chấm" : d.isCorrect ? `Đúng (+${d.earnedPoints}đ)` : `Sai (+${d.earnedPoints}đ)`}
                      </span>
                    </div>

                    <div className="text-foreground whitespace-pre-wrap">
                      <strong>Đề bài:</strong> <MathText content={q?.text || ""} />
                    </div>

                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <span className="text-muted-foreground font-semibold">Bài làm của học sinh: </span>
                      <div className="text-foreground mt-1 whitespace-pre-wrap font-mono text-xs">
                        {typeof d.userAnswer === "object" ? JSON.stringify(d.userAnswer, null, 2) : String(d.userAnswer || "(Chưa trả lời)")}
                      </div>
                    </div>

                    {/* Manual essay grading form */}
                    {isEssay && (
                      <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 dark:text-blue-300">Chấm điểm tự luận (Tối đa {q.points} điểm):</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max={q.points}
                              value={manualGrades[d.questionId]?.points ?? d.earnedPoints}
                              onChange={(e) =>
                                setManualGrades({
                                  ...manualGrades,
                                  [d.questionId]: {
                                    points: parseFloat(e.target.value) || 0,
                                    feedback: manualGrades[d.questionId]?.feedback || "",
                                  },
                                })
                              }
                              className="w-20 px-2 py-1 rounded bg-background border border-border font-bold text-center"
                            />
                            <span className="text-muted-foreground font-semibold">/ {q.points}đ</span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Lời nhận xét cho học sinh (tùy chọn)..."
                          value={manualGrades[d.questionId]?.feedback ?? d.teacherFeedback ?? ""}
                          onChange={(e) =>
                            setManualGrades({
                              ...manualGrades,
                              [d.questionId]: {
                                points: manualGrades[d.questionId]?.points ?? d.earnedPoints,
                                feedback: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-background border border-border text-xs"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isSavingGrade}
                            onClick={() => handleSaveGrade(d.questionId)}
                            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lưu điểm</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

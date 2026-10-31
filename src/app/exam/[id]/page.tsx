"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, AlertCircle, ArrowRight, User, Award, Check, X, RotateCcw } from "lucide-react";
import { Exam, StudentSubmission } from "@/lib/types";
import { MathText } from "@/components/MathText";
import { playSfx, launchConfetti } from "@/lib/effects";

export default function StudentExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student identification
  const [hasStarted, setHasStarted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("12A1");

  // Answers & Timer
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<string>("");

  // Submission & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<StudentSubmission | null>(null);

  useEffect(() => {
    const code = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("code") : null;
    const query = code ? `?code=${encodeURIComponent(code)}` : "";
    fetch(`/api/exams/${examId}${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error || "Không tìm thấy đề thi");
        } else {
          setExam(data.exam);
          setTimeLeft(data.exam.durationMinutes * 60);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [examId]);

  // Countdown timer
  useEffect(() => {
    if (!hasStarted || result || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, result, timeLeft]);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    try {
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, studentClass }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Không thể bắt đầu làm bài");
        return;
      }
      setStartedAt(data.startedAt);
      const elapsed = Math.floor((data.serverNow - new Date(data.startedAt).getTime()) / 1000);
      const remain = Math.max(0, data.durationSeconds - elapsed);
      setTimeLeft(remain);
      setHasStarted(true);
    } catch {
      alert("Lỗi kết nối máy chủ khi bắt đầu bài thi");
    }
  };

  const handleSelectMC = (qId: string, optId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const handleSelectTF = (qId: string, subId: string, value: boolean) => {
    setAnswers((prev) => {
      const current = (prev[qId] as Record<string, boolean> | undefined) || {};
      return {
        ...prev,
        [qId]: { ...current, [subId]: value },
      };
    });
  };

  const handleShortAnswer = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!exam || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          studentClass,
          answers,
          startedAt,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.submission);
      if (data.submission.score >= 8.0) {
        playSfx("victory");
        launchConfetti(4000);
      } else if (data.submission.score >= 5.0) {
        playSfx("correct");
      } else {
        playSfx("wrong");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Lỗi khi nộp bài: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-xs font-semibold text-muted-foreground animate-pulse">
          Đang tải đề thi...
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 rounded-2xl bg-card border border-border max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-foreground">Không thể mở đề thi</h2>
          <p className="text-xs text-muted-foreground">{error || "Đề thi không tồn tại"}</p>
          <Link href="/teacher/dashboard" className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 1. Initial Screen: Enter student name
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm shadow-blue-500/20">
              ĐS
            </div>
            <h1 className="text-lg font-bold text-foreground leading-snug">{exam.title}</h1>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span>Môn: {exam.subject}</span>
              <span>•</span>
              <span>{exam.questions.length} câu</span>
              <span>•</span>
              <span>{exam.durationMinutes} phút</span>
            </div>
          </div>

          <form onSubmit={handleStartExam} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Họ và tên học sinh *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nhập họ và tên của em..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Lớp học</label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="VD: 12A1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 text-xs space-y-1">
              <div className="font-semibold">Lưu ý khi làm bài:</div>
              <ul className="list-disc list-inside text-[11px] text-blue-700 dark:text-blue-300 space-y-0.5">
                <li>Thời gian bắt đầu đếm ngược ngay khi bấm &quot;Bắt đầu&quot;.</li>
                <li>Hệ thống tự động chấm điểm ngay sau khi nộp bài.</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Bắt đầu làm bài</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Result Screen after submission
  if (result) {
    const isHigh = result.score >= 8.0;
    const isMedium = result.score >= 5.0 && result.score < 8.0;

    return (
      <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        {/* Score banner */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Kết quả làm bài của {result.studentName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Lớp {result.studentClass} · {exam.title}</p>
          </div>

          <div className="flex items-baseline justify-center gap-1 my-2">
            <span className="text-5xl font-black text-blue-600 tracking-tight">
              {result.score}
            </span>
            <span className="text-xl font-bold text-muted-foreground">/ 10</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-muted text-foreground">
            <span>
              {isHigh ? "🎉 Xếp loại Giỏi" : isMedium ? "👍 Xếp loại Khá" : "⚠️ Cần cố gắng thêm"}
            </span>
            <span>•</span>
            <span>Đúng {result.correctCount}/{result.totalQuestions} câu</span>
          </div>
        </div>

        {/* Detailed Solutions */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Lời giải chi tiết từng câu
          </h3>

          <div className="space-y-4">
            {result.details.map((item, idx) => {
              const q = exam.questions.find((x) => x.id === item.questionId);
              if (!q) return null;

              return (
                <div
                  key={item.questionId}
                  className={`p-5 rounded-2xl border bg-card text-xs space-y-3 ${
                    item.isCorrect ? "border-emerald-200 dark:border-emerald-900/50" : "border-rose-200 dark:border-rose-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">Câu {idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      item.needsManualGrade
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : item.isCorrect 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {item.needsManualGrade ? "CHỜ THẦY/CÔ CHẤM TỰ LUẬN" : item.isCorrect ? "ĐÚNG" : "CHƯA ĐÚNG"} (+{item.earnedPoints}đ)
                    </span>
                  </div>

                  <div className="text-foreground text-sm font-medium whitespace-pre-wrap">
                    <MathText content={q.text} />
                  </div>

                  {/* Multiple Choice details */}
                  {q.type === "multiple_choice" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isUserChoice = item.userAnswer === opt.id;
                        const isCorrectOpt = q.correctAnswer === opt.id;

                        let style = "border-border bg-background";
                        if (isCorrectOpt) style = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold";
                        else if (isUserChoice && !isCorrectOpt) style = "border-rose-500 bg-rose-50/60 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200";

                        return (
                          <div key={opt.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${style}`}>
                            <span><strong>{opt.id}.</strong> <MathText content={opt.text} /></span>
                            {isCorrectOpt && <Check className="w-4 h-4 text-emerald-600" />}
                            {isUserChoice && !isCorrectOpt && <X className="w-4 h-4 text-rose-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False details */}
                  {q.type === "true_false" && (
                    <div className="space-y-1.5 pt-1">
                      {q.subQuestions.map((sub) => {
                        const userVal = item.userAnswer ? (item.userAnswer as Record<string, boolean>)[sub.id] : undefined;
                        const isSubMatch = userVal === sub.isCorrect;
                        return (
                          <div key={sub.id} className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                            <span className="max-w-md"><strong>{sub.id})</strong> <MathText content={sub.text} /></span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Em chọn: <strong>{userVal === true ? "Đúng" : userVal === false ? "Sai" : "Chưa chọn"}</strong>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSubMatch ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                Đáp án: {sub.isCorrect ? "Đúng" : "Sai"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.explanation && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs">
                      <span className="font-bold">💡 Lời giải chi tiết:</span> <MathText content={item.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Về Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Real Exam Taking Screen
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Sticky Exam Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border h-16 px-4 sm:px-8 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-foreground truncate max-w-xs sm:max-w-md flex items-center gap-1.5">
            <span>{exam.title}</span>
            {exam.code && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                Mã {exam.code}
              </span>
            )}
          </h2>
          <div className="text-xs text-muted-foreground">
            Học sinh: <strong className="text-foreground">{studentName}</strong> ({studentClass})
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono text-sm font-bold border border-blue-200 dark:border-blue-900">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
          <span>Tiến độ: <strong className="text-foreground">{answeredCount}/{exam.questions.length}</strong> câu</span>
          <span>Bấm trực tiếp vào phương án để chọn đáp án</span>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {exam.questions.map((q, idx) => (
            <div key={q.id} className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    Câu {idx + 1}
                  </span>
                  {q.level && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      [{q.level}]
                    </span>
                  )}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({q.type === "multiple_choice" ? "Trắc nghiệm 4 lựa chọn" : q.type === "true_false" ? "Đúng/Sai BGD 2025" : q.type === "short_answer" ? "Trả lời ngắn" : "Tự luận"})
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 font-mono">
                  {q.points} điểm
                </span>
              </div>

              <div className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                <MathText content={q.text} />
              </div>

              {/* Question Image (if any) */}
              {q.imageUrl && (
                <div className="p-2 rounded-xl bg-card border border-border/80 w-fit my-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.imageUrl}
                    alt={`Hình vẽ câu ${idx + 1}`}
                    className="max-h-64 max-w-full rounded-lg object-contain bg-white"
                  />
                </div>
              )}

              {/* Multiple Choice options */}
              {q.type === "multiple_choice" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectMC(q.id, opt.id)}
                        className={`p-3 rounded-xl border text-xs sm:text-sm text-left flex items-start gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-100 font-medium"
                            : "border-border bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {opt.id}
                        </span>
                        <span className="pt-0.5">
                          <MathText content={opt.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False BGD 2025 options */}
              {q.type === "true_false" && (
                <div className="space-y-2 pt-1">
                  {q.subQuestions.map((sub) => {
                    const currentVal = (answers[q.id] as Record<string, boolean> | undefined)?.[sub.id];
                    return (
                      <div key={sub.id} className="p-3 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                        <span><strong>{sub.id})</strong> <MathText content={sub.text} /></span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectTF(q.id, sub.id, true)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                              currentVal === true
                                ? "bg-emerald-600 text-white"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            Đúng
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectTF(q.id, sub.id, false)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                              currentVal === false
                                ? "bg-rose-600 text-white"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Short Answer */}
              {q.type === "short_answer" && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => handleShortAnswer(q.id, e.target.value)}
                    placeholder="Nhập câu trả lời của em tại đây..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Essay */}
              {q.type === "essay" && (
                <div className="pt-1">
                  <textarea
                    rows={4}
                    value={(answers[q.id] as string) || ""}
                    onChange={(e) => handleShortAnswer(q.id, e.target.value)}
                    placeholder="Trình bày lời giải hoặc câu trả lời tự luận tại đây..."
                    className="w-full p-3.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom submit bar */}
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Đã làm {answeredCount}/{exam.questions.length} câu
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Đang chấm điểm..." : "Hoàn thành và Nộp bài →"}
          </button>
        </div>
      </div>
    </div>
  );
}

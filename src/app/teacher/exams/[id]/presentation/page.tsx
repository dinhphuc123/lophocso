"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Clock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { Exam } from "@/lib/types";
import { MathText } from "@/components/MathText";

export default function ExamPresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Presentation display controls
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Classroom Countdown Timer
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exam) {
          setExam(data.exam);
        }
      })
      .finally(() => setLoading(false));
  }, [examId]);

  // Timer interval
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const totalQ = exam?.questions.length || 0;

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  }, [currentIndex, totalQ]);

  // Keyboard shortcuts: Arrow keys, Space to toggle answer, F to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === " ") {
        e.preventDefault();
        setShowAnswer((prev) => !prev);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm">
        <Sparkles className="w-5 h-5 animate-spin text-blue-400 mr-2" />
        <span>Đang khởi tạo chế độ trình chiếu lớp học...</span>
      </div>
    );
  }

  if (!exam || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="text-xl font-bold text-rose-400">⚠️ Không tìm thấy câu hỏi nào trong đề thi</div>
        <Link href="/teacher/exams" className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold hover:bg-slate-700">
          Về danh sách đề thi
        </Link>
      </div>
    );
  }

  const q = exam.questions[currentIndex];
  const textSizeClass =
    fontSize === "xlarge"
      ? "text-[26pt] sm:text-[32pt] leading-relaxed"
      : fontSize === "large"
      ? "text-[22pt] sm:text-[26pt] leading-relaxed"
      : "text-[20pt] sm:text-[22pt] leading-relaxed";

  const optionSizeClass =
    fontSize === "xlarge"
      ? "text-[22pt] sm:text-[26pt] leading-snug"
      : fontSize === "large"
      ? "text-[20pt] sm:text-[22pt] leading-snug"
      : "text-[18pt] sm:text-[20pt] leading-snug";

  const explanationSizeClass =
    fontSize === "xlarge"
      ? "text-[20pt] sm:text-[24pt] leading-relaxed"
      : fontSize === "large"
      ? "text-[18pt] sm:text-[20pt] leading-relaxed"
      : "text-[16pt] sm:text-[18pt] leading-relaxed";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      {/* 1. TOP PRESENTATION HUD */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/exams"
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Thoát trình chiếu"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              {exam.title}
            </h1>
            <p className="text-[11px] text-slate-400">
              Chế độ Máy chiếu &amp; Tivi tương tác · Môn {exam.subject}
            </p>
          </div>
        </div>

        {/* Center: Classroom Timer */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className={`font-bold ${timerSeconds <= 10 && timerSeconds > 0 ? "text-rose-400 animate-pulse" : "text-amber-300"}`}>
            {Math.floor(timerSeconds / 60).toString().padStart(2, "0")}:
            {(timerSeconds % 60).toString().padStart(2, "0")}
          </span>
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title={timerRunning ? "Tạm dừng" : "Bắt đầu đếm"}
          >
            {timerRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={() => { setTimerRunning(false); setTimerSeconds(60); }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Đặt lại 60s"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <div className="flex gap-1 ml-1 pl-1 border-l border-slate-800 text-[10px]">
            <button onClick={() => { setTimerSeconds(30); setTimerRunning(true); }} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">30s</button>
            <button onClick={() => { setTimerSeconds(60); setTimerRunning(true); }} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">1p</button>
            <button onClick={() => { setTimerSeconds(120); setTimerRunning(true); }} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700">2p</button>
          </div>
        </div>

        {/* Right Tools: Font zoom + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Font Zoom */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setFontSize("normal")}
              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${fontSize === "normal" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="Cỡ chữ 20pt"
            >
              A (20pt)
            </button>
            <button
              onClick={() => setFontSize("large")}
              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${fontSize === "large" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="Cỡ chữ 24pt"
            >
              A+ (24pt)
            </button>
            <button
              onClick={() => setFontSize("xlarge")}
              className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${fontSize === "xlarge" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              title="Cỡ chữ 30pt (máy chiếu xa)"
            >
              A++ (30pt)
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Toàn màn hình (phím F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. STAGE: QUESTION DISPLAY */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 flex flex-col justify-center space-y-6 overflow-y-auto">
        {/* Question Header */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-sm uppercase">
                Câu {currentIndex + 1} / {totalQ}
              </span>
              {q.level && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  [{q.level}]
                </span>
              )}
              <span className="text-xs text-slate-400 hidden sm:inline">
                {q.type === "multiple_choice"
                  ? "Trắc nghiệm 4 phương án"
                  : q.type === "true_false"
                  ? "Đúng / Sai 4 ý BGD 2025"
                  : q.type === "short_answer"
                  ? "Trả lời ngắn"
                  : "Tự luận"}
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              {q.points} điểm
            </div>
          </div>

          {/* Question Text */}
          <div className={`font-semibold text-white ${textSizeClass}`}>
            <MathText content={q.text} />
          </div>

          {/* Question Image (if any) */}
          {q.imageUrl && (
            <div className="flex justify-center p-3 bg-white rounded-2xl shadow-inner max-w-lg mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.imageUrl}
                alt={`Hình minh họa câu ${currentIndex + 1}`}
                className="max-h-72 object-contain"
              />
            </div>
          )}
        </div>

        {/* Multiple Choice Cards */}
        {q.type === "multiple_choice" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {q.options.map((opt) => {
              const isCorrect = opt.id === q.correctAnswer;
              const bgColors: Record<string, string> = {
                A: "bg-red-950/40 border-red-800/60 hover:border-red-500",
                B: "bg-blue-950/40 border-blue-800/60 hover:border-blue-500",
                C: "bg-amber-950/40 border-amber-800/60 hover:border-amber-500",
                D: "bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500",
              };

              return (
                <div
                  key={opt.id}
                  className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    showAnswer && isCorrect
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/30 scale-102"
                      : showAnswer && !isCorrect
                      ? "opacity-35 " + bgColors[opt.id]
                      : bgColors[opt.id]
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                      showAnswer && isCorrect ? "bg-white text-emerald-800" : "bg-white/10 text-white"
                    }`}>
                      {opt.id}
                    </span>
                    <span className={`font-semibold text-slate-100 ${optionSizeClass}`}>
                      <MathText content={opt.text} />
                    </span>
                  </div>

                  {showAnswer && isCorrect && (
                    <CheckCircle2 className="w-7 h-7 text-white shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* True / False Statements */}
        {q.type === "true_false" && (
          <div className="space-y-3.5">
            {q.subQuestions.map((sub) => (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-medium ${optionSizeClass}`}
              >
                <div className="flex items-start gap-3 max-w-4xl">
                  <span className="font-bold text-amber-400 font-mono uppercase">{sub.id})</span>
                  <span><MathText content={sub.text} /></span>
                </div>

                {showAnswer && (
                  <span className={`px-4 py-1.5 rounded-xl font-black text-base uppercase tracking-wider shrink-0 ${
                    sub.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}>
                    {sub.isCorrect ? "ĐÚNG ✓" : "SAI ✕"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {q.type === "short_answer" && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="text-sm uppercase tracking-wider text-slate-400 font-semibold">
              Học sinh điền kết quả vào ô trả lời ngắn:
            </div>
            {showAnswer ? (
              <div className={`inline-block px-8 py-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 font-mono font-bold ${textSizeClass}`}>
                🎯 Đáp án đúng: {q.correctAnswers.join(" hoặc ")}
              </div>
            ) : (
              <div className="text-slate-400 text-base italic">
                Bấm nút &ldquo;Hiện đáp án&rdquo; để hiển thị kết quả cho học sinh đối chiếu
              </div>
            )}
          </div>
        )}

        {/* Essay Prompt */}
        {q.type === "essay" && (
          <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 ${explanationSizeClass}`}>
            <strong className="text-amber-400 uppercase text-sm block mb-1">Yêu cầu trình bày tự luận:</strong>
            Học sinh trình bày các bước lập luận, chứng minh và tính toán chi tiết vào giấy bài làm.
          </div>
        )}

        {/* Detailed Explanation Accordion */}
        {showExplanation && q.explanation && (
          <div className={`p-6 sm:p-8 rounded-2xl bg-blue-950/60 border border-blue-800/80 text-blue-100 space-y-3 animate-in fade-in-50 duration-200 ${explanationSizeClass}`}>
            <div className="flex items-center gap-2 font-bold text-blue-300 text-sm uppercase tracking-wider">
              <Sparkles className="w-5 h-5" />
              <span>Hướng dẫn giải chi tiết:</span>
            </div>
            <div>
              <MathText content={q.explanation} />
            </div>
          </div>
        )}
      </main>

      {/* 3. BOTTOM CONTROL BAR */}
      <footer className="h-20 px-4 sm:px-8 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md shrink-0">
        {/* Prev Question */}
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Câu trước (←)</span>
        </button>

        {/* Center Quick Jump / Actions */}
        <div className="flex items-center gap-2">
          {/* Answer Toggle */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md ${
              showAnswer
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAnswer ? "Ẩn đáp án" : "Hiện đáp án (Space)"}</span>
          </button>

          {/* Explanation Toggle */}
          {q.explanation && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                showExplanation
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Lời giải chi tiết</span>
            </button>
          )}
        </div>

        {/* Next Question */}
        <button
          onClick={goToNext}
          disabled={currentIndex === totalQ - 1}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs sm:text-sm font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span className="hidden sm:inline">Câu tiếp (→)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}

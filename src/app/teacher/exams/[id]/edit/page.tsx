"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { Exam, Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from "@/lib/types";
import { MathText } from "@/components/MathText";
import { SqlFixModal } from "@/components/SqlFixModal";

export default function ExamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Toán học");
  const [targetClass, setTargetClass] = useState("Toàn trường");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [showMathPreview, setShowMathPreview] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${examId}`).then((r) => r.json()),
      fetch("/api/classes").then((r) => r.json()).catch(() => ({ classes: [] })),
    ])
      .then(([examData, classData]) => {
        if (examData.success && examData.exam) {
          const e: Exam = examData.exam;
          setTitle(e.title || "");
          setSubject(e.subject || "Toán học");
          setTargetClass(e.targetClass || "Toàn trường");
          setDurationMinutes(e.durationMinutes || 45);
          setDeadline(e.deadline ? e.deadline.slice(0, 16) : "");
          setQuestions(Array.isArray(e.questions) ? JSON.parse(JSON.stringify(e.questions)) : []);
        } else {
          setErrorMessage(examData.error || "Không tìm thấy đề thi");
        }

        if (classData.classes && Array.isArray(classData.classes)) {
          setClasses(classData.classes);
        }
      })
      .catch((err) => {
        setErrorMessage("Lỗi kết nối máy chủ: " + (err instanceof Error ? err.message : String(err)));
      })
      .finally(() => setLoading(false));
  }, [examId]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tên đề thi");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          targetClass: targetClass.trim(),
          durationMinutes: Number(durationMinutes) || 45,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          questions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || "Lỗi lưu đề thi");
      }
    } catch (err) {
      setErrorMessage("Lỗi mạng: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Question manipulation helpers
  const updateQuestionText = (index: number, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text };
      return next;
    });
  };

  const updateQuestionExplanation = (index: number, explanation: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], explanation };
      return next;
    });
  };

  const updateQuestionLevel = (index: number, level: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], level };
      return next;
    });
  };

  const updateMultipleChoiceOption = (qIndex: number, optId: "A" | "B" | "C" | "D", text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex] as MultipleChoiceQuestion;
      if (q.type === "multiple_choice") {
        const nextOpts = q.options.map((opt) => (opt.id === optId ? { ...opt, text } : opt));
        next[qIndex] = { ...q, options: nextOpts };
      }
      return next;
    });
  };

  const setMultipleChoiceCorrectAnswer = (qIndex: number, correctAnswer: "A" | "B" | "C" | "D") => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex] as MultipleChoiceQuestion;
      if (q.type === "multiple_choice") {
        next[qIndex] = { ...q, correctAnswer, answerUnknown: false };
      }
      return next;
    });
  };

  const updateTrueFalseSub = (qIndex: number, subIndex: number, fields: { text?: string; isCorrect?: boolean }) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex] as TrueFalseQuestion;
      if (q.type === "true_false" && q.subQuestions[subIndex]) {
        const subList = [...q.subQuestions];
        subList[subIndex] = { ...subList[subIndex], ...fields };
        next[qIndex] = { ...q, subQuestions: subList };
      }
      return next;
    });
  };

  const updateShortAnswerKeys = (qIndex: number, rawKeys: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex] as ShortAnswerQuestion;
      if (q.type === "short_answer") {
        const keys = rawKeys
          .split(/[,;\n]/)
          .map((k) => k.trim())
          .filter(Boolean);
        next[qIndex] = { ...q, correctAnswers: keys };
      }
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    if (!confirm(`Xác nhận xóa câu hỏi số ${index + 1}?`)) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index: number) => {
    setQuestions((prev) => {
      const q = prev[index];
      const copy = JSON.parse(JSON.stringify(q));
      copy.id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const addNewQuestion = (type: "multiple_choice" | "true_false" | "short_answer") => {
    const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    let newQ: Question;

    if (type === "multiple_choice") {
      newQ = {
        id,
        type: "multiple_choice",
        text: "Nội dung câu hỏi trắc nghiệm mới...",
        options: [
          { id: "A", text: "Phương án A" },
          { id: "B", text: "Phương án B" },
          { id: "C", text: "Phương án C" },
          { id: "D", text: "Phương án D" },
        ],
        correctAnswer: "A",
        level: "NB",
      };
    } else if (type === "true_false") {
      newQ = {
        id,
        type: "true_false",
        text: "Cho mệnh đề hoặc bài toán sau. Xét tính đúng/sai của các ý:",
        subQuestions: [
          { id: "a", text: "Mệnh đề a", isCorrect: true, level: "NB" },
          { id: "b", text: "Mệnh đề b", isCorrect: false, level: "TH" },
          { id: "c", text: "Mệnh đề c", isCorrect: true, level: "VD" },
          { id: "d", text: "Mệnh đề d", isCorrect: false, level: "VDC" },
        ],
        level: "TH",
      };
    } else {
      newQ = {
        id,
        type: "short_answer",
        text: "Nội dung câu hỏi trả lời ngắn...",
        correctAnswers: ["10"],
        level: "VD",
      };
    }

    setQuestions((prev) => [...prev, newQ]);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        Đang tải thông tin đề thi...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Kho đề thi</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Chỉnh sửa đề thi & Câu hỏi</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMathPreview(!showMathPreview)}
            className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Bật/Tắt xem trước công thức LaTeX"
          >
            {showMathPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showMathPreview ? "Ẩn KaTeX" : "Xem KaTeX"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công các thay đổi vào Supabase và hệ thống!</span>
        </div>
      )}

      {showSqlModal && <SqlFixModal onClose={() => setShowSqlModal(false)} />}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <span className="whitespace-pre-line">{errorMessage}</span>
            {(errorMessage.toLowerCase().includes("rls") ||
              errorMessage.toLowerCase().includes("row-level") ||
              errorMessage.toLowerCase().includes("policy")) && (
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="block px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Xem cách khắc phục (SQL)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thông tin chung của đề thi */}
      <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Thông tin chung đề thi</span>
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">Tên đề thi *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Kiểm tra giữa kỳ 2 Toán 12 - Năm học 2024-2025"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Môn học</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Toán học"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Lớp học giao bài</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Toàn trường">Toàn trường (Tự do)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  Lớp {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Thời gian (Phút)</label>
            <input
              type="number"
              min={5}
              max={180}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Hạn chót nộp bài</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Danh sách câu hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-muted-foreground">
              Thầy/Cô có thể chỉnh sửa nội dung, đáp án đúng, mức độ nhận thức hoặc thêm/xóa câu hỏi.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => addNewQuestion("multiple_choice")}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Trắc nghiệm 4 lựa chọn</span>
            </button>
            <button
              type="button"
              onClick={() => addNewQuestion("true_false")}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Đúng / Sai</span>
            </button>
            <button
              type="button"
              onClick={() => addNewQuestion("short_answer")}
              className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Trả lời ngắn</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Chưa có câu hỏi nào trong đề thi.</p>
            <button
              type="button"
              onClick={() => addNewQuestion("multiple_choice")}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
            >
              + Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isMC = q.type === "multiple_choice";
            const isTF = q.type === "true_false";
            const isSA = q.type === "short_answer";

            return (
              <div
                key={q.id || idx}
                className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs hover:border-blue-500/40 transition-colors"
              >
                {/* Question Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-muted text-foreground">
                      {isMC
                        ? "Trắc nghiệm 4 phương án"
                        : isTF
                        ? "Đúng / Sai (4 ý a,b,c,d)"
                        : isSA
                        ? "Trả lời ngắn"
                        : "Tự luận"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Level selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Mức độ:</span>
                      <select
                        value={q.level || "TH"}
                        onChange={(e) => updateQuestionLevel(idx, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-border bg-background text-xs font-bold"
                      >
                        <option value="NB">NB (Nhận biết)</option>
                        <option value="TH">TH (Thông hiểu)</option>
                        <option value="VD">VD (Vận dụng)</option>
                        <option value="VDC">VDC (Vận dụng cao)</option>
                      </select>
                    </div>

                    {/* Move up / down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, "up")}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestion(idx, "down")}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => duplicateQuestion(idx)}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-600 cursor-pointer"
                      title="Nhân bản câu"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteQuestion(idx)}
                      className="p-1 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-rose-600 cursor-pointer"
                      title="Xóa câu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nội dung câu hỏi (hỗ trợ $công thức$ LaTeX)</label>
                  <textarea
                    rows={2}
                    value={q.text}
                    onChange={(e) => updateQuestionText(idx, e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                  {showMathPreview && q.text && (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 text-xs">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                        Xem trước hiển thị:
                      </span>
                      <MathText content={q.text} />
                    </div>
                  )}
                </div>

                {/* Multiple choice options */}
                {isMC && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>4 Phương án lựa chọn (Click vào chữ cái A/B/C/D để chọn đáp án đúng):</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Đáp án đúng: {(q as MultipleChoiceQuestion).correctAnswer}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(q as MultipleChoiceQuestion).options.map((opt) => {
                        const isCorrect = (q as MultipleChoiceQuestion).correctAnswer === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-2 p-2.5 rounded-xl border transition-colors ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                                : "border-border bg-background"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setMultipleChoiceCorrectAnswer(idx, opt.id)}
                              className={`w-7 h-7 rounded-lg text-xs font-black shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                                isCorrect
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-muted text-foreground hover:bg-muted/80"
                              }`}
                              title={`Chọn ${opt.id} làm đáp án đúng`}
                            >
                              {opt.id}
                            </button>
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => updateMultipleChoiceOption(idx, opt.id, e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-border/80 bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={`Nội dung phương án ${opt.id}...`}
                              />
                              {showMathPreview && opt.text && (
                                <div className="text-[11px] text-muted-foreground">
                                  <MathText content={opt.text} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* True / False subquestions */}
                {isTF && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-foreground">
                      4 Ý hỏi đúng/sai (a, b, c, d):
                    </label>
                    <div className="space-y-2">
                      {(q as TrueFalseQuestion).subQuestions.map((sub, sIdx) => (
                        <div
                          key={sub.id || sIdx}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background"
                        >
                          <span className="w-6 font-bold text-xs text-muted-foreground">
                            {sub.id})
                          </span>
                          <input
                            type="text"
                            value={sub.text}
                            onChange={(e) => updateTrueFalseSub(idx, sIdx, { text: e.target.value })}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-border/80 bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={`Nội dung ý ${sub.id}...`}
                          />
                          <button
                            type="button"
                            onClick={() => updateTrueFalseSub(idx, sIdx, { isCorrect: !sub.isCorrect })}
                            className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                              sub.isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-600 text-white"
                            }`}
                          >
                            {sub.isCorrect ? "ĐÚNG" : "SAI"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short answer */}
                {isSA && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-foreground">
                      Đáp án đúng được chấp nhận (cách nhau bởi dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={((q as ShortAnswerQuestion).correctAnswers || []).join(", ")}
                      onChange={(e) => updateShortAnswerKeys(idx, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="VD: 12, 12.0, 12,0"
                    />
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Hướng dẫn giải / Lời giải chi tiết (tùy chọn)
                  </label>
                  <textarea
                    rows={1}
                    value={q.explanation || ""}
                    onChange={(e) => updateQuestionExplanation(idx, e.target.value)}
                    className="w-full p-2 rounded-xl border border-border/80 bg-background text-xs font-normal focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nhập lời giải hoặc ghi chú..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-lg flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Đề thi hiện có <span className="font-bold text-foreground">{questions.length}</span> câu hỏi.
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/teacher/exams"
            className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
          >
            Hủy / Về kho đề
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

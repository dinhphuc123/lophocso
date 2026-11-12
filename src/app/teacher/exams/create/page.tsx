"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Upload, 
  Image as ImageIcon,
  HelpCircle,
  FileUp,
  Tag,
  Pencil,
  Check,
  Table as TableIcon
} from "lucide-react";
import { parseExamText } from "@/lib/parser";
import { Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from "@/lib/types";
import { MathText } from "@/components/MathText";
import { SqlFixModal } from "@/components/SqlFixModal";
import { distributeExamPoints, auditExamQuestions } from "@/lib/item-analysis";

export default function CreateExamPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [title, setTitle] = useState("Đề kiểm tra trắc nghiệm Toán 12 - Chuẩn BGD 2025");
  const [subject, setSubject] = useState("Toán học 12");
  const [targetClass, setTargetClass] = useState("Toàn trường");
  const [duration, setDuration] = useState(45);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.classes?.length > 0) {
          const names = d.classes.map((c: { name: string }) => c.name);
          setAvailableClasses(names);
          if (names.length > 0) {
            setTargetClass(names[0]);
          }
        }
      })
      .catch(() => {});
  }, []);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<{
    fileName: string;
    imageCount: number;
    tableCount: number;
    questionCount: number;
  } | null>(null);

  // Paste raw text state
  const [rawText, setRawText] = useState(`Phần 1. Trắc nghiệm nhiều lựa chọn
Câu 1. [NB] Thời gian tập thể dục mỗi ngày (đơn vị: phút) của 35 người cao tuổi tại một khu phố được thống kê trong bảng tần số ghép nhóm sau:
| Thời gian (phút) | $[0;15)$ | $[15;30)$ | $[30;45)$ | $[45;60)$ | $[60;75)$ |
| --- | --- | --- | --- | --- | --- |
| Số người | $4$ | $9$ | $12$ | $7$ | $3$ |
Khoảng biến thiên của mẫu số liệu ghép nhóm trên bằng:
A. $60$.
<u>B</u>. $75$.
C. $15$.
D. $45$.
[HDG]
Đầu mút trái của nhóm đầu tiên $[0;15)$ là $a_1=0$ và đầu mút phải của nhóm cuối cùng $[60;75)$ là $a_6=75$. Suy ra khoảng biến thiên là $R=75-0=75$ (phút). Chọn đáp án B.

Phần 2. Trắc nghiệm Đúng/Sai
Câu 2. [TF] Cho hàm số $f(x)=2\\cos(x)+x$.
<u>a)</u> [NB]#$f(0)=2; f(\\pi/2)=\\pi/2$.
b) [NB]#Đạo hàm của hàm số đã cho là $f'(x)=2\\sin(x)+1$.
<u>c)</u> [TH]#Nghiệm của phương trình $f'(x)=0$ trên đoạn $[0; \\pi/2]$ là $\\pi/6$.
d) [TH]#Giá trị lớn nhất của $f(x)$ trên đoạn $[0; \\pi/2]$ là $\\sqrt{3}+\\pi/6$.
[HDG]
- Ý a) Đúng, Ý b) Sai, Ý c) Đúng, Ý d) Sai.

Phần 3. Trắc nghiệm trả lời ngắn
Câu 3. [TH] Cho hình lăng trụ đứng $ABC.A'B'C'$ có $AB=5, BC=6, CA=7$. Khoảng cách giữa hai đường thẳng $AA'$ và $BC$ bằng bao nhiêu? (làm tròn đến hàng phần mười).
Trả lời: [[4,9||4.9]]
[HDG]
Lời giải chi tiết...

Phần 4. Tự luận
Câu 4. [TL][VD] Có hai chiếc hộp, hộp I có 6 quả bóng màu đỏ và 4 quả bóng màu vàng, hộp II có 7 quả bóng màu đỏ và 3 quả bóng màu vàng. Lấy ngẫu nhiên một quả bóng từ hộp I bỏ vào hộp II. Sau đó lấy ngẫu nhiên một quả từ hộp II. Tính xác suất để quả bóng lấy ra từ hộp II là quả bóng chuyển từ hộp I sang, biết quả đó màu đỏ.`);

  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Vui lòng chọn tệp Word định dạng .docx");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadedInfo(null);
    setEditingIndex(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/exams/upload-docx", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Lỗi khi trích xuất tệp Word");
      }

      setUploadedInfo({
        fileName: file.name,
        imageCount: data.imageCount ?? 0,
        tableCount: data.tableCount ?? 0,
        questionCount: data.questionCount ?? 0,
      });

      setTitle(file.name.replace(/\.docx$/i, ""));
      setParsedQuestions(data.questions);
      setRawText(data.rawText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleParseText = () => {
    setError(null);
    setEditingIndex(null);
    const result = parseExamText(rawText);
    if (result.length === 0) {
      setError("Không tìm thấy câu hỏi hợp lệ. Vui lòng kiểm tra định dạng 'Câu 1:', 'A.', 'B.'...");
      return;
    }
    setParsedQuestions(result);
  };

  // Inline quick-edit helpers on Preview cards
  const handleSelectMCCorrect = (qIdx: number, optId: "A" | "B" | "C" | "D") => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx];
      if (q && q.type === "multiple_choice") {
        next[qIdx] = { ...q, correctAnswer: optId, answerUnknown: false };
      }
      return next;
    });
  };

  const handleUpdateMCOptionText = (qIdx: number, optId: "A" | "B" | "C" | "D", text: string) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx] as MultipleChoiceQuestion;
      if (q && q.type === "multiple_choice") {
        next[qIdx] = {
          ...q,
          options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
        };
      }
      return next;
    });
  };

  const handleToggleTFSub = (qIdx: number, subIdx: number) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx] as TrueFalseQuestion;
      if (q && q.type === "true_false" && q.subQuestions[subIdx]) {
        const subs = [...q.subQuestions];
        subs[subIdx] = { ...subs[subIdx], isCorrect: !subs[subIdx].isCorrect };
        next[qIdx] = { ...q, subQuestions: subs };
      }
      return next;
    });
  };

  const handleUpdateTFSubText = (qIdx: number, subIdx: number, text: string) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx] as TrueFalseQuestion;
      if (q && q.type === "true_false" && q.subQuestions[subIdx]) {
        const subs = [...q.subQuestions];
        subs[subIdx] = { ...subs[subIdx], text };
        next[qIdx] = { ...q, subQuestions: subs };
      }
      return next;
    });
  };

  const handleUpdateShortAnswers = (qIdx: number, raw: string) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx] as ShortAnswerQuestion;
      if (q && q.type === "short_answer") {
        const arr = raw
          .split(/(?:\|\||[,;\n])/)
          .map((s) => s.trim())
          .filter(Boolean);
        next[qIdx] = { ...q, correctAnswers: arr.length > 0 ? arr : [""] };
      }
      return next;
    });
  };

  const handleUpdateField = (
    qIdx: number,
    fields: Partial<Pick<Question, "text" | "explanation" | "level" | "points">>
  ) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      if (next[qIdx]) {
        next[qIdx] = { ...next[qIdx], ...fields } as Question;
      }
      return next;
    });
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setShowSqlModal(false);
    try {
      const qList = parsedQuestions.length > 0 ? parsedQuestions : parseExamText(rawText);
      if (qList.length === 0) {
        setError("Vui lòng tách ít nhất 1 câu hỏi hợp lệ trước khi xuất bản");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          targetClass,
          durationMinutes: duration,
          questions: qList,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.sqlToRun) {
          setShowSqlModal(true);
        }
        throw new Error(data.error || "Lỗi tạo đề thi");
      }

      router.push(`/teacher/exams`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Dashboard</span>
        </Link>
        <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          Tự động tách câu, bảng số liệu & hình vẽ từ file .docx
        </span>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Nhận dạng đề thi tự động từ file Word (.docx)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ nhận dạng tự động: bảng tần số ghép nhóm, bảng biến thiên, hình vẽ đồ thị, công thức Toán (Word Equation / LaTeX), đáp án gạch chân / tô màu / từ [HDG], câu Đúng-Sai [TF], trả lời ngắn [[đáp án]] và tự luận [TL].
          </p>
        </div>

        {showSqlModal && <SqlFixModal onClose={() => setShowSqlModal(false)} />}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs flex items-start gap-2 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <span className="whitespace-pre-line">{error}</span>
              {(error.toLowerCase().includes("rls") || error.toLowerCase().includes("row-level") || error.toLowerCase().includes("policy")) && (
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

        {/* Input Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-muted rounded-xl w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              inputMode === "upload"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileUp className="w-4 h-4 text-blue-600" />
            <span>Tải lên file Word (.docx có bảng & hình vẽ)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              inputMode === "paste"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Dán văn bản trực tiếp</span>
          </button>
        </div>

        {/* Upload Dropzone */}
        {inputMode === "upload" && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${isUploading 
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" 
                  : "border-border hover:border-blue-500 hover:bg-muted/40"
                }
              `}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                {isUploading ? (
                  <Sparkles className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {isUploading ? "Đang phân tích đề, bảng số liệu và trích xuất hình vẽ..." : "Kéo thả hoặc bấm để chọn file Word (.docx)"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Hệ thống tự động bóc tách bảng tần số ghép nhóm, hình vẽ, nhận diện chữ gạch chân / tô màu hoặc từ [HDG] làm đáp án đúng, phân loại mức độ [NB]/[TH]/[VD].
              </p>
            </div>

            {uploadedInfo && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      {uploadedInfo.fileName}
                    </span>
                    <div className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-2">
                      <span>Đã nhận diện: <strong>{uploadedInfo.questionCount} câu hỏi</strong></span>
                      <span>·</span>
                      <span>Bảng số liệu: <strong>{uploadedInfo.tableCount} bảng</strong></span>
                      <span>·</span>
                      <span>Hình ảnh/đồ thị: <strong>{uploadedInfo.imageCount} hình</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>
            )}
          </div>
        )}

        {/* Exam settings form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tên đề thi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Kiểm tra giữa kì 2 môn Toán"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Môn học</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Lớp học nhận bài</label>
            {availableClasses.length > 0 ? (
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="Toàn trường">Toàn trường</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Lớp {cls}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: 12A1"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Thời gian (phút)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Text input area (Only in paste mode) */}
        {inputMode === "paste" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Nội dung đề thi theo mẫu OLM / CV 7991 (hỗ trợ bảng Markdown | ... |):
              </label>
              <button
                type="button"
                onClick={handleParseText}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tách câu hỏi & Xem trước
              </button>
            </div>

            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              placeholder="Dán nội dung đề thi vào đây..."
            />
          </div>
        )}

        {/* Parsed questions preview */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kết quả nhận dạng: {parsedQuestions.length} câu hỏi</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Thầy/cô có thể bấm trực tiếp vào phương án A/B/C/D hoặc nút Đúng/Sai để đổi nhanh đáp án, hoặc bấm &ldquo;Sửa câu&rdquo; để chỉnh nội dung &amp; bảng số liệu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Chia điểm nhanh:</span>
                <button
                  type="button"
                  onClick={() => setParsedQuestions((prev) => distributeExamPoints(prev, "bgd2025"))}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold cursor-pointer"
                >
                  Chuẩn BGD 2025
                </button>
                <button
                  type="button"
                  onClick={() => setParsedQuestions((prev) => distributeExamPoints(prev, "equal10"))}
                  className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border text-[11px] font-bold cursor-pointer"
                >
                  Chia đều 10đ
                </button>
              </div>
            </div>

            {(() => {
              const issues = auditExamQuestions(parsedQuestions);
              if (issues.length === 0) return null;
              return (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-1 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Lưu ý rà soát đề sau khi nhập ({issues.length} cảnh báo):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                    {issues.map((iss, i) => (
                      <li key={i}>{iss.message}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {parsedQuestions.map((q, idx) => {
                const isEditing = editingIndex === idx;
                const hasTable = q.text.includes("|");

                return (
                  <div key={q.id} className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-foreground">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">Câu {idx + 1}</span>
                        <select
                          value={q.level || "NB"}
                          onChange={(e) => handleUpdateField(idx, { level: e.target.value })}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                          title="Đổi mức độ nhận thức"
                        >
                          <option value="NB">[NB] Nhận biết</option>
                          <option value="TH">[TH] Thông hiểu</option>
                          <option value="VD">[VD] Vận dụng</option>
                          <option value="VDC">[VDC] Vận dụng cao</option>
                        </select>
                        <span className="text-muted-foreground text-[11px] font-normal">
                          ({q.type === "multiple_choice" ? "Trắc nghiệm nhiều lựa chọn" : q.type === "true_false" ? "Đúng/Sai [TF]" : q.type === "short_answer" ? "Trả lời ngắn" : "Tự luận [TL]"})
                        </span>
                        {hasTable && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <TableIcon className="w-3 h-3" />
                            <span>Có bảng số liệu</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="10"
                            value={q.points ?? 0.25}
                            onChange={(e) => handleUpdateField(idx, { points: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-0.5 rounded border border-border bg-background text-blue-600 font-bold font-mono text-center text-xs"
                          />
                          <span className="text-blue-600 font-semibold text-[11px]">đ</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(isEditing ? null : idx)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            isEditing
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-card hover:bg-muted text-foreground border-border"
                          }`}
                        >
                          {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                          <span>{isEditing ? "Xong" : "Sửa câu"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Editor for Question Text & Table */}
                    {isEditing ? (
                      <div className="space-y-2 p-3 rounded-xl bg-card border border-blue-300 dark:border-blue-800">
                        <label className="text-[11px] font-bold text-foreground block">
                          Nội dung đề bài &amp; Bảng số liệu (hỗ trợ $LaTeX$ và bảng Markdown | cột 1 | cột 2 |):
                        </label>
                        <textarea
                          rows={hasTable ? 5 : 3}
                          value={q.text}
                          onChange={(e) => handleUpdateField(idx, { text: e.target.value })}
                          className="w-full p-2.5 rounded-lg border border-border bg-background font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Xem trước hiển thị trực tiếp:
                          </span>
                          <div className="text-foreground text-sm font-medium whitespace-pre-wrap">
                            <MathText content={q.text} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Question Text Display */
                      <div className="text-foreground text-sm font-medium whitespace-pre-wrap leading-relaxed">
                        <MathText content={q.text} />
                      </div>
                    )}

                    {/* Question Image (from docx) */}
                    {q.imageUrl && (
                      <div className="p-2 rounded-xl bg-card border border-border/60 w-fit">
                        <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Hình vẽ trích xuất từ file Word:</span>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.imageUrl}
                          alt={`Hình vẽ câu ${idx + 1}`}
                          className="max-h-56 max-w-full rounded-lg object-contain bg-white"
                        />
                      </div>
                    )}

                    {/* Multiple Choice Preview & Interactive Answer Selector */}
                    {q.type === "multiple_choice" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.id === q.correctAnswer;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => !isEditing && handleSelectMCCorrect(idx, opt.id)}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-colors ${
                                !isEditing ? "cursor-pointer" : ""
                              } ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200"
                                  : "border-border bg-background hover:bg-muted/60 text-foreground/80"
                              }`}
                              title={!isEditing ? `Bấm để chọn ${opt.id} làm đáp án đúng` : undefined}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectMCCorrect(idx, opt.id);
                                }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {opt.id}
                              </button>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateMCOptionText(idx, opt.id, e.target.value)}
                                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs font-normal text-foreground"
                                />
                              ) : (
                                <span className="flex-1"><MathText content={opt.text} /></span>
                              )}
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 shrink-0">✓ ĐÁP ÁN</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False Preview & Interactive Toggle */}
                    {q.type === "true_false" && (
                      <div className="space-y-1.5 pt-1">
                        {q.subQuestions.map((sub, sIdx) => (
                          <div key={sub.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background border border-border">
                            <div className="flex items-center gap-2 flex-1">
                              <strong>{sub.id})</strong>
                              {sub.level && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-muted text-muted-foreground">
                                  [{sub.level}]
                                </span>
                              )}
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={sub.text}
                                  onChange={(e) => handleUpdateTFSubText(idx, sIdx, e.target.value)}
                                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs"
                                />
                              ) : (
                                <span><MathText content={sub.text} /></span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleTFSub(idx, sIdx)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer transition-colors shrink-0 ${
                                sub.isCorrect
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-rose-600 text-white hover:bg-rose-700"
                              }`}
                              title="Bấm để đổi Đúng / Sai"
                            >
                              {sub.isCorrect ? "Đúng ✓" : "Sai ✕"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer Preview & Editable Input */}
                    {q.type === "short_answer" && (
                      <div className="p-2.5 rounded-lg bg-background border border-border flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground font-semibold">Đáp án đúng [[...]] :</span>
                        <input
                          type="text"
                          value={q.correctAnswers.join(" || ")}
                          onChange={(e) => handleUpdateShortAnswers(idx, e.target.value)}
                          placeholder="VD: 1,79 || 1.79"
                          className="flex-1 min-w-[160px] px-2.5 py-1 rounded border border-border bg-muted/30 text-blue-600 font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Explanation [HDG] */}
                    {(q.explanation || isEditing) && (
                      <div className="text-[11px] text-muted-foreground bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-2.5 rounded-lg space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="flex-1 whitespace-pre-wrap leading-relaxed">
                            <strong className="text-foreground">[HDG]:</strong>{" "}
                            <MathText content={q.explanation || ""} />
                          </div>
                        </div>
                        {isEditing && (
                          <textarea
                            rows={2}
                            value={q.explanation || ""}
                            onChange={(e) => handleUpdateField(idx, { explanation: e.target.value })}
                            placeholder="Nhập hoặc chỉnh sửa lời giải chi tiết [HDG]..."
                            className="w-full p-2 rounded border border-border bg-background font-mono text-xs text-foreground"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Publish Action */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Link
            href="/teacher/dashboard"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold"
          >
            Huỷ bỏ
          </Link>
          <button
            onClick={handlePublish}
            disabled={loading || (parsedQuestions.length === 0 && (!rawText || !rawText.trim()))}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang xuất bản..." : `Xuất bản đề thi (${parsedQuestions.length > 0 ? parsedQuestions.length : "tự động tách"} câu) →`}
          </button>
        </div>
      </div>
    </div>
  );
}

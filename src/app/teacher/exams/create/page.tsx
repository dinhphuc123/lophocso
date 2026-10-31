"use client";

import { useState, useRef } from "react";
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
  Tag
} from "lucide-react";
import { parseExamText } from "@/lib/parser";
import { Question } from "@/lib/types";
import { MathText } from "@/components/MathText";

export default function CreateExamPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [title, setTitle] = useState("Đề kiểm tra trắc nghiệm Toán 12 - Chuẩn BGD 2025");
  const [subject, setSubject] = useState("Toán học 12");
  const [targetClass, setTargetClass] = useState("12A1, 12A2");
  const [duration, setDuration] = useState(45);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<{ fileName: string; imageCount: number; questionCount: number } | null>(null);

  // Paste raw text state
  const [rawText, setRawText] = useState(`Phần 1. Trắc nghiệm nhiều lựa chọn
Câu 1. [NB] Cho hàm số y=f(x) có bảng biến thiên như hình vẽ.
Tiệm cận ngang của đồ thị hàm số là:
A. x=-1/2.
B. y=-1.
C. y=-1/2.
D. x=-1.
[HDG]
Tiệm cận ngang của đồ thị hàm số là đường thẳng y=-1.

Phần 2. Trắc nghiệm Đúng/Sai
Câu 2. [TF] Cho hàm số f(x)=2cos(x)+x.
a) [NB]#f(0)=2; f(π/2)=π/2.
b) [NB]#Đạo hàm của hàm số đã cho là f'(x)=2sin(x)+1.
c) [TH]#Nghiệm của phương trình f'(x)=0 trên đoạn [0; π/2] là π/6.
d) [TH]#Giá trị lớn nhất của f(x) trên đoạn [0; π/2] là √3+π/6.
[HDG]
Vị trí đặt lời giải chi tiết...

Phần 3. Trắc nghiệm trả lời ngắn
Câu 3. [TH] Cho hình lăng trụ đứng ABC.A'B'C' có AB=5, BC=6, CA=7. Khoảng cách giữa hai đường thẳng AA' và BC bằng bao nhiêu? (làm tròn đến hàng phần mười).
Trả lời: [[4,9||4.9]]
[HDG]
Lời giải chi tiết...

Phần 4. Tự luận
Câu 4. [TL][VD] Có hai chiếc hộp, hộp I có 6 quả bóng màu đỏ và 4 quả bóng màu vàng, hộp II có 7 quả bóng màu đỏ và 3 quả bóng màu vàng. Lấy ngẫu nhiên một quả bóng từ hộp I bỏ vào hộp II. Sau đó lấy ngẫu nhiên một quả từ hộp II. Tính xác suất để quả bóng lấy ra từ hộp II là quả bóng chuyển từ hộp I sang, biết quả đó màu đỏ.`);

  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlCommand, setSqlCommand] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Vui lòng chọn tệp Word định dạng .docx");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadedInfo(null);

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
        imageCount: data.imageCount,
        questionCount: data.questionCount,
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
    const result = parseExamText(rawText);
    if (result.length === 0) {
      setError("Không tìm thấy câu hỏi hợp lệ. Vui lòng kiểm tra định dạng 'Câu 1:', 'A.', 'B.'...");
      return;
    }
    setParsedQuestions(result);
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSqlCommand(null);
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
          setSqlCommand(data.sqlToRun);
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
          Tự động tách câu & hình vẽ từ file .docx
        </span>
      </div>

      <div className="border border-border bg-card rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Nhận dạng đề thi tự động từ file Word (.docx)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ nhận dạng tự động: hình vẽ đồ thị, gạch chân đáp án đúng, mức độ [NB]/[TH]/[VD], câu Đúng-Sai [TF], trả lời ngắn [[đáp án]] và tự luận [TL].
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {sqlCommand && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 space-y-2 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200">
              Cách khắc phục: Mở quyền ghi Supabase (chỉ cần chạy 1 lần)
            </div>
            <p className="text-amber-800 dark:text-amber-300">
              1. Vào trang quản trị <strong>Supabase Dashboard</strong> &gt; chọn Project &gt; mở <strong>SQL Editor</strong>.<br/>
              2. Dán đoạn lệnh dưới đây và bấm <strong>Run</strong>:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <code className="flex-1 p-2.5 rounded-lg bg-black/10 dark:bg-black/40 font-mono text-[11px] overflow-x-auto text-foreground">
                {sqlCommand}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlCommand);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                {sqlCopied ? "Đã sao chép!" : "Sao chép lệnh SQL"}
              </button>
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
            <span>Tải lên file Word (.docx có hình vẽ)</span>
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
                {isUploading ? "Đang phân tích đề và trích xuất hình vẽ..." : "Kéo thả hoặc bấm để chọn file Word (.docx)"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Hệ thống tự động bóc tách toàn bộ hình vẽ, nhận diện chữ gạch chân là đáp án đúng, phân loại mức độ [NB]/[TH]/[VD].
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
                    <div className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">
                      Đã nhận diện: <strong>{uploadedInfo.questionCount} câu hỏi</strong> · Trích xuất: <strong>{uploadedInfo.imageCount} hình ảnh/đồ thị</strong>
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
            <label className="text-xs font-semibold text-foreground">Lớp học</label>
            <input
              type="text"
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: 12A1"
            />
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
                Nội dung đề thi theo mẫu OLM / CV 7991:
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kết quả nhận dạng: {parsedQuestions.length} câu hỏi
              </h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {parsedQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-3">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Câu {idx + 1}</span>
                      {q.level && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          [{q.level}]
                        </span>
                      )}
                      <span className="text-muted-foreground text-[11px] font-normal">
                        ({q.type === "multiple_choice" ? "Trắc nghiệm nhiều lựa chọn" : q.type === "true_false" ? "Đúng/Sai [TF]" : q.type === "short_answer" ? "Trả lời ngắn" : "Tự luận [TL]"})
                      </span>
                    </div>
                    <span className="text-blue-600 font-semibold">{q.points} điểm</span>
                  </div>

                  {/* Question Text */}
                  <div className="text-foreground text-sm font-medium whitespace-pre-wrap">
                    <MathText content={q.text} />
                  </div>

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

                  {/* Multiple Choice Preview */}
                  {q.type === "multiple_choice" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                            opt.id === q.correctAnswer
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
                              : "border-border bg-background text-foreground/80"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                            opt.id === q.correctAnswer ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {opt.id}
                          </span>
                          <span><MathText content={opt.text} /></span>
                          {opt.id === q.correctAnswer && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-600">✓ ĐÁP ÁN (GẠCH CHÂN)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True/False Preview */}
                  {q.type === "true_false" && (
                    <div className="space-y-1.5 pt-1">
                      {q.subQuestions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                          <div className="flex items-center gap-2">
                            <strong>{sub.id})</strong>
                            {sub.level && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-muted text-muted-foreground">
                                [{sub.level}]
                              </span>
                            )}
                            <span><MathText content={sub.text} /></span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sub.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                            {sub.isCorrect ? "Đúng" : "Sai"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer Preview */}
                  {q.type === "short_answer" && (
                    <div className="p-2.5 rounded-lg bg-background border border-border flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Đáp án đúng [[...]] :</span>
                      <strong className="text-blue-600 font-mono">{q.correctAnswers.join(" || ")}</strong>
                    </div>
                  )}

                  {/* Explanation [HDG] */}
                  {q.explanation && (
                    <div className="text-[11px] text-muted-foreground bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-2.5 rounded-lg flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">[HDG]:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

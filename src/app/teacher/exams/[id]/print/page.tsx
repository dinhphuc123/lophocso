"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Exam } from "@/lib/types";
import { MathText } from "@/components/MathText";
import { QuestionFigures } from "@/components/QuestionFigures";
import { shuffleExam } from "@/lib/shuffler";

export default function ExamPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [examCode, setExamCode] = useState<"101" | "102" | "103" | "104">("101");
  const [showAnswers, setShowAnswers] = useState(false);

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

  // Generate scrambled questions based on examCode
  const scrambledQuestions = useMemo(() => {
    if (!exam) return [];
    return shuffleExam(exam, examCode).questions;
  }, [exam, examCode]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Đang tải đề thi để in...</div>;
  }

  if (!exam) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-foreground">Không tìm thấy thông tin đề thi</p>
        <Link href="/teacher/exams" className="text-xs text-blue-600 hover:underline">Về kho đề thi</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control bar - hidden on print */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/exams/${examId}/matrix`}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Quay lại Ma trận"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h3 className="font-bold text-sm text-foreground">Chế độ in ấn &amp; Xuất đề thi</h3>
            <p className="text-xs text-muted-foreground">Tự động hoán vị mã đề &amp; kèm Phiếu tô trắc nghiệm BGD 2025</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Exam Code Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl text-xs font-semibold">
            <span className="text-[11px] text-muted-foreground pl-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-600" />
              Mã đề:
            </span>
            {(["101", "102", "103", "104"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setExamCode(code)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                  examCode === code
                    ? "bg-card text-blue-600 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Answer Toggle */}
          <button
            type="button"
            onClick={() => setShowAnswers(!showAnswers)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              showAnswers
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showAnswers ? "Đang hiện đáp án" : "Hiện đáp án"}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In đề &amp; Phiếu tô (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PAGE 1: ĐỀ THI IN CHUẨN A4
         ======================================================== */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
        {/* Header trường và mã đề */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-black text-xs leading-relaxed">
          <div className="space-y-1">
            <div className="font-bold uppercase">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div className="font-bold uppercase text-sm">TRƯỜNG THPT CHUYÊN &amp; THPT</div>
            <div className="italic">Đề kiểm tra định kỳ môn: <strong>{exam.subject}</strong></div>
            <div>Thời gian làm bài: <strong>{exam.durationMinutes} phút</strong> (không kể thời gian phát đề)</div>
          </div>

          <div className="text-right space-y-1">
            <div className="font-bold uppercase text-sm">ĐỀ THI CHÍNH THỨC</div>
            <div className="inline-block border-2 border-black px-3 py-1 font-bold text-sm tracking-wider font-mono">
              MÃ ĐỀ: {examCode}
            </div>
            <div className="pt-2 text-[11px] text-left border-t border-dashed border-gray-400 mt-2 space-y-0.5">
              <div>Họ và tên thí sinh: ..........................................................................</div>
              <div>Số báo danh: .................................... Lớp: ..................................</div>
            </div>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-5 text-xs leading-relaxed">
          {scrambledQuestions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <div className="font-medium">
                <strong className="font-bold">Câu {idx + 1}.</strong>{" "}
                {q.level && <span className="font-bold text-gray-700">[{q.level}]</span>}{" "}
                <MathText content={q.text} />
              </div>

              {/* Hình ảnh (nếu có) */}
              <QuestionFigures
                imageUrl={q.imageUrl}
                imageUrls={q.imageUrls}
                questionNumber={idx + 1}
                variant="print"
              />

              {/* Multiple Choice Options */}
              {q.type === "multiple_choice" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4">
                  {q.options.map((opt) => {
                    const isCorrect = showAnswers && opt.id === q.correctAnswer;
                    return (
                      <div
                        key={opt.id}
                        className={`${isCorrect ? "font-bold text-blue-700 underline" : ""}`}
                      >
                        <strong>{opt.id}.</strong> <MathText content={opt.text} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True/False Subquestions */}
              {q.type === "true_false" && (
                <div className="space-y-1 pl-4">
                  {q.subQuestions.map((sub) => {
                    return (
                      <div key={sub.id} className="flex items-start gap-2">
                        <strong>{sub.id})</strong>
                        <div>
                          <MathText content={sub.text} />
                          {showAnswers && (
                            <span className="ml-2 font-bold text-emerald-700">
                              [{sub.isCorrect ? "ĐÚNG" : "SAI"}]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Essay */}
              {q.type === "short_answer" && (
                <div className="pl-4 text-gray-600 italic">
                  Trả lời: ............................................................................................
                  {showAnswers && (
                    <span className="ml-2 font-bold text-emerald-700 not-italic">
                      (Đáp án: {q.correctAnswers.join(" || ")})
                    </span>
                  )}
                </div>
              )}

              {q.type === "essay" && (
                <div className="pl-4 text-gray-400 italic space-y-1">
                  <div>....................................................................................................................................................................</div>
                  <div>....................................................................................................................................................................</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center font-bold text-xs pt-6 border-t border-black">
          ---------- HẾT ----------
        </div>
      </div>

      {/* ========================================================
          PAGE 2: PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN BGD 2025
         ======================================================== */}
      <div className="bg-white text-black p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 space-y-6 print:break-before-page">
        {/* Header Phiếu */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-black">
          <div className="text-xs font-bold uppercase tracking-wider">BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
            PHIẾU TRẢ LỜI TRẮC NGHIỆM
          </h2>
          <p className="text-[11px] text-gray-600 italic">
            Áp dụng cho kỳ thi Tốt nghiệp THPT &amp; Kiểm tra định kỳ theo Chương trình GDPT 2018
          </p>
        </div>

        {/* Thông tin thí sinh + SBD + Mã đề */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-black p-3 text-xs">
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-black pr-2 pb-2 sm:pb-0">
            <div className="font-bold uppercase text-[11px]">Thông tin thí sinh:</div>
            <div>Họ tên: .......................................................</div>
            <div>Lớp: ........................ Phòng thi: ................</div>
            <div>Môn thi: <strong>{exam.subject}</strong></div>
            <div>Ngày thi: ......./......./202...</div>
          </div>

          {/* Tô Số báo danh */}
          <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-black pr-2 pb-2 sm:pb-0 text-center">
            <div className="font-bold text-[11px] uppercase">Số báo danh (6 số)</div>
            <div className="grid grid-cols-6 gap-1 text-[10px] font-mono border border-black p-1 bg-gray-50">
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="space-y-0.5">
                  <div className="border-b border-black font-bold">_</div>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="w-3.5 h-3.5 rounded-full border border-black mx-auto flex items-center justify-center text-[8px]">
                      {num}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Tô Mã đề thi */}
          <div className="space-y-1 text-center">
            <div className="font-bold text-[11px] uppercase">Mã đề thi (3 số)</div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono border border-black p-1 bg-gray-50 max-w-[120px] mx-auto">
              {[0, 1, 2].map((col) => (
                <div key={col} className="space-y-0.5">
                  <div className="border-b border-black font-bold">_</div>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="w-3.5 h-3.5 rounded-full border border-black mx-auto flex items-center justify-center text-[8px]">
                      {num}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 PHẦN TRẢ LỜI THEO CHUẨN BGD 2025 */}
        <div className="space-y-6 pt-2 text-xs">
          {/* PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN */}
          <div className="border border-black p-3 space-y-2">
            <div className="font-bold uppercase bg-gray-100 p-1 border-b border-black flex justify-between">
              <span>PHẦN I: Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh chỉ tô 1 ô)</span>
              <span className="font-mono">12 CÂU</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex items-center justify-between border border-gray-300 p-1.5 rounded">
                  <span className="font-bold w-6">{i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {(["A", "B", "C", "D"] as const).map((ch) => (
                      <span
                        key={ch}
                        className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px] font-bold"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI */}
          <div className="border border-black p-3 space-y-2">
            <div className="font-bold uppercase bg-gray-100 p-1 border-b border-black flex justify-between">
              <span>PHẦN II: Câu trắc nghiệm Đúng / Sai (Thí sinh chọn Đ hoặc S cho mỗi ý a, b, c, d)</span>
              <span className="font-mono">4 CÂU</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
              {[1, 2, 3, 4].map((qNo) => (
                <div key={qNo} className="border border-black p-2 rounded space-y-1.5">
                  <div className="font-bold text-center border-b border-gray-300 pb-1">Câu {qNo}</div>
                  {(["a", "b", "c", "d"] as const).map((sub) => (
                    <div key={sub} className="flex items-center justify-between px-1">
                      <span className="font-bold">{sub})</span>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">
                          Đ
                        </span>
                        <span className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">
                          S
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN III: TRẢ LỜI NGẮN */}
          <div className="border border-black p-3 space-y-2">
            <div className="font-bold uppercase bg-gray-100 p-1 border-b border-black flex justify-between">
              <span>PHẦN III: Câu trắc nghiệm trả lời ngắn (Tô các số từ 0 đến 9 và dấu âm/phẩy)</span>
              <span className="font-mono">6 CÂU</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[9px] font-mono pt-1">
              {[1, 2, 3, 4, 5, 6].map((qNo) => (
                <div key={qNo} className="border border-black p-1 space-y-1">
                  <div className="font-bold border-b border-black pb-0.5">Câu {qNo}</div>
                  <div className="grid grid-cols-4 gap-0.5 border-b border-black pb-1">
                    <span className="border border-gray-400 h-4">_</span>
                    <span className="border border-gray-400 h-4">_</span>
                    <span className="border border-gray-400 h-4">_</span>
                    <span className="border border-gray-400 h-4">_</span>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 text-[8px]">
                    {[0, 1, 2, 3].map((col) => (
                      <div key={col} className="space-y-0.5">
                        <div className="w-3 h-3 rounded-full border border-black mx-auto flex items-center justify-center">-</div>
                        <div className="w-3 h-3 rounded-full border border-black mx-auto flex items-center justify-center">,</div>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <div key={n} className="w-3 h-3 rounded-full border border-black mx-auto flex items-center justify-center">
                            {n}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-500 italic pt-2">
          * Thí sinh dùng bút chì 2B để tô kín các ô tròn tương ứng với phương án trả lời.
        </div>
      </div>
    </div>
  );
}

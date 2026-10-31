"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { Exam } from "@/lib/types";
import { calculateExamMatrix, ExamMatrixResult } from "@/lib/matrix-calculator";

export default function ExamMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [matrix, setMatrix] = useState<ExamMatrixResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exam) {
          setExam(data.exam);
          setMatrix(calculateExamMatrix(data.exam));
        }
      })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Đang tính toán ma trận & bản đặc tả...</div>;
  }

  if (!exam || !matrix) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-foreground">Không tìm thấy thông tin đề thi</p>
        <Link href="/teacher/exams" className="text-xs text-blue-600 hover:underline">Về kho đề thi</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action bar - hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div>
          <Link
            href="/teacher/exams"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kho đề thi</span>
          </Link>
          <h2 className="text-xl font-bold text-foreground">Ma trận & Bản đặc tả đề thi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chuẩn theo Công văn 7991/BGDĐT &amp; Công văn 5512 · {exam.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/teacher/exams/${examId}/print`}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>In Đề thi &amp; Phiếu tô</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In ma trận (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - cognitive levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="p-3.5 rounded-xl border border-border bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground">Nhận biết (NB)</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {matrix.percentage.nb}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {matrix.totalPoints.nb} điểm · {matrix.totalQuestions.nb} câu/lệnh
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground">Thông hiểu (TH)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {matrix.percentage.th}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {matrix.totalPoints.th} điểm · {matrix.totalQuestions.th} câu/lệnh
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground">Vận dụng (VD)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {matrix.percentage.vd}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {matrix.totalPoints.vd} điểm · {matrix.totalQuestions.vd} câu/lệnh
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground">Vận dụng cao (VDC)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {matrix.percentage.vdc}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {matrix.totalPoints.vdc} điểm · {matrix.totalQuestions.vdc} câu/lệnh
          </div>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 space-y-8 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Official Header */}
        <div className="flex justify-between items-start text-xs border-b pb-4 border-border">
          <div className="text-center font-bold space-y-0.5 uppercase">
            <div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div className="text-foreground">TRƯỜNG THPT CHUYÊN &amp; THPT</div>
            <div className="text-[10px] text-muted-foreground font-normal">TỔ TOÁN - TIN HỌC</div>
          </div>
          <div className="text-center font-bold space-y-0.5">
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-[11px] underline">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-base sm:text-lg font-black uppercase text-foreground">
            KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ
          </h1>
          <p className="text-xs text-muted-foreground italic">
            (Kèm theo Công văn số 7991/BGDĐT-GDTrH của Bộ Giáo dục và Đào tạo)
          </p>
          <div className="text-xs font-semibold text-foreground pt-1 flex items-center justify-center gap-4 flex-wrap">
            <span>Môn: <strong>{exam.subject}</strong></span>
            <span>•</span>
            <span>Lớp: <strong>{exam.targetClass}</strong></span>
            <span>•</span>
            <span>Thời gian làm bài: <strong>{exam.durationMinutes} phút</strong></span>
            <span>•</span>
            <span>Hình thức: <strong>Trắc nghiệm khách quan</strong></span>
          </div>
        </div>

        {/* TABLE 1: MA TRẬN */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-foreground">
            I. Khung ma trận phân bổ câu hỏi và điểm số:
          </h3>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-muted/60 text-foreground font-bold border-b border-border">
                <tr>
                  <th rowSpan={2} className="p-2.5 border-r border-border w-10">TT</th>
                  <th rowSpan={2} className="p-2.5 border-r border-border text-left min-w-[200px]">Phần / Dạng thức câu hỏi</th>
                  <th colSpan={4} className="p-2 border-r border-border border-b border-border">Số câu hỏi / Lệnh hỏi</th>
                  <th colSpan={4} className="p-2 border-r border-border border-b border-border">Điểm số phân bổ</th>
                  <th rowSpan={2} className="p-2.5 border-r border-border w-16">Tổng điểm</th>
                  <th rowSpan={2} className="p-2.5 w-14">Tỉ lệ</th>
                </tr>
                <tr className="text-[10px] font-semibold bg-muted/40">
                  <th className="p-1.5 border-r border-border w-10">NB</th>
                  <th className="p-1.5 border-r border-border w-10">TH</th>
                  <th className="p-1.5 border-r border-border w-10">VD</th>
                  <th className="p-1.5 border-r border-border w-10">VDC</th>
                  <th className="p-1.5 border-r border-border w-12">NB</th>
                  <th className="p-1.5 border-r border-border w-12">TH</th>
                  <th className="p-1.5 border-r border-border w-12">VD</th>
                  <th className="p-1.5 border-r border-border w-12">VDC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-2.5 border-r border-border font-bold">{idx + 1}</td>
                    <td className="p-2.5 border-r border-border text-left">
                      <div className="font-bold text-foreground">{row.partTitle}</div>
                      <div className="text-[11px] text-muted-foreground">{row.formatName}</div>
                    </td>
                    <td className="p-2 border-r border-border">{row.questionCount.nb || "-"}</td>
                    <td className="p-2 border-r border-border">{row.questionCount.th || "-"}</td>
                    <td className="p-2 border-r border-border">{row.questionCount.vd || "-"}</td>
                    <td className="p-2 border-r border-border">{row.questionCount.vdc || "-"}</td>
                    <td className="p-2 border-r border-border font-mono">{row.points.nb || "-"}</td>
                    <td className="p-2 border-r border-border font-mono">{row.points.th || "-"}</td>
                    <td className="p-2 border-r border-border font-mono">{row.points.vd || "-"}</td>
                    <td className="p-2 border-r border-border font-mono">{row.points.vdc || "-"}</td>
                    <td className="p-2 border-r border-border font-bold font-mono text-blue-600">
                      {row.points.total}
                    </td>
                    <td className="p-2 font-bold font-mono">
                      {Math.round((row.points.total / matrix.totalPoints.total) * 100)}%
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-muted/50 font-bold border-t-2 border-border text-foreground">
                  <td colSpan={2} className="p-2.5 border-r border-border text-center">
                    TỔNG CỘNG
                  </td>
                  <td className="p-2 border-r border-border">{matrix.totalQuestions.nb}</td>
                  <td className="p-2 border-r border-border">{matrix.totalQuestions.th}</td>
                  <td className="p-2 border-r border-border">{matrix.totalQuestions.vd}</td>
                  <td className="p-2 border-r border-border">{matrix.totalQuestions.vdc}</td>
                  <td className="p-2 border-r border-border font-mono">{matrix.totalPoints.nb}</td>
                  <td className="p-2 border-r border-border font-mono">{matrix.totalPoints.th}</td>
                  <td className="p-2 border-r border-border font-mono">{matrix.totalPoints.vd}</td>
                  <td className="p-2 border-r border-border font-mono">{matrix.totalPoints.vdc}</td>
                  <td className="p-2 border-r border-border font-mono text-blue-600 text-sm">
                    {matrix.totalPoints.total}
                  </td>
                  <td className="p-2 font-mono">100%</td>
                </tr>
                {/* Percentage row */}
                <tr className="bg-muted/30 font-bold text-muted-foreground text-[11px]">
                  <td colSpan={2} className="p-2 border-r border-border text-center">
                    Tỉ lệ % theo mức độ
                  </td>
                  <td colSpan={2} className="p-2 border-r border-border text-center text-blue-600">
                    NB + TH: {matrix.percentage.nb + matrix.percentage.th}%
                  </td>
                  <td colSpan={2} className="p-2 border-r border-border text-center text-rose-600">
                    VD + VDC: {matrix.percentage.vd + matrix.percentage.vdc}%
                  </td>
                  <td colSpan={4} className="p-2 border-r border-border text-center">
                    {matrix.percentage.nb}% - {matrix.percentage.th}% - {matrix.percentage.vd}% - {matrix.percentage.vdc}%
                  </td>
                  <td colSpan={2} className="p-2 text-center text-foreground font-mono">
                    10.0 điểm
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 2: BẢN ĐẶC TẢ */}
        <div className="space-y-2 pt-4">
          <h3 className="text-xs font-bold uppercase text-foreground">
            II. Bản đặc tả ma trận đề kiểm tra đánh giá:
          </h3>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/60 text-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-2.5 border-r border-border text-center w-12">Câu</th>
                  <th className="p-2.5 border-r border-border w-24">Phần</th>
                  <th className="p-2.5 border-r border-border min-w-[140px]">Chủ đề kiến thức</th>
                  <th className="p-2.5 border-r border-border text-center w-20">Mức độ</th>
                  <th className="p-2.5 border-r border-border">Yêu cầu cần đạt (Chuẩn năng lực)</th>
                  <th className="p-2.5 text-center w-16">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.specifications.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="p-2.5 border-r border-border text-center font-bold">
                      {item.index}
                    </td>
                    <td className="p-2.5 border-r border-border font-medium text-muted-foreground text-[11px]">
                      {item.part}
                    </td>
                    <td className="p-2.5 border-r border-border font-semibold text-foreground">
                      {item.topic}
                    </td>
                    <td className="p-2.5 border-r border-border text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.level === "NB" ? "bg-blue-100 text-blue-800" :
                        item.level === "TH" ? "bg-emerald-100 text-emerald-800" :
                        item.level === "VD" ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>
                        [{item.level}]
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-border text-[11px] text-muted-foreground leading-relaxed">
                      {item.competency}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-foreground">
                      {item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Footer */}
        <div className="grid grid-cols-2 pt-8 text-center text-xs text-foreground font-semibold">
          <div className="space-y-12">
            <div>DUYỆT CỦA BAN GIÁM HIỆU</div>
            <div className="text-muted-foreground italic">(Ký và ghi rõ họ tên)</div>
          </div>
          <div className="space-y-12">
            <div>
              <div>Hà Nội, ngày ... tháng ... năm 202...</div>
              <div>NGƯỜI LẬP MA TRẬN &amp; ĐẶC TẢ</div>
            </div>
            <div className="text-muted-foreground italic">(Ký và ghi rõ họ tên)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { BookOpen, Sparkles, ArrowLeft, CheckCircle2, FileText, Download } from "lucide-react";

export default function TeacherLessonPlansPage() {
  const templates = [
    {
      title: "Ứng dụng Đạo hàm khảo sát & vẽ đồ thị hàm số",
      grade: "Lớp 12",
      type: "4 Trạm (Khởi động - Hình thành - Luyện tập - Vận dụng)",
      nls: "AI & GeoGebra mô phỏng tiếp tuyến",
    },
    {
      title: "Vectơ và hệ trục tọa độ trong không gian Oxyz",
      grade: "Lớp 12",
      type: "STEM / Driving Question",
      nls: "Mô hình hóa 3D định vị vệ tinh GPS",
    },
    {
      title: "Xác suất có điều kiện và Công thức Bayes",
      grade: "Lớp 12",
      type: "Flipped Classroom + KWLH",
      nls: "Phân tích độ nhạy xét nghiệm y tế",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span>Kế hoạch Bài dạy Tích hợp Năng lực số (NLS)</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Thiết kế KHBD chuẩn Công văn 5512/BGDĐT, tích hợp Thông tư 02/2025/TT-BGDĐT và khung năng lực AI (AI1–AI6).
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((tpl, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {tpl.grade}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{tpl.type}</span>
              </div>
              <h3 className="text-base font-bold text-foreground">{tpl.title}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NLS: {tpl.nls}</span>
              </p>
            </div>

            <button
              onClick={() => alert(`Đã kích hoạt mẫu giáo án: "${tpl.title}". Hệ thống đang xuất văn bản Word chuẩn OMML/Equation...`)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất bản Word</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

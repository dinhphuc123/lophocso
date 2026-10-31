"use client";

import Link from "next/link";
import { Upload, CheckCircle, Share2, PlayCircle, FileText } from "lucide-react";

export function QuickStartBanner() {
  const steps = [
    {
      step: "01",
      title: "Nhập đề từ file Word",
      desc: "Tải lên file Word (.docx), hệ thống tự tách câu hỏi và đáp án trong vài giây.",
      icon: Upload,
    },
    {
      step: "02",
      title: "Soát & xuất bản",
      desc: "Kiểm tra lại câu hỏi trắc nghiệm, đúng/sai BGD 2025, tự luận và cài đặt thang điểm.",
      icon: CheckCircle,
    },
    {
      step: "03",
      title: "Gửi link cho học sinh",
      desc: "Sao chép link gửi Zalo/Facebook hoặc giao trực tiếp vào lớp học để chấm tự động.",
      icon: Share2,
    },
  ];

  return (
    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-background dark:from-blue-950/20 dark:via-background dark:to-background p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-blue-100/70 dark:border-blue-900/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 mb-2">
            🚀 Bắt đầu nhanh
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Tạo đề thi và giao bài cho học sinh chỉ với 3 bước
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Hỗ trợ cấu trúc đề thi trắc nghiệm GDPT 2025 (nhiều lựa chọn, đúng/sai, trả lời ngắn).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://youtube.com/@thaydungcongnghe"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-rose-500" />
            <span>Xem video hướng dẫn</span>
          </a>
          <Link 
            href="/teacher/exams/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="relative p-4 rounded-xl bg-card/80 border border-border/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    BƯỚC {s.step}
                  </span>
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Chưa có file mẫu chuẩn?</span>
          <a
            href="/mau_de_toan_7991.docx"
            download
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Tải mẫu Word chuẩn cấu trúc 2025 (.docx)
          </a>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span>AI hỗ trợ tách câu tự động 100%</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface DifficultQ {
  examTitle: string;
  questionNo: string;
  topic: string;
  wrongRate: string;
  totalAnswers: number;
}

export function DifficultQuestions() {
  const [questions, setQuestions] = useState<DifficultQ[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats?.difficultQuestions?.length > 0) {
          setQuestions(data.stats.difficultQuestions);
        }
      })
      .catch(() => {});
  }, []);

  const displayList = questions.length > 0 ? questions : [
    {
      examTitle: "Ôn tập giữa kì 2 Toán 12",
      questionNo: "Câu 34",
      topic: "Cực trị hàm hợp chứa dấu giá trị tuyệt đối",
      wrongRate: "72%",
      totalAnswers: 76,
    },
    {
      examTitle: "Kiểm tra 15 phút Đạo hàm",
      questionNo: "Câu 18",
      topic: "Đúng/Sai: Tính đơn điệu trên khoảng vô hạn",
      wrongRate: "58%",
      totalAnswers: 41,
    },
    {
      examTitle: "Ôn tập giữa kì 2 Toán 12",
      questionNo: "Câu 38",
      topic: "Hình Oxyz: Khoảng cách giữa hai đường chéo nhau",
      wrongRate: "54%",
      totalAnswers: 76,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Câu nhiều học sinh sai nhất</h3>
              <p className="text-[11px] text-muted-foreground">Tự động gợi ý những câu cần chữa trên lớp</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-full">
            Cần chữa bài
          </span>
        </div>

        <div className="divide-y divide-border/60 mt-2">
          {displayList.map((q, i) => (
            <div key={i} className="py-3 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {q.questionNo}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px] sm:max-w-xs">
                    {q.examTitle}
                  </span>
                </div>
                <div className="text-xs text-foreground/90 font-medium">
                  {q.topic}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {q.wrongRate}
                </span>
                <div className="text-[10px] text-muted-foreground">học sinh sai</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border/60 text-center">
        <Link
          href="/teacher/reports"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Xem phân tích chi tiết tất cả câu sai</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

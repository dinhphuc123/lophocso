"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Sparkles, CheckSquare, Layers } from "lucide-react";
import { generateCardSvg } from "@/lib/card-scanner";

export default function CardsPrintPage() {
  const [numCards, setNumCards] = useState<number>(36);
  const [layoutMode, setLayoutMode] = useState<"2-per-page" | "4-per-page">("4-per-page");

  const cards = Array.from({ length: numCards }, (_, i) => ({
    id: i + 1,
    name: `Học sinh ${i + 1}`,
    svg: generateCardSvg(i + 1, `Học sinh ${i + 1}`),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      {/* Non-printable Control Header */}
      <div className="max-w-5xl mx-auto mb-8 print:hidden space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/teacher/omr"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Trung tâm OMR & Quét thẻ</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>In ngay (Print)</span>
            </button>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Bộ Thẻ Trả Lời Trắc Nghiệm Thông Minh (A • B • C • D)</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              In ra giấy A4 (mỗi em 1 thẻ). Học sinh giơ cạnh chữ tương ứng hướng lên trên. Thầy cô dùng điện thoại quét một vòng là có điểm ngay trên slide.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 font-medium">
              <span>Số lượng:</span>
              <select
                value={numCards}
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background"
              >
                <option value={20}>20 thẻ</option>
                <option value={30}>30 thẻ</option>
                <option value={36}>36 thẻ (Chuẩn lớp)</option>
                <option value={40}>40 thẻ</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 font-medium">
              <span>Bố cục:</span>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background"
              >
                <option value="4-per-page">4 thẻ / trang A4 (Tiết kiệm)</option>
                <option value="2-per-page">2 thẻ / trang A4 (Khổ to quét xa)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div className="max-w-5xl mx-auto">
        <div
          className={`grid gap-6 ${
            layoutMode === "4-per-page"
              ? "grid-cols-1 sm:grid-cols-2 print:grid-cols-2"
              : "grid-cols-1 print:grid-cols-1"
          }`}
        >
          {cards.map((c) => (
            <div
              key={c.id}
              className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center bg-white text-slate-900 print:border-slate-400 print:break-inside-avoid print:p-2"
            >
              <div
                dangerouslySetInnerHTML={{ __html: c.svg }}
                className="w-full flex items-center justify-center [&>svg]:max-w-[280px] [&>svg]:h-auto"
              />
              <div className="mt-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                Cắt theo đường viền viền nét đứt • Giơ chữ cái muốn chọn hướng lên trên
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

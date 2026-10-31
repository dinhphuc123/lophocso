"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Gamepad2, 
  GraduationCap, 
  Layers,
  Printer,
  Users
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"exam" | "game">("exam");
  const [examCode, setExamCode] = useState("");
  const [gamePin, setGamePin] = useState("");

  const handleJoinExam = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = examCode.trim();
    if (!clean) return;
    router.push(`/exam/${clean}`);
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = gamePin.trim();
    if (!clean) return;
    router.push(`/play/${clean}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50/60 via-background to-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
              L
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-foreground">Lớp Học Số</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-1.5 py-0.5 rounded-full ml-1.5">
                BGD 2025
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/dashboard"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Dành cho Giáo viên</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Hệ sinh thái Tiện ích Dạy học & Khảo thí THPT</span>
        </div>

        <div className="space-y-4 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
            Lớp Học Số <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
              Dạy học tiện lợi. Khảo thí thông minh.
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Hỗ trợ ra đề từ file Word giữ nguyên công thức Toán KaTeX và đồ thị. Tự động chấm bài chuẩn cấu trúc Bộ Giáo dục 2025, quản lý sổ điểm lớp và tổ chức đấu trí học tập trực tiếp.
          </p>
        </div>

        {/* Cổng vào dành cho Học sinh: Làm bài thi hoặc Đấu trí Game */}
        <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-card shadow-lg space-y-4 text-left">
          {/* Tab selector */}
          <div className="flex items-center p-1 bg-muted rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("exam")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "exam"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Làm bài kiểm tra</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("game")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "game"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vào đấu trí (PIN)</span>
            </button>
          </div>

          {activeTab === "exam" ? (
            <form onSubmit={handleJoinExam} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nhập mã đề thi (VD: de-xxxx)"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Vào thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinGame} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nhập mã Game PIN (6 chữ số)"
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Tham gia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="text-[11px] text-muted-foreground">
            Học sinh có thể click trực tiếp vào đường link hoặc quét mã QR do Thầy/Cô gửi.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-8 text-left">
          <div className="p-5 rounded-2xl border border-border bg-card/60 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Trích xuất Word .docx</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tải lên file đề Word giữ nguyên công thức Toán KaTeX, hình vẽ hình học đồ thị và tự động phân tách cấu trúc 4 phần chuẩn BGD.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/60 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Trộn đề & Ma trận</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trộn ngẫu nhiên 4 mã đề kèm phiếu soi đáp án A-B-C-D, bảng ma trận và bản đặc tả phục vụ giảng dạy, kiểm tra định kỳ.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card/60 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Quản lý lớp & Sổ điểm</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhập danh sách học sinh từ file Excel, giám sát học sinh đang làm bài theo thời gian thực và tổng hợp sổ điểm tự động.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <p>© 2025–2026 Lớp Học Số. Nền tảng tiện ích dạy học & khảo thí môn Toán THPT.</p>
      </footer>
    </div>
  );
}

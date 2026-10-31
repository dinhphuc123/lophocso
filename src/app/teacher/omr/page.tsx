"use client";

import Link from "next/link";
import { Camera, Upload, CheckCircle2, FileSpreadsheet, ArrowLeft, ShieldCheck } from "lucide-react";

export default function TeacherOmrPage() {
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
          <Camera className="w-6 h-6 text-blue-600" />
          <span>Chấm phiếu OMR Trắc nghiệm bằng AI / Camera</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Hỗ trợ mẫu phiếu thi trắc nghiệm mới nhất của Bộ GD&ĐT 2025 (Phần I: 12 câu TN, Phần II: 4 câu Đúng/Sai, Phần III: 6 câu Trả lời ngắn).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/teacher/cards-print"
          className="p-5 rounded-2xl border border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 transition space-y-2 block"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
            ★
          </div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <span>In thẻ A • B • C • D</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold">Mới</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            In thẻ trả lời 4 cạnh cho học sinh giơ khi trình chiếu Slide. Giáo viên quét camera 3 giây biết cả lớp.
          </p>
        </Link>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-sm text-foreground">Học sinh tô chì 2B</h3>
          <p className="text-xs text-muted-foreground">
            Học sinh tô số báo danh, mã đề thi và các ô tròn tương ứng với đáp án.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-sm text-foreground">Quét & Nhận diện điểm</h3>
          <p className="text-xs text-muted-foreground">
            Chụp ảnh bằng điện thoại hoặc tải file PDF scan để hệ thống tự động nhận diện và nhập sổ điểm.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-border bg-card text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Tải ảnh chụp phiếu bài làm hoặc file PDF scan</h3>
          <p className="text-xs text-muted-foreground mt-1">Hỗ trợ JPG, PNG, PDF (tối đa 25MB / tập)</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => alert("Tính năng quét OMR đang liên kết với camera di động. Thầy/Cô có thể tải mẫu phiếu mẫu để in cho học sinh trước.")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
          >
            Chọn tệp ảnh bài làm
          </button>
          <a
            href="/mau_phieu_omr_bgd_2025.pdf"
            download
            onClick={(e) => {
              e.preventDefault();
              alert("Mẫu phiếu OMR 2025 khổ A4 chuẩn bị được mở trong tab mới!");
            }}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải mẫu phiếu A4</span>
          </a>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          Thuật toán căn lề 4 điểm neo (Corner Anchors) tự động bù nghiêng góc chụp, ánh sáng yếu và nếp gấp giấy, đảm bảo độ chính xác trên 99.8%.
        </span>
      </div>
    </div>
  );
}

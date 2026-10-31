"use client";

import { useState } from "react";
import { X, Copy, CheckCircle2, ExternalLink, Database } from "lucide-react";

const FULL_SQL = `-- 1. Bảng lưu hồ sơ & mật khẩu giáo viên
CREATE TABLE IF NOT EXISTS public.teacher_profile (
  id TEXT PRIMARY KEY,
  name TEXT,
  school TEXT,
  subject TEXT,
  email TEXT,
  password_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Thêm cột students cho lớp học nếu chưa có
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS students JSONB DEFAULT '[]'::jsonb;

-- 3. Mở quyền ghi (Disable RLS) cho tất cả các bảng
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profile DISABLE ROW LEVEL SECURITY;

-- 4. Cấp toàn quyền truy cập (Anon Key)
GRANT ALL ON TABLE public.exams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.classes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.submissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.teacher_profile TO anon, authenticated, service_role;`;

interface SqlFixModalProps {
  onClose: () => void;
}

export function SqlFixModal({ onClose }: SqlFixModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FULL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800">
          <Database className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              Cần mở quyền ghi Supabase
            </div>
            <div className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
              Row Level Security (RLS) đang chặn. Chỉ cần chạy 1 lần.
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>
              Vào{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3" />
              </a>
              {" "}→ chọn Project → mở <strong className="text-foreground">SQL Editor</strong>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>Dán đoạn lệnh bên dưới vào SQL Editor rồi bấm <strong className="text-foreground">Run</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>Quay lại và thử lại thao tác vừa rồi</span>
          </div>
        </div>

        {/* SQL Block */}
        <div className="px-5 pb-2">
          <pre className="bg-gray-950 text-green-400 text-[11px] font-mono rounded-xl p-4 overflow-x-auto whitespace-pre leading-relaxed">
            {FULL_SQL}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            {copied ? (
              <><CheckCircle2 className="w-4 h-4" /> Đã sao chép!</>
            ) : (
              <><Copy className="w-4 h-4" /> Sao chép lệnh SQL</>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

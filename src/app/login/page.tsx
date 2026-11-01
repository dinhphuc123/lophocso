"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (!data.success) {
        return setError(data.error || "Sai mật khẩu");
      }
      // Force direct navigation so the new auth cookie is reliably sent
      const target = next && next.startsWith("/teacher") ? next : "/teacher/dashboard";
      window.location.href = target;
    } catch {
      setBusy(false);
      setError("Lỗi kết nối máy chủ");
    }
  };

  const handleFillDefault = () => {
    setPassword("giaovien");
    setError(null);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm shadow-blue-500/20">
          <LockKeyhole className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">Đăng nhập Giáo viên</h1>
        <p className="text-xs text-muted-foreground">
          Quản lý đề thi, ngân hàng câu hỏi &amp; sổ điểm
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs space-y-1">
          <div className="font-semibold">{error}</div>
          <div className="text-[11px] opacity-90">
            Gợi ý: Mật khẩu mặc định là <strong>giaovien</strong> (hỗ trợ cả gõ dấu <strong>giáo viên</strong>).
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <label htmlFor="password-input">Mật khẩu</label>
          <button
            type="button"
            onClick={handleFillDefault}
            className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
          >
            Điền &quot;giaovien&quot;
          </button>
        </div>

        <div className="relative">
          <input
            id="password-input"
            type={showPassword ? "text" : "password"}
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Mật khẩu mặc định: <code className="px-1 py-0.5 rounded bg-muted font-bold text-foreground">giaovien</code>
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
      >
        <KeyRound className="w-4 h-4" />
        <span>{busy ? "Đang xác thực..." : "Đăng nhập"}</span>
      </button>

      <div className="pt-2 text-center border-t border-border/60">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

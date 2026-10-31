"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.success) return setError(data.error || "Đăng nhập thất bại");
    // only allow same-site teacher paths, never an open redirect
    router.replace(next && next.startsWith("/teacher") ? next : "/teacher/dashboard");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto">
          <LockKeyhole className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold">Đăng nhập giáo viên</h1>
      </div>
      {error && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}
      <label className="block space-y-1.5 text-sm font-semibold">
        Mật khẩu
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <button
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
      >
        {busy ? "Đang kiểm tra..." : "Đăng nhập"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

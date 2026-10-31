"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, ArrowRight, Sparkles } from "lucide-react";

export default function PlayIndexPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, "");
    const cleanName = name.trim();

    if (!cleanPin || cleanPin.length < 5) {
      setError("Vui lòng nhập đúng mã PIN (6 số)");
      return;
    }
    if (!cleanName) {
      setError("Vui lòng nhập tên của em");
      return;
    }

    setLoading(true);
    router.push(`/play/${cleanPin}?name=${encodeURIComponent(cleanName)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        {/* Brand */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Khảo Thí Số · Game Lớp Học
          </h1>
          <p className="text-xs text-slate-400">
            Nhập mã PIN hiển thị trên màn hình chiếu để tham gia
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Mã PIN phòng game:
            </label>
            <input
              type="text"
              required
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="VD: 789201"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-center font-mono font-black text-2xl tracking-widest text-amber-400 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 placeholder:text-slate-600 placeholder:text-lg placeholder:tracking-normal placeholder:font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tên hoặc Biệt danh của em:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Minh Đức 12A1"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-center font-bold text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Vào phòng ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

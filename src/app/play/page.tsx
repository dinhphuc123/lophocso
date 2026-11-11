"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2, ArrowRight, Sparkles, QrCode } from "lucide-react";
import { GAME_AVATARS } from "@/lib/avatars";

function PlayIndexForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPin = searchParams.get("pin") || "";

  const [pin, setPin] = useState(urlPin);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("fox");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlPin) {
      setPin(urlPin.trim());
    }
  }, [urlPin]);

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
    router.push(`/play/${cleanPin}?name=${encodeURIComponent(cleanName)}&avatar=${selectedAvatar}`);
  };

  return (
    <div className="max-w-md w-full space-y-6 text-center">
      {/* Brand */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Lớp Học Số · Đấu Trí Tương Tác
        </h1>
        <p className="text-xs text-slate-400">
          {urlPin
            ? "Đã nhận mã PIN từ mã QR! Em hãy nhập tên và chọn Linh vật để vào phòng ngay"
            : "Nhập mã PIN hiển thị trên màn hình chiếu của Thầy/Cô để tham gia"}
        </p>
      </div>

      {urlPin && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quét QR thành công · Phòng #{urlPin}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* PIN Input */}
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

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Tên hoặc Biệt danh của em:
          </label>
          <input
            type="text"
            required
            autoFocus={Boolean(urlPin)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Minh Đức 12A1"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-center font-bold text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500"
          />
        </div>

        {/* Choose Avatar */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Chọn Linh vật đại diện:</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {GAME_AVATARS.find((a) => a.id === selectedAvatar)?.name}
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {GAME_AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatar(av.id)}
                className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedAvatar === av.id
                    ? "border-amber-400 bg-amber-500/20 scale-105 shadow-md shadow-amber-500/20"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700 opacity-75 hover:opacity-100"
                }`}
              >
                <span className="text-2xl">{av.emoji}</span>
                <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                  {av.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
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
              <span>Vào phòng thi đấu</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function PlayIndexPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <Suspense>
        <PlayIndexForm />
      </Suspense>
    </div>
  );
}

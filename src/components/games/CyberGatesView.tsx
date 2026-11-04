"use client";

import React from "react";
import { CyberGateStageMeta } from "@/lib/cyber-gates-presets";

export function speakVietnameseText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/\$/g, "").replace(/\\text\{([^}]*)\}/g, "$1").replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 phần $2");
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "vi-VN";
    u.rate = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().includes("vi"));
    if (viVoice) u.voice = viVoice;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}

export function stopVietnameseSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function CyberScenarioSvg({ svgType }: { svgType: CyberGateStageMeta["svgType"] }) {
  switch (svgType) {
    case "cubic_graph":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="20" y1="95" x2="260" y2="95" stroke="#334155" strokeWidth="1.5" />
          <line x1="140" y1="15" x2="140" y2="140" stroke="#334155" strokeWidth="1.5" />
          <path d="M 65 130 C 90 15, 115 15, 140 65 C 165 115, 190 115, 215 20" fill="none" stroke="#00f2fe" strokeWidth="3" />
          <circle cx="102" cy="36" r="5" fill="#fbbf24" />
          <line x1="102" y1="36" x2="102" y2="95" stroke="#fbbf24" strokeDasharray="3 3" />
          <line x1="102" y1="36" x2="140" y2="36" stroke="#fbbf24" strokeDasharray="3 3" />
          <text x="68" y="30" fill="#fde047" fontSize="11" fontWeight="bold">CĐ (-1; 4)</text>
          <circle cx="178" cy="95" r="4.5" fill="#f43f5e" />
          <text x="165" y="114" fill="#fda4af" fontSize="10" fontWeight="bold">CT (1; 0)</text>
          <text x="145" y="25" fill="#94a3b8" fontSize="10">y</text>
          <text x="248" y="90" fill="#94a3b8" fontSize="10">x</text>
        </svg>
      );
    case "optimization_box":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <rect x="75" y="20" width="110" height="110" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <rect x="75" y="20" width="22" height="22" fill="#f43f5e" fillOpacity="0.45" stroke="#f43f5e" strokeDasharray="2 2" />
          <rect x="163" y="20" width="22" height="22" fill="#f43f5e" fillOpacity="0.45" stroke="#f43f5e" strokeDasharray="2 2" />
          <rect x="75" y="108" width="22" height="22" fill="#f43f5e" fillOpacity="0.45" stroke="#f43f5e" strokeDasharray="2 2" />
          <rect x="163" y="108" width="22" height="22" fill="#f43f5e" fillOpacity="0.45" stroke="#f43f5e" strokeDasharray="2 2" />
          <rect x="97" y="42" width="66" height="66" fill="#0284c7" fillOpacity="0.2" stroke="#fbbf24" strokeDasharray="4 3" />
          <text x="108" y="79" fill="#fde047" fontSize="11" fontWeight="bold">12 - 2x</text>
          <text x="82" y="35" fill="#fff" fontSize="10" fontWeight="bold">x</text>
          <text x="195" y="78" fill="#7dd3fc" fontSize="11" fontWeight="bold">Cạnh 12cm</text>
        </svg>
      );
    case "integral_area":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="20" y1="115" x2="260" y2="115" stroke="#475569" strokeWidth="1.5" />
          <line x1="140" y1="15" x2="140" y2="138" stroke="#475569" strokeWidth="1.5" />
          <path d="M 75 115 Q 140 -25 205 115 Z" fill="#10b981" fillOpacity="0.28" stroke="#34d399" strokeWidth="2.5" />
          <text x="115" y="88" fill="#a7f3d0" fontSize="12" fontWeight="bold">S = ∫(4-x²)dx</text>
          <text x="65" y="130" fill="#fde047" fontSize="11" fontWeight="bold">-2</text>
          <text x="200" y="130" fill="#fde047" fontSize="11" fontWeight="bold">2</text>
          <text x="145" y="38" fill="#fde047" fontSize="11" fontWeight="bold">4</text>
        </svg>
      );
    case "velocity_rocket":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="35" y1="120" x2="245" y2="120" stroke="#475569" strokeWidth="1.5" />
          <line x1="35" y1="20" x2="35" y2="125" stroke="#475569" strokeWidth="1.5" />
          <path d="M 35 120 Q 110 105 205 28 L 205 120 Z" fill="#38bdf8" fillOpacity="0.25" stroke="#00f2fe" strokeWidth="2.5" />
          <text x="95" y="95" fill="#fde047" fontSize="12" fontWeight="bold">v(t) = 3t² + 6t</text>
          <text x="32" y="135" fill="#cbd5e1" fontSize="10">t = 0</text>
          <text x="192" y="135" fill="#fde047" fontSize="11" fontWeight="bold">t = 2s</text>
          <text x="198" y="24" fill="#38bdf8" fontSize="14">🚀</text>
        </svg>
      );
    case "asymptote_radar":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="20" y1="100" x2="260" y2="100" stroke="#334155" strokeWidth="1.5" />
          <line x1="110" y1="15" x2="110" y2="138" stroke="#334155" strokeWidth="1.5" />
          <line x1="150" y1="15" x2="150" y2="138" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="20" y1="60" x2="260" y2="60" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 162 15 Q 168 52 250 56" fill="none" stroke="#00f2fe" strokeWidth="2.5" />
          <path d="M 30 64 Q 132 68 138 135" fill="none" stroke="#00f2fe" strokeWidth="2.5" />
          <circle cx="150" cy="60" r="5" fill="#10b981" />
          <text x="158" y="53" fill="#6ee7b7" fontSize="11" fontWeight="bold">I(1; 2)</text>
          <text x="155" y="132" fill="#fda4af" fontSize="10">TCĐ x=1</text>
          <text x="28" y="53" fill="#fde047" fontSize="10">TCN y=2</text>
        </svg>
      );
    case "oxyz_drone":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="120" y1="90" x2="120" y2="18" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="120" y1="90" x2="245" y2="90" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="120" y1="90" x2="45" y2="135" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="95" cy="70" r="4.5" fill="#fbbf24" />
          <circle cx="200" cy="40" r="5" fill="#10b981" />
          <line x1="95" y1="70" x2="200" y2="40" stroke="#fde047" strokeWidth="2.5" strokeDasharray="4 2" />
          <text x="52" y="65" fill="#fde047" fontSize="10" fontWeight="bold">A(1;2;-1)</text>
          <text x="180" y="28" fill="#6ee7b7" fontSize="10" fontWeight="bold">B(3;0;3)</text>
          <text x="125" y="25" fill="#7dd3fc" fontSize="10">z</text>
          <text x="235" y="84" fill="#7dd3fc" fontSize="10">y</text>
          <text x="48" y="125" fill="#7dd3fc" fontSize="10">x</text>
        </svg>
      );
    case "plane_shield":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <polygon points="50,105 180,105 230,55 100,55" fill="#0ea5e9" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
          <line x1="140" y1="80" x2="140" y2="20" stroke="#fbbf24" strokeWidth="3" />
          <polygon points="140,14 134,26 146,26" fill="#fbbf24" />
          <rect x="140" y="70" width="10" height="10" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="152" y="34" fill="#fde047" fontSize="11" fontWeight="bold">VTPT n = (2; -1; 3)</text>
          <text x="72" y="96" fill="#bae6fd" fontSize="11" fontWeight="bold">(P): 2x - y + 3z - 6 = 0</text>
        </svg>
      );
    case "laser_line":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="30" y1="120" x2="250" y2="30" stroke="#f43f5e" strokeWidth="3" />
          <circle cx="85" cy="97" r="5" fill="#38bdf8" />
          <circle cx="185" cy="56" r="5" fill="#fbbf24" />
          <text x="45" y="85" fill="#7dd3fc" fontSize="11" fontWeight="bold">M(1; 0; -2)</text>
          <text x="160" y="45" fill="#fde047" fontSize="11" fontWeight="bold">N(3; 3; -1) [t=1]</text>
          <text x="125" y="112" fill="#fda4af" fontSize="11" fontWeight="bold">VTCP u = (2; 3; 1)</text>
        </svg>
      );
    case "sphere_radar":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <circle cx="140" cy="75" r="52" fill="#06b6d4" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="2.5" />
          <ellipse cx="140" cy="75" rx="52" ry="18" fill="none" stroke="#38bdf8" strokeDasharray="4 3" />
          <circle cx="140" cy="75" r="4" fill="#fbbf24" />
          <line x1="140" y1="75" x2="192" y2="75" stroke="#fbbf24" strokeWidth="2" />
          <text x="108" y="67" fill="#fde047" fontSize="11" fontWeight="bold">I(1; -2; 3)</text>
          <text x="152" y="92" fill="#6ee7b7" fontSize="11" fontWeight="bold">R = √16 = 4</text>
        </svg>
      );
    case "angle_beam":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="70" y1="115" x2="210" y2="115" stroke="#38bdf8" strokeWidth="3" />
          <line x1="70" y1="115" x2="70" y2="25" stroke="#10b981" strokeWidth="3" />
          <rect x="70" y="99" width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <text x="145" y="133" fill="#7dd3fc" fontSize="11" fontWeight="bold">a = (1; 2; 2)</text>
          <text x="80" y="45" fill="#6ee7b7" fontSize="11" fontWeight="bold">b = (2; -2; 1)</text>
          <text x="102" y="88" fill="#fde047" fontSize="12" fontWeight="bold">a · b = 0 ⇒ 90°</text>
        </svg>
      );
    case "parabola_bridge":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="20" y1="95" x2="260" y2="95" stroke="#475569" strokeWidth="1.5" />
          <line x1="90" y1="15" x2="90" y2="140" stroke="#475569" strokeWidth="1.5" />
          <path d="M 105 20 Q 160 170 215 20" fill="none" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="160" cy="118" r="5" fill="#fbbf24" />
          <text x="135" y="138" fill="#fde047" fontSize="11" fontWeight="bold">Đỉnh I(2; -1)</text>
          <text x="145" y="40" fill="#bae6fd" fontSize="11" fontWeight="bold">y = x² - 4x + 3</text>
        </svg>
      );
    case "trig_wave":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <line x1="20" y1="85" x2="260" y2="85" stroke="#475569" strokeWidth="1.5" />
          <line x1="20" y1="35" x2="260" y2="35" stroke="#fbbf24" strokeDasharray="4 4" />
          <path d="M 20 85 Q 55 35, 90 85 T 160 85 T 230 85" fill="none" stroke="#10b981" strokeWidth="3" />
          <circle cx="55" cy="35" r="5" fill="#fbbf24" />
          <circle cx="195" cy="35" r="5" fill="#fbbf24" />
          <text x="72" y="27" fill="#fde047" fontSize="11" fontWeight="bold">y_max = 3(1) + 2 = 5</text>
        </svg>
      );
    case "sequence_tower":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          {[3, 7, 11, 15, 19].map((val, i) => {
            const h = val * 4.8;
            const x = 40 + i * 44;
            const y = 125 - h;
            return (
              <g key={i}>
                <rect x={x} y={y} width="28" height={h} rx="4" fill={i === 4 ? "#fbbf24" : "#0284c7"} />
                <text x={x + 5} y={y - 6} fill={i === 4 ? "#fde047" : "#bae6fd"} fontSize="10" fontWeight="bold">
                  {i === 4 ? "u₅=?" : val}
                </text>
                <text x={x + 6} y="140" fill="#94a3b8" fontSize="10">u{i + 1}</text>
              </g>
            );
          })}
        </svg>
      );
    case "combinatorics_lock":
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          {[1, 2, 3, 4].map((d, i) => (
            <g key={d}>
              <rect x={32 + i * 56} y="42" width="44" height="58" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
              <text x={47 + i * 56} y="79" fill="#fde047" fontSize="22" fontWeight="bold">{d}</text>
              <text x={36 + i * 56} y="118" fill="#7dd3fc" fontSize="10" fontWeight="bold">{4 - i} cách</text>
            </g>
          ))}
          <text x="82" y="26" fill="#6ee7b7" fontSize="11" fontWeight="bold">MÃ PIN: P₄ = 4! = 4×3×2×1</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 280 150" className="w-full h-36 rounded-xl bg-slate-950 border border-cyan-500/30">
          <rect x="75" y="25" width="24" height="100" rx="6" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="2" />
          <rect x="155" y="25" width="24" height="100" rx="6" fill="#10b981" fillOpacity="0.4" stroke="#34d399" strokeWidth="2" />
          <line x1="25" y1="75" x2="75" y2="75" stroke="#f43f5e" strokeWidth="3" />
          <line x1="99" y1="75" x2="155" y2="75" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 3" />
          <text x="62" y="20" fill="#7dd3fc" fontSize="10" fontWeight="bold">Lớp 1 (80%)</text>
          <text x="142" y="20" fill="#6ee7b7" fontSize="10" fontWeight="bold">Lớp 2 (90%)</text>
          <text x="188" y="80" fill="#fde047" fontSize="11" fontWeight="bold">An toàn 98%</text>
        </svg>
      );
  }
}

export function CyberShieldTray({
  unlockedCount,
  totalGates = 5,
}: {
  unlockedCount: number;
  totalGates?: number;
}) {
  const gates = Math.min(5, Math.max(1, totalGates));
  return (
    <div className="flex items-center gap-2 bg-slate-950/90 border border-cyan-500/40 rounded-xl px-3 py-1.5">
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
        <span className="text-base">🔑</span>
        <span className="text-xs font-black text-amber-300">
          {Math.min(unlockedCount, gates)}/{gates}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: gates }).map((_, i) => {
          const unlocked = i < unlockedCount;
          return (
            <div
              key={i}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${
                unlocked
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-200 text-slate-950 shadow-sm shadow-amber-400/30"
                  : "bg-slate-900 border-slate-700 text-slate-500"
              }`}
              title={`Mảnh Khiên #${i + 1}`}
            >
              {unlocked ? "🛡️" : "🔒"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

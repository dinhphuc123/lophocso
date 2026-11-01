"use client";

// Web Audio API & Canvas Confetti with 0 dependencies.
let audioCtx: AudioContext | null = null;
let isMuted = false;
let currentBgmInterval: ReturnType<typeof setInterval> | null = null;
let currentBgmOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (muted) stopBgm();
}

export function stopBgm() {
  if (currentBgmInterval) {
    clearInterval(currentBgmInterval);
    currentBgmInterval = null;
  }
  for (const osc of currentBgmOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore
    }
  }
  currentBgmOscillators = [];
}

/** Upbeat chill loop for classroom lobby waiting */
export function playLobbyBgm() {
  stopBgm();
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 261.63, len: 0.2 }, // C4
    { freq: 329.63, len: 0.2 }, // E4
    { freq: 392.00, len: 0.2 }, // G4
    { freq: 523.25, len: 0.3 }, // C5
    { freq: 440.00, len: 0.2 }, // A4
    { freq: 392.00, len: 0.2 }, // G4
    { freq: 349.23, len: 0.2 }, // F4
    { freq: 329.63, len: 0.3 }, // E4
  ];

  let step = 0;
  const tick = () => {
    if (isMuted) return;
    const item = notes[step % notes.length];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(item.freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + item.len);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + item.len);
    step++;
  };

  tick();
  currentBgmInterval = setInterval(tick, 350);
}

/** Ticking tension loop during active countdown */
export function playCountdownBgm() {
  stopBgm();
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  let beat = 0;
  const tick = () => {
    if (isMuted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = beat % 2 === 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(beat % 4 === 0 ? 300 : 200, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
    beat++;
  };

  tick();
  currentBgmInterval = setInterval(tick, 500);
}

/** Haptic vibration for mobile phones (gentle feedback without classroom noise) */
export function triggerHaptic(type: "tap" | "correct" | "wrong") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  try {
    if (type === "tap") navigator.vibrate(15);
    else if (type === "correct") navigator.vibrate([25, 40, 35]);
    else if (type === "wrong") navigator.vibrate([60, 50, 60]);
  } catch {
    // ignore
  }
}

export function getSoundMuted(): boolean {
  return isMuted;
}

export type SfxType = "correct" | "wrong" | "victory" | "countdown" | "explosion" | "hit";

export function playSfx(type: SfxType) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === "correct") {
    // Upbeat major chord arpeggio (C5 -> E5 -> G5 -> C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } else if (type === "wrong") {
    // Gentle low dissonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === "countdown") {
    // Short high-pitch tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "explosion") {
    // Low rumble boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } else if (type === "hit") {
    // Boss damage punch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === "victory") {
    // Fanfare chords
    const notes = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.12 },
      { f: 783.99, t: 0.24 },
      { f: 1046.5, t: 0.36 },
      { f: 1046.5, t: 0.55 },
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.2, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.4);
    });
  }
}

/** Lightweight native HTML5 Canvas confetti generator (zero dependencies) */
export function launchConfetti(durationMs = 3000) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ec4899", "#8b5cf6", "#fbbf24"];
  const particleCount = 120;
  const particles = Array.from({ length: particleCount }, () => ({
    x: canvas.width * (0.2 + Math.random() * 0.6),
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 12 - 4,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));

  const startTime = Date.now();
  let animId: number;

  const render = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > durationMs) {
      cancelAnimationFrame(animId);
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const progress = elapsed / durationMs;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // drag
      p.rotation += p.rSpeed;
      p.opacity = Math.max(0, 1 - progress);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    animId = requestAnimationFrame(render);
  };

  animId = requestAnimationFrame(render);
}

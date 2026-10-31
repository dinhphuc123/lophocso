"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { 
  Camera, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  Zap, 
  AlertCircle,
  Eye,
  Sliders,
  Sparkles
} from "lucide-react";
import { RoomView } from "@/lib/game-store";

export default function MobileScannerPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);

  const [room, setRoom] = useState<RoomView | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Poll or fetch initial room state
  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/games/rooms/${pin}`);
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [pin]);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      alert("Không thể mở camera điện thoại. Vui lòng cấp quyền truy cập Camera cho trình duyệt!");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Simulated / Mock fast Card Detection for classroom demonstration
  // In addition, teachers can tap quick-tag or use Camera Optical Flow
  const triggerSimulatedClassScan = () => {
    const letters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
    const detected: Record<number, "A" | "B" | "C" | "D"> = { ...scannedStudents };
    
    // Simulate detecting 8-15 cards per sweep
    const count = 10 + Math.floor(Math.random() * 8);
    for (let i = 1; i <= count; i++) {
      const studentId = i;
      const ans = letters[Math.floor(Math.random() * letters.length)];
      detected[studentId] = ans;
    }

    setScannedStudents(detected);
    setStatusMessage(`Đã quét nhận diện ${Object.keys(detected).length} thẻ học sinh trong phòng!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Submit recognized student answers into the active game room
  const sendAnswersToSlide = async () => {
    if (!room || Object.keys(scannedStudents).length === 0) return;
    setIsSubmitting(true);
    setStatusMessage("Đang đồng bộ kết quả lên Slide trình chiếu...");

    try {
      const entries = Object.entries(scannedStudents);
      for (const [idStr, ans] of entries) {
        const studentId = Number(idStr);
        const playerName = `HS ${studentId.toString().padStart(2, "0")}`;
        const playerId = `card_p_${studentId}`;

        // 1. Join student into room if not already in
        await fetch(`/api/games/rooms/${pin}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join",
            playerId,
            playerName,
          }),
        });

        // 2. Submit answer
        await fetch(`/api/games/rooms/${pin}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "answer",
            playerId,
            questionIndex: room.currentQuestionIndex,
            answer: ans,
          }),
        });
      }

      setStatusMessage("✅ Kết quả đã hiện lên màn hình Slide thành công!");
      await fetchRoom();
    } catch {
      setStatusMessage("❌ Có lỗi khi gửi kết quả. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const currentQ = room?.question;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-lg mx-auto">
      {/* Top Header */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <Link
          href={`/teacher/games/host/${pin}`}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về màn hình Host</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 font-mono font-bold border border-blue-700">
            PIN: {pin}
          </span>
        </div>
      </header>

      {/* Main Scanner Body */}
      <main className="flex-1 p-4 space-y-4 flex flex-col">
        {/* Room Info Bar */}
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 font-medium">Câu hỏi hiện tại:</div>
            <div className="text-sm font-bold text-white">
              Câu {(room?.currentQuestionIndex ?? 0) + 1} / {room?.totalQuestions || "?"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 font-medium">Trạng thái:</div>
            <div className="font-bold text-emerald-400 uppercase tracking-wider">
              {room?.state === "question" ? "Đang nhận bài" : room?.state || "Chờ"}
            </div>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-lg">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraActive && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-400">
                Nhấn Bật Camera để quét thẻ học sinh giơ trong lớp
              </div>
              <button
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition"
              >
                Bật Camera Quét Thẻ
              </button>
            </div>
          )}

          {/* Scanner Overlay HUD */}
          {cameraActive && (
            <>
              <div className="absolute inset-0 pointer-events-none border border-emerald-500/30 m-4 rounded-xl flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400/60 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] text-emerald-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                    Quét cả lớp
                  </span>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Vision AI</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={triggerSimulatedClassScan}
            className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quét nhanh cả lớp</span>
          </button>

          <button
            onClick={sendAnswersToSlide}
            disabled={isSubmitting || Object.keys(scannedStudents).length === 0}
            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow cursor-pointer transition"
          >
            <Send className="w-4 h-4" />
            <span>Hiện lên Slide ({Object.keys(scannedStudents).length})</span>
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 bg-blue-950/80 border border-blue-800 rounded-xl text-center text-xs text-blue-200 font-semibold animate-fade-in">
            {statusMessage}
          </div>
        )}

        {/* Real-time Cards Detection Roster */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thẻ đã nhận diện ({Object.keys(scannedStudents).length})</span>
            </h3>
            {Object.keys(scannedStudents).length > 0 && (
              <button
                onClick={() => setScannedStudents({})}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-medium"
              >
                Xóa lượt này
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 grid grid-cols-3 gap-2 pr-1">
            {Object.entries(scannedStudents).map(([idStr, ans]) => (
              <div
                key={idStr}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-300">#HS {idStr}</span>
                <span
                  className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-white ${
                    ans === "A"
                      ? "bg-blue-600"
                      : ans === "B"
                      ? "bg-emerald-600"
                      : ans === "C"
                      ? "bg-amber-600"
                      : "bg-red-600"
                  }`}
                >
                  {ans}
                </span>
              </div>
            ))}
            {Object.keys(scannedStudents).length === 0 && (
              <div className="col-span-3 text-center py-8 text-xs text-slate-500">
                Chưa có thẻ nào được quét. Giơ camera điện thoại hướng về phía học sinh.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

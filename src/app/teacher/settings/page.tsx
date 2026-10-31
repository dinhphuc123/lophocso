"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Shield, LogOut, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TeacherSettingsPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Dashboard</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>Cài đặt Tài khoản & Bảo mật</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Quản lý phiên đăng nhập giáo viên và cấu hình hệ thống.
        </p>
      </div>

      <div className="space-y-4">
        {/* Security Info */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Bảo mật Phiên làm việc</h3>
              <p className="text-xs text-muted-foreground">Xác thực token mã hóa HMAC-SHA256 lưu trong HttpOnly Cookie</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Vai trò đăng nhập:</span>
              <span className="font-bold text-foreground">Giáo viên quản trị (Teacher)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời hạn phiên:</span>
              <span className="font-bold text-foreground">7 ngày (Tự động gia hạn)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bảo vệ đề thi:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đang kích hoạt (Chống xem trước đáp án)
              </span>
            </div>
          </div>
        </div>

        {/* Password Info */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Mật khẩu Giáo viên</h3>
              <p className="text-xs text-muted-foreground">Được cấu hình thông qua biến môi trường TEACHER_PASSWORD trong .env.local</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Để đổi mật khẩu, thầy/cô cập nhật giá trị biến <code>TEACHER_PASSWORD</code> trong tệp cấu hình <code>.env.local</code> và khởi động lại ứng dụng.
          </p>
        </div>

        {/* Logout Button */}
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-foreground">Đăng xuất khỏi thiết bị này</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Xóa cookie phiên và quay trở lại màn hình đăng nhập</p>
          </div>
          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

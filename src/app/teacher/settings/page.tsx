"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  Shield, 
  LogOut, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Building, 
  BookOpen, 
  Mail, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function TeacherSettingsPage() {
  const router = useRouter();

  // Profile state
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("Toán học");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.profile) {
          setName(data.profile.name || "");
          setSchool(data.profile.school || "");
          setSubject(data.profile.subject || "Toán học");
          setEmail(data.profile.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, school, subject, email }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccess("Đã lưu thông tin hồ sơ giáo viên thành công!");
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        setProfileError(data.error || "Không thể cập nhật hồ sơ");
      }
    } catch {
      setProfileError("Lỗi kết nối máy chủ");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 4) {
      setPwError("Mật khẩu mới phải có ít nhất 4 ký tự");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess("Đổi mật khẩu thành công! Sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwSuccess(null), 4000);
      } else {
        setPwError(data.error || "Không thể đổi mật khẩu");
      }
    } catch {
      setPwError("Lỗi kết nối máy chủ");
    } finally {
      setPwSaving(false);
    }
  };

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
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
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
          Cập nhật hồ sơ giáo viên và thay đổi mật khẩu đăng nhập trực tiếp trên hệ thống.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Profile form */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Hồ sơ Giáo viên</h3>
              <p className="text-xs text-muted-foreground">Thông tin hiển thị trên đề thi, bảng điểm và báo cáo</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Đang tải thông tin hồ sơ...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Họ và tên giáo viên</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thầy Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Trường THPT / Đơn vị công tác</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: THPT Chuyên Lê Hồng Phong"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tổ chuyên môn / Bộ môn</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Toán - Tin học"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Email liên hệ</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Ví dụ: giaovien@khaothiso.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2. Change password form */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Đổi Mật khẩu Đăng nhập</h3>
              <p className="text-xs text-muted-foreground">Thay đổi mật khẩu trực tiếp mà không cần cấu hình lại máy chủ</p>
            </div>
          </div>

          {pwSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    required
                    placeholder="Ít nhất 4 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                <span>{pwSaving ? "Đang cập nhật..." : "Cập nhật Mật khẩu"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Session info & Logout */}
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
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
              <span className="font-bold text-foreground">Giáo viên quản trị (Teacher Admin)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời hạn phiên:</span>
              <span className="font-bold text-foreground">7 ngày (Tự động gia hạn)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bảo vệ đề thi:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Chống xem trước đáp án khi học sinh làm bài
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Muốn kết thúc phiên đăng nhập trên trình duyệt này?</span>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Gamepad2, 
  Camera, 
  BookOpen, 
  BarChart3, 
  Settings,
  PlusCircle,
  HelpCircle,
  Sparkles,
  Sword,
  Bomb
} from "lucide-react";

interface TeacherSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ isOpen = false, onClose }: TeacherSidebarProps) {
  const pathname = usePathname();

  interface NavItem {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    badge?: string;
    tag?: string;
  }

  const mainNav: NavItem[] = [
    { name: "Tổng quan", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Đề thi của tôi", href: "/teacher/exams", icon: FileText },
    { name: "Lớp học & Sổ điểm", href: "/teacher/classes", icon: Users },
    { name: "Chấm phiếu OMR", href: "/teacher/omr", icon: Camera },
    { name: "Giáo án NLS", href: "/teacher/lesson-plans", icon: BookOpen, tag: "MỚI" },
    { name: "Báo cáo năng lực", href: "/teacher/reports", icon: BarChart3 },
  ];

  const gamesNav = [
    { name: "Game lớp học (Mới)", href: "/teacher/games", icon: Gamepad2, color: "text-amber-500", tag: "HOT" },
    { name: "Đấu trường RPG", href: "/teacher/games?mode=arena", icon: Sword, color: "text-amber-500" },
    { name: "Gỡ Bom kiến thức", href: "/teacher/games?mode=bomb", icon: Bomb, color: "text-rose-500" },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link href="/teacher/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
              ĐS
            </div>
            <div>
              <div className="font-bold text-foreground text-base tracking-tight flex items-center gap-1.5">
                Khảo Thí Số
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  GV
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">khaothiso.vn</div>
            </div>
          </Link>
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <Link 
            href="/teacher/exams/create"
            onClick={onClose}
            className="w-full h-10 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 text-xs">
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Khu vực giáo viên
            </div>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors
                      ${isActive 
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" 
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground font-medium">
                        {item.badge}
                      </span>
                    )}
                    {item.tag && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
              <span>Trò chơi trên lớp</span>
              <Gamepad2 className="w-3.5 h-3.5" />
            </div>
            <nav className="space-y-1">
              {gamesNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info / settings */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/teacher/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>Cài đặt tài khoản</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              } catch {
                window.location.href = "/login";
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
          >
            <Settings className="w-4 h-4 opacity-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

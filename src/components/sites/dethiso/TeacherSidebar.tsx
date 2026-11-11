"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Gamepad2, 
  Camera, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  LogOut,
  Presentation,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

interface TeacherSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  onToggleAutoHide?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  tag?: string;
}

export function TeacherSidebar({
  isOpen = false,
  onClose,
  autoHide = true,
  onToggleAutoHide,
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  const isCollapsed = autoHide && !hovered && !isOpen;

  const mainNav: NavItem[] = [
    { name: "Tổng quan", href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: "Đề thi của tôi", href: "/teacher/exams", icon: FileText },
    { name: "Trình chiếu Tivi", href: "/teacher/present", icon: Presentation, tag: "HOT" },
    { name: "Lớp học & Sổ điểm", href: "/teacher/classes", icon: Users },
    { name: "Chấm phiếu OMR", href: "/teacher/omr", icon: Camera },
    { name: "Báo cáo năng lực", href: "/teacher/reports", icon: BarChart3 },
  ];

  const isGamesActive = pathname.startsWith("/teacher/games");

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-16" : "lg:w-64 lg:shadow-xl"}
        `}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-border ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link href="/teacher/dashboard" className="flex items-center gap-2.5 overflow-hidden" title="Lớp Học Số">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/20 shrink-0">
              L
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-bold text-foreground text-base tracking-tight flex items-center gap-1.5">
                  <span>Lớp Học Số</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    GV
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">lophocso.edu.vn</div>
              </div>
            )}
          </Link>

          {!isCollapsed && onToggleAutoHide && (
            <button
              type="button"
              onClick={onToggleAutoHide}
              className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              title={autoHide ? "Ghim cố định thanh menu" : "Bật tự động ẩn thanh menu"}
            >
              {autoHide ? <PanelLeftOpen className="w-4 h-4 text-blue-600" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="p-2.5">
          <Link 
            href="/teacher/exams/create"
            onClick={onClose}
            title="Tạo đề thi mới"
            className={`w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
              isCollapsed ? "px-0" : "px-3"
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Tạo đề thi mới</span>}
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-6 text-xs">
          <div>
            {!isCollapsed && (
              <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 truncate">
                Khu vực giáo viên
              </div>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={item.name}
                    className={`
                      flex items-center rounded-lg font-medium transition-colors py-2.5
                      ${isCollapsed ? "justify-center px-0" : "justify-between px-3"}
                      ${isActive 
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" 
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground font-medium">
                        {item.badge}
                      </span>
                    )}
                    {!isCollapsed && item.tag && (
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
            {!isCollapsed && (
              <div className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
                <span>Trò chơi trên lớp</span>
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
            )}
            <nav className="space-y-1">
              <Link
                href="/teacher/games"
                onClick={onClose}
                title="Game lớp học"
                className={`
                  flex items-center rounded-lg font-medium transition-colors py-2.5
                  ${isCollapsed ? "justify-center px-0" : "justify-between px-3"}
                  ${isGamesActive 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold" 
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <div className="flex items-center gap-3 truncate">
                  <Gamepad2 className={`w-4 h-4 shrink-0 ${isGamesActive ? "text-blue-600 dark:text-blue-400" : "text-amber-500"}`} />
                  {!isCollapsed && <span className="truncate">Game lớp học</span>}
                </div>
                {!isCollapsed && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    MỚI
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>

        {/* Footer info / settings */}
        <div className="p-2.5 border-t border-border space-y-1">
          <Link
            href="/teacher/settings"
            onClick={onClose}
            title="Cài đặt tài khoản"
            className={`flex items-center gap-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isCollapsed ? "justify-center px-0" : "px-3"
            } ${
              pathname === "/teacher/settings"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                : "text-foreground/80 hover:bg-muted transition-colors"
            }`}
          >
            <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
            {!isCollapsed && <span className="truncate">Cài đặt tài khoản</span>}
          </Link>
          <button
            type="button"
            title="Đăng xuất"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              } catch {
                window.location.href = "/login";
              }
            }}
            className={`w-full flex items-center gap-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left ${
              isCollapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
            {!isCollapsed && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

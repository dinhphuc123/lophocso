"use client";

import { useState } from "react";
import { Bell, Menu, Search, User } from "lucide-react";

interface TeacherHeaderProps {
  onOpenSidebar: () => void;
}

function getInitialGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Chào buổi sáng, Thầy/Cô";
  if (hour >= 11 && hour < 14) return "Chào buổi trưa, Thầy/Cô";
  if (hour >= 14 && hour < 18) return "Chào buổi chiều, Thầy/Cô";
  return "Chào buổi tối, Thầy/Cô";
}

export function TeacherHeader({ onOpenSidebar }: TeacherHeaderProps) {
  const [greeting] = useState(getInitialGreeting);

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>{greeting}</span>
            <span className="text-base sm:text-lg">👋</span>
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Quản lý đề thi, lớp học và theo dõi học sinh làm bài trực tiếp
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search quick button */}
        <div className="hidden md:flex items-center gap-2 bg-muted/60 hover:bg-muted border border-border/60 rounded-lg px-3 py-1.5 text-xs text-muted-foreground cursor-pointer transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Tìm nhanh đề thi, lớp...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded shadow-2xs">
            Ctrl K
          </kbd>
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Thông báo (3 chưa đọc)"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-background animate-pulse" />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-foreground leading-tight">Thầy Nguyễn Văn A</div>
            <div className="text-[10px] text-muted-foreground">THPT Chuyên · khaothiso.vn</div>
          </div>
        </div>
      </div>
    </header>
  );
}

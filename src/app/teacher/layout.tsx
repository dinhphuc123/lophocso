"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TeacherSidebar } from "@/components/sites/dethiso/TeacherSidebar";
import { TeacherHeader } from "@/components/sites/dethiso/TeacherHeader";

const STORAGE_KEY = "lhs_sidebar_autohide";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoHide, setAutoHide] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setAutoHide(saved === "true");
      }
    } catch {}
  }, []);

  const toggleAutoHide = () => {
    setAutoHide((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Completely hide Sidebar & Header on full-screen Presentation and Game Host views
  const isFullScreenStage =
    pathname.endsWith("/presentation") ||
    pathname.startsWith("/teacher/games/host/");

  if (isFullScreenStage) {
    return <div className="min-h-screen bg-slate-950 text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <TeacherSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        autoHide={autoHide}
        onToggleAutoHide={toggleAutoHide}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ${
          autoHide ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <TeacherHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

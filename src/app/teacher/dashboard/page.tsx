import { Metadata } from "next";
import { StatCards } from "@/components/sites/dethiso/StatCards";
import { QuickStartBanner } from "@/components/sites/dethiso/QuickStartBanner";
import { RecentExamsTable } from "@/components/sites/dethiso/RecentExamsTable";
import { WeeklyStats } from "@/components/sites/dethiso/WeeklyStats";
import { DifficultQuestions } from "@/components/sites/dethiso/DifficultQuestions";
import { LiveMonitorSection } from "@/components/sites/dethiso/LiveMonitorSection";

export const metadata: Metadata = {
  title: "Bảng điều khiển Giáo viên | Đề Thi Số - dethiso.vn",
  description: "Quản lý đề thi, chấm trắc nghiệm, giám sát trực tiếp và tạo đấu trường học tập trên dethiso.vn",
};

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <StatCards />

      {/* Quick Start 3-step banner */}
      <QuickStartBanner />

      {/* Grid: 7-day chart & Difficult Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyStats />
        <DifficultQuestions />
      </div>

      {/* Live Monitor */}
      <LiveMonitorSection />

      {/* Recent Exams Table */}
      <RecentExamsTable />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Sparkles, 
  UserCheck, 
  FileSpreadsheet, 
  Download, 
  BookOpen,
  Trophy,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { ClassRoom } from "@/lib/types";

interface GradebookSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentClass?: string;
  score: number;
  submittedAt: string;
}

interface ExamInfo {
  id: string;
  title: string;
}

export default function TeacherClassesPage() {
  const [activeTab, setActiveTab] = useState<"classes" | "gradebook">("classes");
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("12");
  const [studentsRaw, setStudentsRaw] = useState("");
  const [saving, setSaving] = useState(false);

  // Gradebook state
  const [selectedGradebookClassId, setSelectedGradebookClassId] = useState<string>("");
  const [submissions, setSubmissions] = useState<GradebookSubmission[]>([]);
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [loadingGradebook, setLoadingGradebook] = useState(false);

  // 1. Fetch classes
  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success && data.classes) {
        setClasses(data.classes);
        if (!selectedGradebookClassId && data.classes.length > 0) {
          setSelectedGradebookClassId(data.classes[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch gradebook data
  const fetchGradebook = async () => {
    setLoadingGradebook(true);
    try {
      const res = await fetch("/api/classes?gradebook=true");
      const data = await res.json();
      if (data.success) {
        if (data.classes) setClasses(data.classes);
        if (data.submissions) setSubmissions(data.submissions);
        if (data.exams) setExams(data.exams);
        if (!selectedGradebookClassId && data.classes && data.classes.length > 0) {
          setSelectedGradebookClassId(data.classes[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingGradebook(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === "gradebook") {
      fetchGradebook();
    }
  }, [activeTab]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const studentNames = studentsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), grade, students: studentNames }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName("");
        setStudentsRaw("");
        await fetchClasses();
      } else {
        alert(data.error || "Không thể tạo lớp học");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (id: string, className: string) => {
    if (!confirm(`Thầy/Cô có chắc chắn muốn xóa lớp "${className}"?`)) return;

    try {
      const res = await fetch(`/api/classes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
        if (selectedClass?.id === id) setSelectedClass(null);
        if (selectedGradebookClassId === id) setSelectedGradebookClassId("");
      } else {
        alert(data.error || "Không thể xóa lớp");
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  // Gradebook computation for the selected class
  const activeClass = classes.find((c) => c.id === selectedGradebookClassId) || classes[0];

  // Map each student in the active class to their exam scores
  const studentRows = (activeClass?.students || []).map((studentName, idx) => {
    const studentSubs = submissions.filter(
      (s) =>
        s.studentName.trim().toLowerCase() === studentName.trim().toLowerCase() &&
        (!s.studentClass || s.studentClass === activeClass.name)
    );

    const scoresByExam: Record<string, number | null> = {};
    let totalScore = 0;
    let examCount = 0;

    for (const exam of exams) {
      const sub = studentSubs.find((s) => s.examId === exam.id);
      if (sub && typeof sub.score === "number") {
        scoresByExam[exam.id] = sub.score;
        totalScore += sub.score;
        examCount++;
      } else {
        scoresByExam[exam.id] = null;
      }
    }

    const avgScore = examCount > 0 ? Number((totalScore / examCount).toFixed(2)) : null;

    let rank = "Chưa thi";
    let rankColor = "text-muted-foreground bg-muted";
    if (avgScore !== null) {
      if (avgScore >= 8.0) {
        rank = "Giỏi";
        rankColor = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300";
      } else if (avgScore >= 6.5) {
        rank = "Khá";
        rankColor = "text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300";
      } else if (avgScore >= 5.0) {
        rank = "Đạt";
        rankColor = "text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300";
      } else {
        rank = "Chưa đạt";
        rankColor = "text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300";
      }
    }

    return {
      index: idx + 1,
      studentName,
      scoresByExam,
      avgScore,
      rank,
      rankColor,
      examCount,
    };
  });

  // Class statistics
  const validAvgScores = studentRows.map((s) => s.avgScore).filter((s): s is number => s !== null);
  const classAvg = validAvgScores.length > 0
    ? (validAvgScores.reduce((a, b) => a + b, 0) / validAvgScores.length).toFixed(1)
    : "0.0";
  const passCount = validAvgScores.filter((s) => s >= 5.0).length;
  const passRate = validAvgScores.length > 0 ? Math.round((passCount / validAvgScores.length) * 100) : 0;

  // Export to CSV with UTF-8 BOM (opens perfectly in Vietnamese Microsoft Excel)
  const handleExportCsv = () => {
    if (!activeClass) return;

    const headers = ["STT", "Họ và tên", ...exams.map((e) => `"${e.title.replace(/"/g, '""')}"`), "Điểm trung bình", "Xếp loại"];
    const rows = studentRows.map((s) => [
      s.index,
      `"${s.studentName.replace(/"/g, '""')}"`,
      ...exams.map((e) => (s.scoresByExam[e.id] !== null ? s.scoresByExam[e.id] : "")),
      s.avgScore !== null ? s.avgScore : "",
      `"${s.rank}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `So_diem_Lop_${activeClass.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Lớp học & Sổ điểm</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Quản lý danh sách lớp, dán danh sách học sinh từ Excel và theo dõi sổ điểm tổng hợp.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 bg-muted rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("classes")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "classes"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Danh sách Lớp học ({classes.length})
            </button>
            <button
              onClick={() => setActiveTab("gradebook")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "gradebook"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Sổ điểm Tổng hợp</span>
            </button>
          </div>

          {activeTab === "classes" && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm lớp</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DANH SÁCH LỚP HỌC                                 */}
      {/* ========================================================= */}
      {activeTab === "classes" && (
        <>
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Đang tải danh sách lớp từ Supabase...</div>
          ) : classes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-4">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-bold text-base text-foreground">Chưa có lớp học nào</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Thầy/Cô hãy bấm &ldquo;Thêm lớp&rdquo; và dán danh sách tên học sinh (từ Excel/VnEdu/SMAS) vào để bắt đầu.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                Tạo lớp đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Khối {cls.grade || "12"}
                      </span>
                      <button
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Xóa lớp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mt-2">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cls.students?.length || 0} học sinh</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedClass(cls)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground cursor-pointer"
                    >
                      Xem danh sách
                    </button>

                    <button
                      onClick={() => {
                        setSelectedGradebookClassId(cls.id);
                        setActiveTab("gradebook");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Sổ điểm</span>
                    </button>

                    <Link
                      href={`/teacher/games`}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Đấu game</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SỔ ĐIỂM TỔNG HỢP                                   */}
      {/* ========================================================= */}
      {activeTab === "gradebook" && (
        <div className="space-y-5">
          {/* Controls: Class Selector & Export Button */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-foreground shrink-0">Chọn Lớp:</label>
              <select
                value={selectedGradebookClassId}
                onChange={(e) => setSelectedGradebookClassId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.students?.length || 0} HS)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                disabled={!activeClass || studentRows.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất bảng điểm Excel (.csv)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of the Class */}
          {activeClass && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Sĩ số lớp</span>
                <div className="text-xl font-extrabold text-foreground mt-0.5">{activeClass.students?.length || 0} em</div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Bài thi đã làm</span>
                <div className="text-xl font-extrabold text-foreground mt-0.5">{exams.length} bài</div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Điểm TB Lớp</span>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{classAvg} đ</div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Tỷ lệ Đạt (≥ 5.0)</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{passRate}%</div>
              </div>
            </div>
          )}

          {/* Table */}
          {loadingGradebook ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Đang tổng hợp sổ điểm...</div>
          ) : !activeClass || studentRows.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-sm text-foreground">Lớp chưa có học sinh nào</h3>
              <p className="text-xs text-muted-foreground">
                Hãy chuyển về tab &ldquo;Danh sách Lớp học&rdquo; để thêm học sinh vào lớp trước.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">STT</th>
                      <th className="py-3 px-4 min-w-[160px]">Họ và tên học sinh</th>
                      {exams.map((exam) => (
                        <th key={exam.id} className="py-3 px-3 text-center min-w-[100px]" title={exam.title}>
                          <span className="truncate block max-w-[120px]">{exam.title}</span>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center w-24">Điểm TB</th>
                      <th className="py-3 px-3 text-center w-28">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentRows.map((st) => (
                      <tr key={st.index} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-muted-foreground">{st.index}</td>
                        <td className="py-2.5 px-4 font-semibold text-foreground">{st.studentName}</td>
                        {exams.map((exam) => {
                          const val = st.scoresByExam[exam.id];
                          return (
                            <td key={exam.id} className="py-2.5 px-3 text-center font-mono">
                              {val !== null ? (
                                <span className={`font-bold ${val >= 8 ? "text-emerald-600 dark:text-emerald-400" : val >= 5 ? "text-foreground" : "text-rose-600"}`}>
                                  {val}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                          {st.avgScore !== null ? st.avgScore : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${st.rankColor}`}>
                            {st.rank}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM LỚP HỌC MỚI                                   */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Thêm lớp học mới</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Tên lớp</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 12A1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Danh sách học sinh (Mỗi bạn 1 dòng)</label>
                  <span className="text-[11px] text-muted-foreground">Có thể copy từ Excel/VnEdu</span>
                </div>
                <textarea
                  rows={6}
                  placeholder={`Nguyễn Văn An\nTrần Thị Bích\nLê Hoàng Nam\nPhạm Minh Châu`}
                  value={studentsRaw}
                  onChange={(e) => setStudentsRaw(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu vào Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM DANH SÁCH HỌC SINH CỦA LỚP                     */}
      {/* ========================================================= */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-base text-foreground">Lớp {selectedClass.name}</h3>
                <p className="text-xs text-muted-foreground">Tổng số: {selectedClass.students?.length || 0} học sinh</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {selectedClass.students && selectedClass.students.length > 0 ? (
                selectedClass.students.map((sName: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs"
                  >
                    <span className="w-6 font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="flex-1 font-semibold text-foreground">{sName}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">Lớp chưa có học sinh nào.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

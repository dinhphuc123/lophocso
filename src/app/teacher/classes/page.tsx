"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, GraduationCap, Sparkles, BookOpen, UserCheck } from "lucide-react";
import { ClassRoom } from "@/lib/types";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("12");
  const [studentsRaw, setStudentsRaw] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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
        fetchClasses();
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
      } else {
        alert(data.error || "Không thể xóa lớp");
      }
    } catch {
      alert("Lỗi kết nối");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quản lý Lớp học & Danh sách Học sinh</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Tạo danh sách lớp để giao bài thi, đấu game tương tác và theo dõi tiến độ học tập.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm lớp học mới</span>
        </button>
      </div>

      {/* Grid of Classes */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">Đang tải danh sách lớp...</div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-4">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-bold text-base text-foreground">Chưa có lớp học nào</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Thầy/Cô hãy bấm &ldquo;Thêm lớp học mới&rdquo; và dán danh sách tên học sinh vào để bắt đầu.
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

      {/* Modal Add Class */}
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
                  <span className="text-[11px] text-muted-foreground">Có thể copy từ Excel</span>
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
                  {saving ? "Đang lưu..." : "Lưu lớp học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Students */}
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

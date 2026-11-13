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
  Edit,
  Star,
  Mic,
  Presentation,
  Shuffle,
  History,
  Settings2,
  Award,
  Undo2,
  Dices,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Crown,
} from "lucide-react";
import {
  ActivityCategory,
  ClassGroup,
  ClassRoom,
  ParticipationConfig,
  ParticipationLog,
} from "@/lib/types";
import { parseStudentListFromFile } from "@/lib/excel-parser";
import { SqlFixModal } from "@/components/SqlFixModal";
import {
  applyBonusToStudentExams,
  DEFAULT_PARTICIPATION_CONFIG,
  generateBalancedGroups,
  getCategoryLabel,
  getEffectiveConfig,
  GROUP_COLORS,
  normalizeStudentName,
} from "@/lib/participation";

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
  const [activeTab, setActiveTab] = useState<"classes" | "participation" | "gradebook">("classes");
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  // Class Creation / Edit Form state
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("12");
  const [studentsRaw, setStudentsRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [quickStudentName, setQuickStudentName] = useState("");
  const [excelStatus, setExcelStatus] = useState<string | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [supabaseNotice, setSupabaseNotice] = useState<{ message: string; sqlToRun?: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Gradebook & Participation shared state
  const [selectedGradebookClassId, setSelectedGradebookClassId] = useState<string>("");
  const [submissions, setSubmissions] = useState<GradebookSubmission[]>([]);
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [loadingGradebook, setLoadingGradebook] = useState(false);

  // Participation & Group UI state
  const [partSubTab, setPartSubTab] = useState<"individual" | "groups" | "logs" | "config">("individual");
  const [quickNote, setQuickNote] = useState("");
  const [groupSplitCount, setGroupSplitCount] = useState(4);
  const [selectedSpeakerByGroup, setSelectedSpeakerByGroup] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Random Student / Group Picker state
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomMode, setRandomMode] = useState<"student" | "group">("student");
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedResult, setPickedResult] = useState<string | null>(null);
  const [pickedGroupObj, setPickedGroupObj] = useState<ClassGroup | null>(null);

  // Config editing state
  const [draftConfig, setDraftConfig] = useState<ParticipationConfig>(DEFAULT_PARTICIPATION_CONFIG);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Persist & hydrate helper for localStorage resilience
  const hydrateClassData = (rawClasses: ClassRoom[]): ClassRoom[] => {
    return rawClasses.map((cls) => {
      let hydrated = { ...cls };
      try {
        // Hydrate students
        if (!hydrated.students || hydrated.students.length === 0) {
          const cachedStudents =
            localStorage.getItem(`khaothiso_students_${cls.id}`) ||
            localStorage.getItem(`khaothiso_students_name_${cls.name.toLowerCase()}`);
          if (cachedStudents) {
            const parsed = JSON.parse(cachedStudents);
            if (Array.isArray(parsed) && parsed.length > 0) hydrated.students = parsed;
          }
        } else {
          localStorage.setItem(`khaothiso_students_${cls.id}`, JSON.stringify(hydrated.students));
          localStorage.setItem(`khaothiso_students_name_${cls.name.toLowerCase()}`, JSON.stringify(hydrated.students));
        }

        // Hydrate groups
        if (!hydrated.groups || hydrated.groups.length === 0) {
          const cachedGroups = localStorage.getItem(`khaothiso_groups_${cls.id}`);
          if (cachedGroups) {
            const parsed = JSON.parse(cachedGroups);
            if (Array.isArray(parsed) && parsed.length > 0) hydrated.groups = parsed;
          }
        } else {
          localStorage.setItem(`khaothiso_groups_${cls.id}`, JSON.stringify(hydrated.groups));
        }

        // Hydrate participationLogs
        if (!hydrated.participationLogs || hydrated.participationLogs.length === 0) {
          const cachedLogs = localStorage.getItem(`khaothiso_plogs_${cls.id}`);
          if (cachedLogs) {
            const parsed = JSON.parse(cachedLogs);
            if (Array.isArray(parsed) && parsed.length > 0) hydrated.participationLogs = parsed;
          }
        } else {
          localStorage.setItem(`khaothiso_plogs_${cls.id}`, JSON.stringify(hydrated.participationLogs));
        }

        // Hydrate participationConfig
        if (!hydrated.participationConfig) {
          const cachedCfg = localStorage.getItem(`khaothiso_pconfig_${cls.id}`);
          if (cachedCfg) {
            hydrated.participationConfig = JSON.parse(cachedCfg);
          }
        } else {
          localStorage.setItem(`khaothiso_pconfig_${cls.id}`, JSON.stringify(hydrated.participationConfig));
        }
      } catch {}
      return hydrated;
    });
  };

  const persistClassCache = (cls: ClassRoom) => {
    try {
      localStorage.setItem(`khaothiso_students_${cls.id}`, JSON.stringify(cls.students || []));
      localStorage.setItem(`khaothiso_students_name_${cls.name.toLowerCase()}`, JSON.stringify(cls.students || []));
      localStorage.setItem(`khaothiso_groups_${cls.id}`, JSON.stringify(cls.groups || []));
      localStorage.setItem(`khaothiso_plogs_${cls.id}`, JSON.stringify(cls.participationLogs || []));
      if (cls.participationConfig) {
        localStorage.setItem(`khaothiso_pconfig_${cls.id}`, JSON.stringify(cls.participationConfig));
      }
    } catch {}
  };

  // 1. Fetch classes
  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (data.success && data.classes) {
        const hydrated = hydrateClassData(data.classes);
        setClasses(hydrated);
        if (!selectedGradebookClassId && hydrated.length > 0) {
          setSelectedGradebookClassId(hydrated[0].id);
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
        if (data.classes) {
          const hydrated = hydrateClassData(data.classes);
          setClasses(hydrated);
          if (!selectedGradebookClassId && hydrated.length > 0) {
            setSelectedGradebookClassId(hydrated[0].id);
          }
        }
        if (data.submissions) setSubmissions(data.submissions);
        if (data.exams) setExams(data.exams);
      }
    } catch {
      // ignore
    } finally {
      setLoadingGradebook(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "gradebook" || activeTab === "participation") {
      fetchGradebook();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const activeClass = classes.find((c) => c.id === selectedGradebookClassId) || classes[0] || null;

  useEffect(() => {
    if (activeClass) {
      setDraftConfig(getEffectiveConfig(activeClass));
    }
  }, [activeClass]);

  const updateClassInState = (updated: ClassRoom) => {
    persistClassCache(updated);
    setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedClass?.id === updated.id) {
      setSelectedClass(updated);
    }
  };

  // =========================================================
  // PARTICIPATION & GROUP ACTIONS
  // =========================================================
  const handleAddParticipation = async (
    entries: Array<{
      studentName: string;
      category: ActivityCategory;
      stars: number;
      groupId?: string;
      groupName?: string;
      isPresenter?: boolean;
      note?: string;
    }>,
    customToast?: string
  ) => {
    if (!activeClass || entries.length === 0) return;
    setBusyAction(true);

    try {
      const res = await fetch("/api/classes/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_logs",
          classId: activeClass.id,
          className: activeClass.name,
          students: activeClass.students,
          entries: entries.map((e) => ({
            ...e,
            note: e.note || quickNote.trim() || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.class) {
        // Merge with existing local students/groups if needed
        const merged: ClassRoom = {
          ...activeClass,
          ...data.class,
          students: data.class.students?.length ? data.class.students : activeClass.students,
          groups: data.class.groups?.length ? data.class.groups : activeClass.groups,
        };
        updateClassInState(merged);
        showToast(
          customToast ||
            `Đã cộng sao cho ${entries.length} học sinh lớp ${activeClass.name}!`
        );
      } else {
        alert(data.error || "Không thể lưu điểm hoạt động");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!activeClass) return;
    try {
      const res = await fetch("/api/classes/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_log",
          classId: activeClass.id,
          className: activeClass.name,
          logId,
        }),
      });
      const data = await res.json();
      if (data.success && data.class) {
        updateClassInState({
          ...activeClass,
          ...data.class,
          students: activeClass.students,
          groups: activeClass.groups,
        });
        showToast("Đã hoàn tác lượt cộng sao!");
      }
    } catch {
      alert("Lỗi khi xóa lịch sử");
    }
  };

  const handleAutoSplitGroups = async (shuffle: boolean) => {
    if (!activeClass) return;
    if (!activeClass.students || activeClass.students.length === 0) {
      alert("Lớp chưa có danh sách học sinh để chia nhóm!");
      return;
    }

    const newGroups = generateBalancedGroups(activeClass.students, groupSplitCount, shuffle);
    setBusyAction(true);
    try {
      const res = await fetch("/api/classes/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_groups",
          classId: activeClass.id,
          className: activeClass.name,
          groups: newGroups,
        }),
      });
      const data = await res.json();
      if (data.success && data.class) {
        updateClassInState({
          ...activeClass,
          groups: newGroups,
        });
        showToast(
          `Đã chia ${activeClass.students.length} học sinh thành ${newGroups.length} nhóm ${
            shuffle ? "(Ngẫu nhiên)" : "(Theo thứ tự)"
          }!`
        );
      }
    } catch {
      alert("Lỗi khi lưu chia nhóm");
    } finally {
      setBusyAction(false);
    }
  };

  const handleMoveStudentGroup = async (studentName: string, targetGroupId: string) => {
    if (!activeClass) return;
    const currentGroups = activeClass.groups || [];
    const norm = normalizeStudentName(studentName);

    const updatedGroups = currentGroups.map((g) => {
      const filtered = g.members.filter((m) => normalizeStudentName(m) !== norm);
      if (g.id === targetGroupId) {
        return {
          ...g,
          members: [...filtered, studentName],
          leader: g.leader || studentName,
        };
      }
      return {
        ...g,
        members: filtered,
        leader: g.leader && normalizeStudentName(g.leader) === norm ? filtered[0] : g.leader,
      };
    });

    updateClassInState({ ...activeClass, groups: updatedGroups });
    await fetch("/api/classes/participation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_groups",
        classId: activeClass.id,
        className: activeClass.name,
        groups: updatedGroups,
      }),
    }).catch(() => {});
  };

  const handleRewardWholeGroupWork = (group: ClassGroup, stars?: number) => {
    if (!activeClass || group.members.length === 0) return;
    const cfg = getEffectiveConfig(activeClass);
    const s = stars ?? cfg.groupWorkDefaultStars;
    const entries = group.members.map((m) => ({
      studentName: m,
      category: "group_work" as const,
      stars: s,
      groupId: group.id,
      groupName: group.name,
      note: quickNote.trim() || `Hoạt động ${group.name}`,
    }));
    handleAddParticipation(
      entries,
      `Đã cộng +${s} Sao Làm nhóm cho toàn bộ ${group.members.length} thành viên ${group.name}!`
    );
  };

  const handleRewardGroupPresentation = (group: ClassGroup) => {
    if (!activeClass || group.members.length === 0) return;
    const cfg = getEffectiveConfig(activeClass);
    const speaker = selectedSpeakerByGroup[group.id] || group.leader || group.members[0];
    const normSpeaker = normalizeStudentName(speaker);

    const entries = group.members.map((m) => {
      const isSpeaker = normalizeStudentName(m) === normSpeaker;
      return {
        studentName: m,
        category: "presentation" as const,
        stars: isSpeaker ? cfg.presentationSpeakerStars : cfg.presentationMemberStars,
        groupId: group.id,
        groupName: group.name,
        isPresenter: isSpeaker,
        note: isSpeaker
          ? `Thuyết trình chính (${group.name})`
          : `Thành viên trình bày (${group.name})`,
      };
    });

    handleAddParticipation(
      entries,
      `Đã thưởng Trình bày cho ${group.name}: Thuyết trình ${speaker} (+${cfg.presentationSpeakerStars}⭐), Thành viên (+${cfg.presentationMemberStars}⭐)!`
    );
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    setBusyAction(true);
    try {
      const res = await fetch("/api/classes/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_config",
          classId: activeClass.id,
          className: activeClass.name,
          config: draftConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateClassInState({
          ...activeClass,
          participationConfig: draftConfig,
        });
        showToast("Đã lưu cấu hình quy đổi điểm cộng ĐGTX!");
      }
    } catch {
      alert("Lỗi khi lưu cấu hình");
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateStandaloneDgtxColumn = async () => {
    if (!activeClass) return;
    const defaultTitle = `ĐGTX: Phát biểu & Làm nhóm (${new Date().toLocaleDateString("vi-VN")})`;
    const customTitle = prompt(
      "Nhập tên cột điểm Đánh giá thường xuyên (ĐGTX) sẽ tạo trong Sổ điểm:",
      defaultTitle
    );
    if (!customTitle) return;

    setBusyAction(true);
    try {
      const res = await fetch("/api/classes/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_dgtx_column",
          classId: activeClass.id,
          className: activeClass.name,
          columnTitle: customTitle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchGradebook();
        showToast(
          `Đã tạo cột điểm "${customTitle}" cho ${data.submissionsCount} học sinh trong Sổ điểm!`
        );
        setActiveTab("gradebook");
      } else {
        alert(data.error || "Không thể tạo cột điểm ĐGTX");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setBusyAction(false);
    }
  };

  // Random Spinner Logic
  const triggerRandomPick = (mode: "student" | "group") => {
    if (!activeClass) return;
    setRandomMode(mode);
    setShowRandomModal(true);
    setIsSpinning(true);
    setPickedResult(null);
    setPickedGroupObj(null);

    if (mode === "group") {
      const grps =
        activeClass.groups && activeClass.groups.length > 0
          ? activeClass.groups
          : generateBalancedGroups(activeClass.students || [], 4, false);
      if (grps.length === 0) {
        setIsSpinning(false);
        return;
      }
      let ticks = 0;
      const timer = setInterval(() => {
        const g = grps[Math.floor(Math.random() * grps.length)];
        setPickedResult(g.name);
        setPickedGroupObj(g);
        ticks++;
        if (ticks >= 14) {
          clearInterval(timer);
          setIsSpinning(false);
        }
      }, 90);
    } else {
      const list = activeClass.students || [];
      if (list.length === 0) {
        setIsSpinning(false);
        return;
      }
      let ticks = 0;
      const timer = setInterval(() => {
        const s = list[Math.floor(Math.random() * list.length)];
        setPickedResult(s);
        ticks++;
        if (ticks >= 16) {
          clearInterval(timer);
          setIsSpinning(false);
        }
      }, 80);
    }
  };

  // =========================================================
  // CLASS CRUD HANDLERS
  // =========================================================
  const handleOpenCreateModal = () => {
    setEditingClassId(null);
    setName("");
    setGrade("12");
    setStudentsRaw("");
    setExcelStatus(null);
    setShowModal(true);
  };

  const handleEditClass = (cls: ClassRoom) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setGrade(cls.grade || "12");
    setStudentsRaw((cls.students || []).join("\n"));
    setExcelStatus(null);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelStatus("Đang phân tích file Excel/CSV...");
    try {
      const names = await parseStudentListFromFile(file);
      if (names.length === 0) {
        setExcelStatus(
          "Không tìm thấy danh sách tên học sinh trong file. Vui lòng kiểm tra cột có tiêu đề 'Họ và tên' hoặc 'Tên'."
        );
      } else {
        const existing = studentsRaw
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        let finalNames = names;
        if (existing.length > 0) {
          const overwrite = confirm(
            `Đã có sẵn ${existing.length} học sinh trong danh sách.\nThầy/Cô có muốn GHI ĐÈ thay thế toàn bộ bằng ${names.length} học sinh từ file Excel này không?\n\n- Bấm OK để GHI ĐÈ (thay thế hoàn toàn)\n- Bấm Cancel để THÊM TIẾP vào danh sách hiện tại`
          );
          if (!overwrite) {
            finalNames = Array.from(new Set([...existing, ...names]));
          }
        }

        setStudentsRaw(finalNames.join("\n"));
        setExcelStatus(
          `Đã nhập thành công ${names.length} học sinh từ file "${file.name}" (Tổng sĩ số: ${finalNames.length} HS)!`
        );
        if (!name.trim()) {
          const guessed = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/danh[-_\s]*sach[-_\s]*/i, "")
            .trim();
          if (guessed.length > 0 && guessed.length <= 15) {
            setName(guessed.toUpperCase());
          }
        }
      }
    } catch (err) {
      console.error("Excel parse error:", err);
      setExcelStatus("Lỗi đọc file. Thầy/Cô vui lòng dùng định dạng file .xlsx hoặc .csv chuẩn.");
    } finally {
      setIsParsingExcel(false);
      e.target.value = "";
    }
  };

  const handleRemoveStudentFromClass = async (studentNameToRemove: string) => {
    if (!selectedClass) return;
    if (!confirm(`Xác nhận xóa học sinh "${studentNameToRemove}" khỏi lớp ${selectedClass.name}?`))
      return;

    const updatedStudents = (selectedClass.students || []).filter(
      (s) => s !== studentNameToRemove
    );
    const updatedClass: ClassRoom = { ...selectedClass, students: updatedStudents };

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClass.id,
          name: selectedClass.name,
          grade: selectedClass.grade,
          students: updatedStudents,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateClassInState(updatedClass);
      } else {
        alert(data.error || "Không thể xóa học sinh");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    }
  };

  const handleQuickAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !quickStudentName.trim()) return;

    const nameClean = quickStudentName.trim();
    if (selectedClass.students?.includes(nameClean)) {
      alert(`Học sinh "${nameClean}" đã có trong danh sách!`);
      return;
    }

    const updatedStudents = [...(selectedClass.students || []), nameClean];
    const updatedClass: ClassRoom = { ...selectedClass, students: updatedStudents };

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClass.id,
          name: selectedClass.name,
          grade: selectedClass.grade,
          students: updatedStudents,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickStudentName("");
        updateClassInState(updatedClass);
      } else {
        alert(data.error || "Không thể thêm học sinh");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    }
  };

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
        body: JSON.stringify({
          id: editingClassId || undefined,
          name: name.trim(),
          grade,
          students: studentNames,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName("");
        setStudentsRaw("");
        setEditingClassId(null);
        setExcelStatus(null);

        const targetId = editingClassId || data.class?.id;
        if (targetId && data.class) {
          persistClassCache({ ...data.class, students: studentNames });
        }

        if (data.warning) {
          setSupabaseNotice({ message: data.warning, sqlToRun: data.sqlToRun });
        } else {
          setSupabaseNotice(null);
        }
        await fetchClasses();
      } else {
        alert(data.error || "Không thể lưu lớp học");
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

  // =========================================================
  // GRADEBOOK & PARTICIPATION COMPUTATION FOR ACTIVE CLASS
  // =========================================================
  const activeConfig = getEffectiveConfig(activeClass);
  const activeLogs: ParticipationLog[] = activeClass?.participationLogs || [];
  const activeGroups: ClassGroup[] = activeClass?.groups || [];
  const examIds = exams.map((e) => e.id);

  const studentRows = (activeClass?.students || []).map((studentName, idx) => {
    const studentSubs = submissions.filter(
      (s) =>
        normalizeStudentName(s.studentName) === normalizeStudentName(studentName) &&
        (!s.studentClass ||
          s.studentClass.toLowerCase() === activeClass.name.toLowerCase() ||
          s.studentClass === "Tự do")
    );

    const rawScoresByExam: Record<string, number | null> = {};
    for (const exam of exams) {
      const sub = studentSubs.find((s) => s.examId === exam.id);
      rawScoresByExam[exam.id] = sub && typeof sub.score === "number" ? sub.score : null;
    }

    const gradeResult = applyBonusToStudentExams(
      studentName,
      examIds,
      rawScoresByExam,
      activeLogs,
      activeGroups,
      activeConfig
    );

    const avgScore = gradeResult.finalAvgScore;
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
      rawScoresByExam,
      ...gradeResult,
      avgScore,
      rank,
      rankColor,
    };
  });

  // Class statistics
  const validAvgScores = studentRows
    .map((s) => s.avgScore)
    .filter((s): s is number => s !== null);
  const classAvg =
    validAvgScores.length > 0
      ? (validAvgScores.reduce((a, b) => a + b, 0) / validAvgScores.length).toFixed(2)
      : "0.0";
  const passCount = validAvgScores.filter((s) => s >= 5.0).length;
  const passRate =
    validAvgScores.length > 0 ? Math.round((passCount / validAvgScores.length) * 100) : 0;
  const totalClassStars = studentRows.reduce((acc, r) => acc + r.breakdown.totalStars, 0);

  // Export to CSV with UTF-8 BOM (including full breakdown of Stars, Bonus Points, Original vs Adjusted Exam Scores, and Banked Overflow)
  const handleExportCsv = () => {
    if (!activeClass) return;

    const headers = [
      "STT",
      "Họ và tên",
      "Tổ/Nhóm",
      "Sao Phát biểu",
      "Sao Làm nhóm",
      "Sao Trình bày",
      "Tổng Sao tích lũy",
      "Tổng Điểm cộng quy đổi (+đ)",
      ...exams.flatMap((e) => [
        `"${e.title.replace(/"/g, '""')} (Điểm gốc)"`,
        `"${e.title.replace(/"/g, '""')} (+Điểm cộng)"`,
        `"${e.title.replace(/"/g, '""')} (Điểm sau quy đổi)"`,
      ]),
      "Điểm cộng đã áp dụng",
      "Điểm cộng bảo lưu (Dư)",
      "ĐTB Gốc",
      "ĐTB Sau quy đổi",
      "Xếp loại",
    ];

    const rows = studentRows.map((s) => [
      s.index,
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${(s.breakdown.groupName || "Chưa phân nhóm").replace(/"/g, '""')}"`,
      s.breakdown.speechStars,
      s.breakdown.groupWorkStars,
      s.breakdown.presentationStars,
      s.breakdown.totalStars,
      s.breakdown.totalBonusPoints,
      ...exams.flatMap((e) => {
        const adj = s.examAdjustments[e.id];
        return [
          adj?.rawScore !== null && adj?.rawScore !== undefined ? adj.rawScore : "",
          adj?.bonusApplied ? `+${adj.bonusApplied}` : "0",
          adj?.finalScore !== null && adj?.finalScore !== undefined ? adj.finalScore : "",
        ];
      }),
      s.totalBonusApplied,
      s.remainingBankedBonus,
      s.rawAvgScore !== null ? s.rawAvgScore : "",
      s.avgScore !== null ? s.avgScore : "",
      `"${s.rank}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `So_diem_Quy_doi_Lop_${activeClass.name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Lớp học, Chuyên cần &amp; Sổ điểm ĐGTX</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Quản lý lớp, chấm điểm Phát biểu cá nhân • Làm nhóm • Trình bày nhóm và tự động quy đổi điểm cộng vào Bài kiểm tra thường xuyên.
          </p>
        </div>

        {/* Main 3-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center p-1 bg-muted rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("classes")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "classes"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Danh sách Lớp ({classes.length})
            </button>
            <button
              onClick={() => setActiveTab("participation")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "participation"
                  ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Phát biểu &amp; Làm nhóm</span>
            </button>
            <button
              onClick={() => setActiveTab("gradebook")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "gradebook"
                  ? "bg-card text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Sổ điểm &amp; Quy đổi ĐGTX</span>
            </button>
          </div>

          {activeTab === "classes" && (
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm lớp</span>
            </button>
          )}
        </div>
      </div>

      {showSqlModal && <SqlFixModal onClose={() => setShowSqlModal(false)} />}

      {/* Supabase RLS Notice if detected */}
      {supabaseNotice && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              {supabaseNotice.message}
            </span>
            <button
              onClick={() => setSupabaseNotice(null)}
              className="text-muted-foreground hover:text-foreground text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
            >
              Xem câu lệnh SQL và hướng dẫn khắc phục
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: DANH SÁCH LỚP HỌC                                 */}
      {/* ========================================================= */}
      {activeTab === "classes" && (
        <>
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Đang tải danh sách lớp...
            </div>
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
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                Tạo lớp đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const logsCount = cls.participationLogs?.length || 0;
                const groupsCount = cls.groups?.length || 0;
                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Khối {cls.grade || "12"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClass(cls)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin & danh sách lớp"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Xóa lớp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mt-2">{cls.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cls.students?.length || 0} học sinh</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{logsCount} lượt phát biểu/nhóm</span>
                        </span>
                        {groupsCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {groupsCount} nhóm
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedGradebookClassId(cls.id);
                            setActiveTab("participation");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Chấm điểm Phát biểu cá nhân, Làm nhóm, Trình bày nhóm"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Chấm Phát biểu &amp; Nhóm</span>
                        </button>

                        <button
                          onClick={() => setSelectedClass(cls)}
                          className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground cursor-pointer"
                        >
                          DS ({cls.students?.length || 0})
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedGradebookClassId(cls.id);
                            setActiveTab("gradebook");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Sổ điểm</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BẢNG ĐIỀU KHIỂN PHÁT BIỂU, LÀM NHÓM & TRÌNH BÀY    */}
      {/* ========================================================= */}
      {activeTab === "participation" && (
        <div className="space-y-5">
          {/* Top Class Bar + Quick Random Call Tools */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-foreground shrink-0">Lớp đang dạy:</label>
              <select
                value={selectedGradebookClassId}
                onChange={(e) => setSelectedGradebookClassId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.students?.length || 0} HS)
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Ghi chú tiết học (VD: Bài 9 - Hoạt động 2)..."
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground w-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => triggerRandomPick("student")}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Gọi tên ngẫu nhiên</span>
              </button>

              <button
                type="button"
                onClick={() => triggerRandomPick("group")}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Bốc nhóm trình bày</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("gradebook")}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem Sổ điểm Quy đổi</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-navigation for Participation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPartSubTab("individual")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  partSubTab === "individual"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Cá nhân Phát biểu ({activeClass?.students?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setPartSubTab("groups")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  partSubTab === "groups"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Làm nhóm &amp; Trình bày nhóm ({activeGroups.length} nhóm)</span>
              </button>
              <button
                type="button"
                onClick={() => setPartSubTab("logs")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  partSubTab === "logs"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Nhật ký ({activeLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPartSubTab("config")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                  partSubTab === "config"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-purple-600" />
                <span>4. Cấu hình Quy đổi ({activeConfig.starsPerPointRatio}đ/sao)</span>
              </button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span>
                Tỷ lệ quy đổi:{" "}
                <strong className="text-amber-600 dark:text-amber-400">
                  1 ⭐ = +{activeConfig.starsPerPointRatio}đ
                </strong>
              </span>
              <span>•</span>
              <span>
                Trần cộng/bài:{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  +{activeConfig.maxBonusPerExam}đ
                </strong>
              </span>
            </div>
          </div>

          {/* SUB-TAB 1: CHẤM PHÁT BIỂU CÁ NHÂN 1-CLICK */}
          {partSubTab === "individual" && (
            <div className="space-y-4">
              {!activeClass || !activeClass.students || activeClass.students.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Lớp này chưa có danh sách học sinh. Hãy thêm học sinh để bắt đầu chấm phát biểu!
                  </p>
                  {activeClass && (
                    <button
                      onClick={() => handleEditClass(activeClass)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      + Nhập danh sách học sinh
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentRows.map((row) => (
                    <div
                      key={row.index}
                      className="p-3.5 rounded-2xl border border-border bg-card hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
                            {row.index}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {row.studentName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              {row.breakdown.groupName && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                                  {row.breakdown.groupName}
                                </span>
                              )}
                              <span>
                                PB: <strong>{row.breakdown.speechStars}</strong> • Nhóm:{" "}
                                <strong>{row.breakdown.groupWorkStars}</strong> • TB:{" "}
                                <strong>{row.breakdown.presentationStars}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-xs font-black">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{row.breakdown.totalStars}</span>
                          </div>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            +{row.breakdown.totalBonusPoints}đ cộng
                          </div>
                        </div>
                      </div>

                      {/* Quick 1-click buttons */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            handleAddParticipation(
                              [
                                {
                                  studentName: row.studentName,
                                  category: "speech",
                                  stars: activeConfig.speechDefaultStars,
                                },
                              ],
                              `Đã cộng +${activeConfig.speechDefaultStars}⭐ Phát biểu cho ${row.studentName}!`
                            )
                          }
                          className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-600 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Phát biểu xây dựng bài"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Phát biểu +{activeConfig.speechDefaultStars}⭐</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            handleAddParticipation(
                              [
                                {
                                  studentName: row.studentName,
                                  category: "speech",
                                  stars: 2,
                                  note: "Giải bài khó / Lên bảng xuất sắc",
                                },
                              ],
                              `Đã thưởng nóng +2⭐ Xuất sắc cho ${row.studentName}!`
                            )
                          }
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                          title="Lên bảng giải đúng bài tập vận dụng / xuất sắc (+2 Sao)"
                        >
                          +2⭐ Giỏi
                        </button>

                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            handleAddParticipation(
                              [
                                {
                                  studentName: row.studentName,
                                  category: "presentation",
                                  stars: activeConfig.presentationSpeakerStars,
                                  isPresenter: true,
                                  note: "Đại diện thuyết trình",
                                },
                              ],
                              `Đã cộng +${activeConfig.presentationSpeakerStars}⭐ Thuyết trình cho ${row.studentName}!`
                            )
                          }
                          className="py-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Đại diện trình bày / báo cáo"
                        >
                          <Presentation className="w-3 h-3" />
                          <span>+{activeConfig.presentationSpeakerStars}⭐</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: QUẢN LÝ TỔ / NHÓM, CHẤM LÀM NHÓM & TRÌNH BÀY NHÓM */}
          {partSubTab === "groups" && (
            <div className="space-y-4">
              {/* Group Generator Toolbar */}
              <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Chia Tổ / Nhóm học tập:</span>
                  <select
                    value={groupSplitCount}
                    onChange={(e) => setGroupSplitCount(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-bold"
                  >
                    {[2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        Chia thành {n} Nhóm
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleAutoSplitGroups(false)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Chia theo danh sách
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleAutoSplitGroups(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Chia nhóm Ngẫu nhiên</span>
                  </button>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  Mẹo: Bấm <strong>+Cả nhóm Làm việc</strong> để cộng sao thảo luận, hoặc chọn{" "}
                  <strong>Người thuyết trình</strong> để cộng điểm Trình bày nhóm (Thuyết trình +{activeConfig.presentationSpeakerStars}⭐, Thành viên +{activeConfig.presentationMemberStars}⭐).
                </div>
              </div>

              {activeGroups.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                  <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h3 className="font-bold text-sm text-foreground">
                    Lớp {activeClass?.name} chưa chia Tổ / Nhóm
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Thầy/Cô hãy bấm nút <strong>&ldquo;Chia thành 4 Nhóm&rdquo;</strong> ở thanh công cụ phía trên để hệ thống tự động phân bổ học sinh vào các nhóm.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAutoSplitGroups(false)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Tự động chia 4 Nhóm ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGroups.map((grp, gIdx) => {
                    const currentSpeaker =
                      selectedSpeakerByGroup[grp.id] || grp.leader || grp.members[0] || "";
                    const badgeStyle = GROUP_COLORS[gIdx % GROUP_COLORS.length];

                    return (
                      <div
                        key={grp.id}
                        className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${badgeStyle}`}
                              >
                                {grp.name}
                              </span>
                              <span className="text-xs text-muted-foreground font-semibold">
                                ({grp.members.length} thành viên)
                              </span>
                            </div>

                            {/* Group Work 1-Click Reward Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busyAction}
                                onClick={() => handleRewardWholeGroupWork(grp, activeConfig.groupWorkDefaultStars)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Cộng sao thảo luận / hoàn thành nhiệm vụ nhóm cho tất cả thành viên"
                              >
                                <Users className="w-3 h-3" />
                                <span>Làm nhóm +{activeConfig.groupWorkDefaultStars}⭐</span>
                              </button>
                              <button
                                type="button"
                                disabled={busyAction}
                                onClick={() => handleRewardWholeGroupWork(grp, 2)}
                                className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                                title="Thưởng nhóm về đích nhanh nhất (+2 Sao toàn nhóm)"
                              >
                                +2⭐ Nhất
                              </button>
                            </div>
                          </div>

                          {/* Group Members List */}
                          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {grp.members.map((memberName) => {
                              const stRow = studentRows.find(
                                (r) =>
                                  normalizeStudentName(r.studentName) ===
                                  normalizeStudentName(memberName)
                              );
                              const isSpeaker =
                                normalizeStudentName(currentSpeaker) ===
                                normalizeStudentName(memberName);

                              return (
                                <div
                                  key={memberName}
                                  className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                                    isSpeaker
                                      ? "bg-purple-50/70 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800"
                                      : "bg-muted/30 border-border/70"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedSpeakerByGroup((prev) => ({
                                          ...prev,
                                          [grp.id]: memberName,
                                        }))
                                      }
                                      className={`p-1 rounded-lg cursor-pointer transition-colors ${
                                        isSpeaker
                                          ? "bg-purple-600 text-white"
                                          : "bg-muted text-muted-foreground hover:text-foreground"
                                      }`}
                                      title="Chọn làm Người thuyết trình chính của nhóm"
                                    >
                                      <Crown className="w-3 h-3" />
                                    </button>
                                    <span className="font-semibold text-foreground truncate">
                                      {memberName}
                                    </span>
                                    {isSpeaker && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-bold shrink-0">
                                        Thuyết trình
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                      {stRow?.breakdown.totalStars || 0}⭐
                                    </span>
                                    <select
                                      value={grp.id}
                                      onChange={(e) =>
                                        handleMoveStudentGroup(memberName, e.target.value)
                                      }
                                      className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground"
                                      title="Chuyển sang nhóm khác"
                                    >
                                      {activeGroups.map((gOpt) => (
                                        <option key={gOpt.id} value={gOpt.id}>
                                          {gOpt.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Group Presentation Footer Action */}
                        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] text-muted-foreground">
                            Đại diện báo cáo:{" "}
                            <strong className="text-purple-700 dark:text-purple-300">
                              {currentSpeaker || "Chưa chọn"}
                            </strong>
                          </div>
                          <button
                            type="button"
                            disabled={busyAction || grp.members.length === 0}
                            onClick={() => handleRewardGroupPresentation(grp)}
                            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>
                              Chấm Trình bày nhóm (TT +{activeConfig.presentationSpeakerStars}⭐, TV +
                              {activeConfig.presentationMemberStars}⭐)
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: NHẬT KÝ HOẠT ĐỘNG & HOÀN TÁC */}
          {partSubTab === "logs" && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Nhật ký Phát biểu, Làm nhóm &amp; Trình bày ({activeLogs.length} lượt)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Lưu vết chi tiết thời gian, loại hoạt động và cho phép hoàn tác nếu bấm nhầm.
                  </p>
                </div>
              </div>

              {activeLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Chưa có lượt ghi nhận hoạt động nào trong lớp này.
                </div>
              ) : (
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {activeLogs.slice(0, 100).map((log) => (
                    <div
                      key={log.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black shrink-0">
                          +{log.stars} ⭐
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">
                            {log.studentName}{" "}
                            {log.groupName && (
                              <span className="text-[11px] font-semibold text-blue-600">
                                ({log.groupName})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground/80">
                              {getCategoryLabel(log.category)}
                            </span>
                            {log.note && <span>• {log.note}</span>}
                            <span>
                              • {new Date(log.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-rose-50 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Hoàn tác lượt cộng này"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Hoàn tác</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 4: CẤU HÌNH CÔNG THỨC QUY ĐỔI ĐIỂM CỘNG ĐGTX */}
          {partSubTab === "config" && (
            <form
              onSubmit={handleSaveConfig}
              className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-2xl"
            >
              <div className="pb-3 border-b border-border">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-600" />
                  <span>Cấu hình Công thức Quy đổi Điểm cộng ĐGTX — Lớp {activeClass?.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Tùy chỉnh trọng số sao cho từng hoạt động và cơ chế cộng dồn vào bài kiểm tra thường xuyên.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    1 Sao quy đổi thành bao nhiêu điểm cộng?
                  </label>
                  <select
                    value={draftConfig.starsPerPointRatio}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        starsPerPointRatio: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                  >
                    <option value={0.1}>1 Sao = +0.10 điểm cộng</option>
                    <option value={0.2}>1 Sao = +0.20 điểm cộng</option>
                    <option value={0.25}>1 Sao = +0.25 điểm cộng (Khuyên dùng)</option>
                    <option value={0.5}>1 Sao = +0.50 điểm cộng</option>
                    <option value={1.0}>1 Sao = +1.00 điểm cộng</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Trần điểm cộng tối đa cho mỗi bài kiểm tra TX
                  </label>
                  <select
                    value={draftConfig.maxBonusPerExam}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        maxBonusPerExam: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                  >
                    <option value={1.0}>Tối đa +1.0 điểm / bài (dư bảo lưu bài sau)</option>
                    <option value={1.5}>Tối đa +1.5 điểm / bài (dư bảo lưu bài sau)</option>
                    <option value={2.0}>Tối đa +2.0 điểm / bài (Khuyên dùng)</option>
                    <option value={3.0}>Tối đa +3.0 điểm / bài</option>
                    <option value={10.0}>Không giới hạn (Cộng tối đa đến trần 10.0đ)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Bài kiểm tra thường xuyên nhận điểm cộng
                  </label>
                  <select
                    value={draftConfig.targetExamId || "auto"}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        targetExamId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                  >
                    <option value="auto">
                      Tự động cộng vào các bài KT và bảo lưu phần dư sang bài kế tiếp
                    </option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        Ưu tiên cộng vào: {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Mốc Sao chuẩn khi xuất thành cột điểm ĐGTX 10đ riêng
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={draftConfig.standaloneColumnStars}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        standaloneColumnStars: Number(e.target.value) || 20,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Sao Phát biểu</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draftConfig.speechDefaultStars}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        speechDefaultStars: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Sao Làm nhóm</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draftConfig.groupWorkDefaultStars}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        groupWorkDefaultStars: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Trình bày (TV)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draftConfig.presentationMemberStars}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        presentationMemberStars: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Thuyết trình chính</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draftConfig.presentationSpeakerStars}
                    onChange={(e) =>
                      setDraftConfig({
                        ...draftConfig,
                        presentationSpeakerStars: Number(e.target.value) || 2,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="submit"
                  disabled={busyAction}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  Lưu Cấu hình Quy đổi
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SỔ ĐIỂM TỔNG HỢP & QUY ĐỔI ĐIỂM CỘNG ĐGTX          */}
      {/* ========================================================= */}
      {activeTab === "gradebook" && (
        <div className="space-y-5">
          {/* Controls: Class Selector, Target Exam Selector & Export Buttons */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
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

              <button
                type="button"
                onClick={() => setActiveTab("participation")}
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>+ Chấm Phát biểu / Nhóm</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyAction || !activeClass}
                onClick={handleCreateStandaloneDgtxColumn}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                title="Quy đổi tổng Sao tích lũy thành 1 cột điểm Đánh giá thường xuyên (thang 10) riêng biệt"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chốt thành cột điểm ĐGTX riêng</span>
              </button>

              <button
                onClick={handleExportCsv}
                disabled={!activeClass || studentRows.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Sổ điểm Excel (.csv)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of the Class */}
          {activeClass && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">Sĩ số lớp</span>
                <div className="text-xl font-extrabold text-foreground mt-0.5">
                  {activeClass.students?.length || 0} em
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Tổng Sao Phát biểu &amp; Nhóm
                </span>
                <div className="text-xl font-extrabold text-amber-500 mt-0.5">
                  {totalClassStars} ⭐
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Quy đổi Điểm cộng
                </span>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  1⭐ = +{activeConfig.starsPerPointRatio}đ (Tối đa +{activeConfig.maxBonusPerExam}đ/bài)
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">
                  ĐTB Lớp (Sau cộng)
                </span>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  {classAvg} đ
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Tỷ lệ Đạt (≥ 5.0)
                </span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {passRate}%
                </div>
              </div>
            </div>
          )}

          {/* Gradebook Table with Participation Breakdown & Auto Bonus Conversion */}
          {loadingGradebook ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Đang tổng hợp sổ điểm và quy đổi điểm cộng...
            </div>
          ) : !activeClass || studentRows.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-bold text-sm text-foreground">Lớp chưa có học sinh nào</h3>
              <p className="text-xs text-muted-foreground">
                Hãy chuyển về tab &ldquo;Danh sách Lớp&rdquo; để thêm học sinh vào lớp trước.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-2.5 text-center w-10">STT</th>
                      <th className="py-3 px-3 min-w-[165px]">Họ và tên học sinh</th>
                      <th className="py-3 px-2.5 text-center min-w-[115px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                        Sao tích lũy
                        <div className="text-[9px] font-normal normal-case opacity-80">
                          PB • Nhóm • TB
                        </div>
                      </th>
                      <th className="py-3 px-2.5 text-center min-w-[100px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                        Quỹ Điểm cộng
                        <div className="text-[9px] font-normal normal-case opacity-80">
                          1⭐ = +{activeConfig.starsPerPointRatio}đ
                        </div>
                      </th>
                      {exams.map((exam) => (
                        <th
                          key={exam.id}
                          className="py-3 px-3 text-center min-w-[120px]"
                          title={exam.title}
                        >
                          <span className="truncate block max-w-[140px] mx-auto">
                            {exam.title}
                          </span>
                          <span className="text-[9px] font-normal normal-case text-muted-foreground">
                            Gốc → Sau cộng
                          </span>
                        </th>
                      ))}
                      <th
                        className="py-3 px-2.5 text-center w-24"
                        title="Điểm cộng còn dư chưa dùng hết, được bảo lưu tự động cho bài kiểm tra thường xuyên tiếp theo"
                      >
                        Bảo lưu
                      </th>
                      <th className="py-3 px-3 text-center w-24">ĐTB ĐGTX</th>
                      <th className="py-3 px-3 text-center w-24">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentRows.map((st) => (
                      <tr key={st.index} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-2.5 text-center font-bold text-muted-foreground">
                          {st.index}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{st.studentName}</div>
                          {st.breakdown.groupName && (
                            <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium mt-0.5">
                              {st.breakdown.groupName}
                            </span>
                          )}
                        </td>

                        {/* Cột Sao Tích Lũy (PB / Làm nhóm / Trình bày) + Nút bấm nhanh */}
                        <td className="py-2.5 px-2.5 text-center bg-amber-50/20 dark:bg-amber-950/10">
                          <div className="flex items-center justify-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{st.breakdown.totalStars}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddParticipation(
                                  [
                                    {
                                      studentName: st.studentName,
                                      category: "speech",
                                      stars: activeConfig.speechDefaultStars,
                                    },
                                  ],
                                  `Đã cộng +${activeConfig.speechDefaultStars}⭐ Phát biểu cho ${st.studentName}!`
                                )
                              }
                              className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 text-[10px] font-extrabold cursor-pointer transition-colors"
                              title="Cộng nhanh +1 Sao phát biểu"
                            >
                              +1⭐
                            </button>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {st.breakdown.speechStars} • {st.breakdown.groupWorkStars} •{" "}
                            {st.breakdown.presentationStars}
                          </div>
                        </td>

                        {/* Cột Quỹ Điểm Cộng Quy Đổi */}
                        <td className="py-2.5 px-2.5 text-center font-mono bg-emerald-50/20 dark:bg-emerald-950/10">
                          {st.breakdown.totalBonusPoints > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[11px]">
                              +{st.breakdown.totalBonusPoints}đ
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">0đ</span>
                          )}
                        </td>

                        {/* Các cột Bài Kiểm Tra Thường Xuyên (Hiển thị Điểm gốc + Điểm cộng = Điểm sau quy đổi) */}
                        {exams.map((exam) => {
                          const adj = st.examAdjustments[exam.id];
                          const raw = adj?.rawScore ?? null;
                          const final = adj?.finalScore ?? null;
                          const bonus = adj?.bonusApplied ?? 0;

                          return (
                            <td key={exam.id} className="py-2.5 px-3 text-center font-mono">
                              {raw !== null && final !== null ? (
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`font-black text-xs ${
                                      final >= 8
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : final >= 5
                                        ? "text-foreground"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {final}
                                  </span>
                                  {bonus > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      ({raw} <span className="text-amber-600">+{bonus}</span>)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Điểm cộng còn dư bảo lưu */}
                        <td className="py-2.5 px-2.5 text-center font-mono">
                          {st.remainingBankedBonus > 0 ? (
                            <span
                              className="text-[11px] font-bold text-amber-600 dark:text-amber-400"
                              title="Được bảo lưu tự động sang bài kiểm tra thường xuyên tiếp theo"
                            >
                              +{st.remainingBankedBonus}đ
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">0đ</span>
                          )}
                        </td>

                        {/* Điểm TB sau quy đổi */}
                        <td className="py-2.5 px-3 text-center font-mono">
                          {st.avgScore !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="font-black text-blue-600 dark:text-blue-400 text-xs">
                                {st.avgScore}
                              </span>
                              {st.rawAvgScore !== null && st.rawAvgScore !== st.avgScore && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {st.rawAvgScore}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${st.rankColor}`}
                          >
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
      {/* MODAL: VÒNG QUAY GỌI TÊN NGẪU NHIÊN / BỐC NHÓM TRÌNH BÀY   */}
      {/* ========================================================= */}
      {showRandomModal && activeClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Dices className="w-4 h-4" />
                <span>
                  {randomMode === "student"
                    ? "Vòng quay gọi học sinh phát biểu"
                    : "Bốc thăm Nhóm lên trình bày"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowRandomModal(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 px-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-amber-500/10 border border-purple-500/30 space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                Lớp {activeClass.name}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black text-foreground transition-all ${
                  isSpinning ? "animate-pulse scale-105 text-purple-600" : "text-amber-500"
                }`}
              >
                {pickedResult || "Đang chọn..."}
              </div>
              {randomMode === "group" && pickedGroupObj && !isSpinning && (
                <div className="text-xs text-muted-foreground pt-2">
                  Thành viên: {pickedGroupObj.members.join(", ")}
                </div>
              )}
            </div>

            {!isSpinning && pickedResult && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {randomMode === "student" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddParticipation(
                          [
                            {
                              studentName: pickedResult,
                              category: "speech",
                              stars: activeConfig.speechDefaultStars,
                            },
                          ],
                          `Đã cộng +${activeConfig.speechDefaultStars}⭐ Phát biểu cho ${pickedResult}!`
                        );
                        setShowRandomModal(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer shadow-xs"
                    >
                      ⭐ Cộng +{activeConfig.speechDefaultStars} Sao Phát biểu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddParticipation(
                          [
                            {
                              studentName: pickedResult,
                              category: "speech",
                              stars: 2,
                              note: "Trả lời xuất sắc câu hỏi ngẫu nhiên",
                            },
                          ],
                          `Đã thưởng +2⭐ Xuất sắc cho ${pickedResult}!`
                        );
                        setShowRandomModal(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                    >
                      🌟 Thưởng +2 Sao Giỏi
                    </button>
                  </>
                ) : (
                  pickedGroupObj && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRewardGroupPresentation(pickedGroupObj);
                        setShowRandomModal(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                    >
                      🎤 Chấm Trình bày cho {pickedGroupObj.name}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="flex justify-center gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => triggerRandomPick(randomMode)}
                className="px-4 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Quay lại lần nữa
              </button>
              <button
                type="button"
                onClick={() => setShowRandomModal(false)}
                className="px-4 py-1.5 rounded-xl bg-muted text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA LỚP HỌC                          */}
      {/* ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                {editingClassId ? "Chỉnh sửa lớp & Thêm học sinh" : "Thêm lớp học mới"}
              </h3>
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

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-bold text-foreground">
                    Danh sách học sinh (Mỗi bạn 1 dòng)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {isParsingExcel ? "Đang đọc..." : "Nhập từ Excel (.xlsx / .csv)"}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv, .txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsingExcel}
                    />
                  </label>
                </div>

                {excelStatus && (
                  <div
                    className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                      excelStatus.includes("thành công")
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <span>{excelStatus}</span>
                  </div>
                )}

                <textarea
                  rows={6}
                  placeholder={`Nguyễn Văn An\nTrần Thị Bích\nLê Hoàng Nam\nPhạm Minh Châu`}
                  value={studentsRaw}
                  onChange={(e) => setStudentsRaw(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Tổng cộng:{" "}
                    <strong className="text-foreground">
                      {studentsRaw
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean).length}
                    </strong>{" "}
                    học sinh
                  </span>
                  <span>Tự động nhận diện cột họ tên từ VnEdu, SMAS</span>
                </div>
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
                  {saving ? "Đang lưu..." : editingClassId ? "Lưu thay đổi lớp" : "Lưu vào Supabase"}
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
                <p className="text-xs text-muted-foreground">
                  Tổng số: {selectedClass.students?.length || 0} học sinh
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cls = selectedClass;
                    setSelectedClass(null);
                    handleEditClass(cls);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Mở bảng sửa thông tin và danh sách lớp"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa lớp</span>
                </button>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {selectedClass.students && selectedClass.students.length > 0 ? (
                selectedClass.students.map((sName: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs group hover:bg-muted/70 transition-colors"
                  >
                    <span className="w-6 font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="flex-1 font-semibold text-foreground">{sName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudentFromClass(sName)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Xóa học sinh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Lớp chưa có học sinh nào. Thầy/Cô có thể thêm nhanh bên dưới.
                </div>
              )}
            </div>

            {/* Quick Add Student Input */}
            <form
              onSubmit={handleQuickAddStudent}
              className="pt-3 border-t border-border flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Thêm nhanh tên 1 học sinh..."
                value={quickStudentName}
                onChange={(e) => setQuickStudentName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!quickStudentName.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shrink-0 transition-colors"
              >
                + Thêm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

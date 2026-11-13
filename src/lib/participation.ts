import {
  ActivityCategory,
  ClassGroup,
  ClassRoom,
  ParticipationConfig,
  ParticipationLog,
} from "./types";

export const DEFAULT_PARTICIPATION_CONFIG: ParticipationConfig = {
  starsPerPointRatio: 0.25,     // 1 Sao = +0.25 điểm cộng ĐGTX
  maxBonusPerExam: 2.0,         // Cộng tối đa +2.0 điểm vào mỗi bài kiểm tra thường xuyên (trần 10.0)
  standaloneColumnStars: 20,    // Đủ 20 Sao = quy đổi thành 1 cột điểm 10.0 ĐGTX độc lập
  targetExamId: "auto",         // "auto" = tự động cộng vào bài gần nhất và bảo lưu phần dư sang bài kế tiếp
  speechDefaultStars: 1,        // Phát biểu cá nhân: +1 Sao
  groupWorkDefaultStars: 1,     // Thảo luận / Làm nhóm: +1 Sao cho cả nhóm
  presentationMemberStars: 1,   // Trình bày nhóm (Thành viên): +1 Sao
  presentationSpeakerStars: 2,  // Trình bày nhóm (Người thuyết trình chính): +2 Sao
};

export const GROUP_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
];

export function normalizeStudentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getEffectiveConfig(cls?: ClassRoom | null): ParticipationConfig {
  return {
    ...DEFAULT_PARTICIPATION_CONFIG,
    ...(cls?.participationConfig || {}),
  };
}

/**
 * Chia danh sách học sinh thành `groupCount` Tổ/Nhóm đều nhau (theo thứ tự hoặc ngẫu nhiên).
 */
export function generateBalancedGroups(
  students: string[],
  groupCount: number = 4,
  shuffle: boolean = false
): ClassGroup[] {
  const clean = students.map((s) => s.trim()).filter(Boolean);
  const k = Math.max(1, Math.min(groupCount, Math.max(1, clean.length)));
  const pool = [...clean];

  if (shuffle) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
  }

  const groups: ClassGroup[] = Array.from({ length: k }, (_, idx) => ({
    id: `grp-${idx + 1}-${Date.now().toString(36)}`,
    name: `Nhóm ${idx + 1}`,
    color: GROUP_COLORS[idx % GROUP_COLORS.length],
    leader: undefined,
    members: [],
  }));

  pool.forEach((student, i) => {
    const g = groups[i % k];
    g.members.push(student);
    if (!g.leader) g.leader = student;
  });

  return groups;
}

export interface StudentParticipationBreakdown {
  studentName: string;
  groupName?: string;
  speechStars: number;
  groupWorkStars: number;
  presentationStars: number;
  otherStars: number;
  totalStars: number;
  totalBonusPoints: number; // totalStars * starsPerPointRatio
  standaloneScore10: number; // min(10, (totalStars / standaloneColumnStars) * 10)
}

export function computeStudentParticipation(
  studentName: string,
  logs: ParticipationLog[],
  groups: ClassGroup[],
  config: ParticipationConfig
): StudentParticipationBreakdown {
  const norm = normalizeStudentName(studentName);
  const myLogs = logs.filter((l) => normalizeStudentName(l.studentName) === norm);

  let speechStars = 0;
  let groupWorkStars = 0;
  let presentationStars = 0;
  let otherStars = 0;

  for (const log of myLogs) {
    const s = Number(log.stars) || 0;
    if (log.category === "speech") speechStars += s;
    else if (log.category === "group_work") groupWorkStars += s;
    else if (log.category === "presentation") presentationStars += s;
    else otherStars += s;
  }

  const totalStars = Math.max(0, speechStars + groupWorkStars + presentationStars + otherStars);
  const ratio = Number(config.starsPerPointRatio) > 0 ? Number(config.starsPerPointRatio) : 0.25;
  const totalBonusPoints = Number((totalStars * ratio).toFixed(2));

  const targetStars = Math.max(1, Number(config.standaloneColumnStars) || 20);
  const standaloneScore10 = Number(Math.min(10, (totalStars / targetStars) * 10).toFixed(2));

  const group = groups.find((g) => g.members.some((m) => normalizeStudentName(m) === norm));

  return {
    studentName,
    groupName: group?.name,
    speechStars,
    groupWorkStars,
    presentationStars,
    otherStars,
    totalStars,
    totalBonusPoints,
    standaloneScore10,
  };
}

export interface ExamScoreAdjustment {
  examId: string;
  rawScore: number | null;
  bonusApplied: number;
  finalScore: number | null;
}

export interface StudentGradebookRowResult {
  breakdown: StudentParticipationBreakdown;
  examAdjustments: Record<string, ExamScoreAdjustment>;
  totalBonusApplied: number;
  remainingBankedBonus: number;
  rawAvgScore: number | null;
  finalAvgScore: number | null;
}

/**
 * Phân bổ quỹ Điểm cộng (totalBonusPoints) vào các Bài kiểm tra thường xuyên của học sinh:
 * - Nếu `config.targetExamId` là một mã đề cụ thể: ưu tiên cộng tối đa vào bài đó trước,
 *   nếu còn dư và các bài khác còn chỗ trống (< 10.0) thì tự động bảo lưu/chuyển tiếp.
 * - Nếu `config.targetExamId === "auto"` (mặc định): cộng tuần tự vào các bài kiểm tra học sinh đã làm,
 *   khống chế mỗi bài tăng tối đa `config.maxBonusPerExam` và tổng điểm sau cộng không vượt quá `10.0`.
 * - Phần điểm cộng chưa dùng hết được giữ lại trong `remainingBankedBonus` (Bảo lưu sang bài kiểm tra sau).
 */
export function applyBonusToStudentExams(
  studentName: string,
  examIds: string[],
  rawScoresByExam: Record<string, number | null>,
  logs: ParticipationLog[],
  groups: ClassGroup[],
  config: ParticipationConfig
): StudentGradebookRowResult {
  const breakdown = computeStudentParticipation(studentName, logs, groups, config);
  const maxPerExam = Math.max(0, Number(config.maxBonusPerExam) || 2.0);
  let availableBonus = breakdown.totalBonusPoints;

  const examAdjustments: Record<string, ExamScoreAdjustment> = {};
  for (const examId of examIds) {
    const raw = rawScoresByExam[examId] ?? null;
    examAdjustments[examId] = {
      examId,
      rawScore: raw,
      bonusApplied: 0,
      finalScore: raw,
    };
  }

  // Order exams so targetExamId (if specified) receives bonus first, then remaining exams in order
  const orderedExamIds = [...examIds];
  if (config.targetExamId && config.targetExamId !== "auto" && orderedExamIds.includes(config.targetExamId)) {
    orderedExamIds.sort((a, b) => (a === config.targetExamId ? -1 : b === config.targetExamId ? 1 : 0));
  }

  for (const examId of orderedExamIds) {
    const adj = examAdjustments[examId];
    if (!adj || adj.rawScore === null || availableBonus <= 0) continue;

    const roomToTen = Math.max(0, 10 - adj.rawScore);
    const maxAllowedHere = Math.min(roomToTen, maxPerExam);
    const applied = Number(Math.min(availableBonus, maxAllowedHere).toFixed(2));

    if (applied > 0) {
      adj.bonusApplied = applied;
      adj.finalScore = Number((adj.rawScore + applied).toFixed(2));
      availableBonus = Number(Math.max(0, availableBonus - applied).toFixed(2));
    }
  }

  const totalBonusApplied = Number((breakdown.totalBonusPoints - availableBonus).toFixed(2));
  const remainingBankedBonus = Number(availableBonus.toFixed(2));

  // Compute raw average & final average across taken exams
  let rawSum = 0;
  let finalSum = 0;
  let takenCount = 0;

  for (const examId of examIds) {
    const adj = examAdjustments[examId];
    if (adj && adj.rawScore !== null && adj.finalScore !== null) {
      rawSum += adj.rawScore;
      finalSum += adj.finalScore;
      takenCount++;
    }
  }

  const rawAvgScore = takenCount > 0 ? Number((rawSum / takenCount).toFixed(2)) : null;
  const finalAvgScore = takenCount > 0 ? Number((finalSum / takenCount).toFixed(2)) : null;

  return {
    breakdown,
    examAdjustments,
    totalBonusApplied,
    remainingBankedBonus,
    rawAvgScore,
    finalAvgScore,
  };
}

export function getCategoryLabel(cat: ActivityCategory): string {
  switch (cat) {
    case "speech":
      return "Phát biểu cá nhân";
    case "group_work":
      return "Thảo luận / Làm nhóm";
    case "presentation":
      return "Trình bày nhóm";
    default:
      return "Điểm thưởng khác";
  }
}

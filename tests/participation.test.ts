import test from "node:test";
import assert from "node:assert/strict";
import {
  applyBonusToStudentExams,
  computeStudentParticipation,
  DEFAULT_PARTICIPATION_CONFIG,
  generateBalancedGroups,
} from "../src/lib/participation";
import { ParticipationLog } from "../src/lib/types";

test("participation: generateBalancedGroups splits students evenly into N groups", () => {
  const students = ["An", "Bình", "Châu", "Dũng", "Em", "Giang", "Hà", "Hải"];
  const groups = generateBalancedGroups(students, 4, false);
  assert.equal(groups.length, 4);
  assert.equal(groups[0].members.length, 2);
  assert.equal(groups[3].members.length, 2);
  assert.equal(groups[0].leader, "An");
});

test("participation: computeStudentParticipation sums speech, group_work and presentation stars and converts to bonus points", () => {
  const groups = generateBalancedGroups(["Nguyễn Văn An", "Trần Thị Bích"], 2, false);
  const logs: ParticipationLog[] = [
    {
      id: "l1",
      classId: "c1",
      studentName: "Nguyễn Văn An",
      category: "speech",
      stars: 2,
      createdAt: "2026-01-01",
    },
    {
      id: "l2",
      classId: "c1",
      studentName: "nguyễn văn an",
      category: "group_work",
      stars: 1,
      groupName: "Nhóm 1",
      createdAt: "2026-01-01",
    },
    {
      id: "l3",
      classId: "c1",
      studentName: "Nguyễn Văn An",
      category: "presentation",
      stars: 2,
      isPresenter: true,
      createdAt: "2026-01-01",
    },
  ];

  const bd = computeStudentParticipation(
    "Nguyễn Văn An",
    logs,
    groups,
    DEFAULT_PARTICIPATION_CONFIG
  );

  assert.equal(bd.speechStars, 2);
  assert.equal(bd.groupWorkStars, 1);
  assert.equal(bd.presentationStars, 2);
  assert.equal(bd.totalStars, 5);
  assert.equal(bd.totalBonusPoints, 1.25); // 5 * 0.25 = 1.25
  assert.equal(bd.standaloneScore10, 2.5); // (5 / 20) * 10 = 2.5
  assert.equal(bd.groupName, "Nhóm 1");
});

test("participation: applyBonusToStudentExams caps exam score at 10.0, respects maxBonusPerExam, and rolls over remainder to next exam / bank", () => {
  const logs: ParticipationLog[] = [
    {
      id: "l1",
      classId: "c1",
      studentName: "Lê Hoàng Nam",
      category: "speech",
      stars: 12, // 12 * 0.25 = +3.0 bonus points
      createdAt: "2026-01-01",
    },
  ];

  // Exam 1 raw = 9.0 -> can only take +1.0 (to hit 10.0 cap)
  // Exam 2 raw = 7.0 -> can take up to maxBonusPerExam (2.0), remaining bonus is 2.0 -> becomes 9.0
  const result = applyBonusToStudentExams(
    "Lê Hoàng Nam",
    ["ex1", "ex2"],
    { ex1: 9.0, ex2: 7.0 },
    logs,
    [],
    {
      ...DEFAULT_PARTICIPATION_CONFIG,
      starsPerPointRatio: 0.25,
      maxBonusPerExam: 1.5, // max +1.5 per exam
    }
  );

  // Total bonus = 3.0
  // ex1: 9.0 + 1.0 = 10.0 (used 1.0, remaining 2.0)
  // ex2: 7.0 + 1.5 (capped by maxBonusPerExam=1.5) = 8.5 (used 1.5, remaining 0.5 banked!)
  assert.equal(result.examAdjustments.ex1.bonusApplied, 1.0);
  assert.equal(result.examAdjustments.ex1.finalScore, 10.0);
  assert.equal(result.examAdjustments.ex2.bonusApplied, 1.5);
  assert.equal(result.examAdjustments.ex2.finalScore, 8.5);
  assert.equal(result.totalBonusApplied, 2.5);
  assert.equal(result.remainingBankedBonus, 0.5);
  assert.equal(result.rawAvgScore, 8.0);
  assert.equal(result.finalAvgScore, 9.25);
});

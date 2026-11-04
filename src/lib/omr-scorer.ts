import { matchShort } from "./grader";

export interface OmrPart1Item {
  choice: "A" | "B" | "C" | "D" | "";
  key: "A" | "B" | "C" | "D";
  isCorrect: boolean;
}

export interface OmrPart2Item {
  choices: Record<"a" | "b" | "c" | "d", boolean | null>;
  keys: Record<"a" | "b" | "c" | "d", boolean>;
  correctCount: number;
  points: number;
}

export interface OmrPart3Item {
  studentAns: string;
  key: string;
  isCorrect: boolean;
}

export interface OmrSheetResult {
  studentName: string;
  studentClass: string;
  sbd: string;
  examCode: string;
  totalScore: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  part1Answers: Record<number, OmrPart1Item>;
  part2Answers: Record<number, OmrPart2Item>;
  part3Answers: Record<number, OmrPart3Item>;
}

const BGD_TF_POINTS = [0, 0.1, 0.25, 0.5, 1.0];

/**
 * Recomputes Part I, Part II (BGD 2025 partial credit ladder), Part III, and total score
 * whenever the teacher edits a bubble, SBD, or answer key on the OMR verification screen.
 */
export function recomputeOmrSheet(sheet: OmrSheetResult): OmrSheetResult {
  let p1Score = 0;
  const nextP1: Record<number, OmrPart1Item> = {};
  for (const [k, item] of Object.entries(sheet.part1Answers)) {
    const isCorrect = item.choice !== "" && item.choice === item.key;
    if (isCorrect) p1Score += 0.25;
    nextP1[Number(k)] = { ...item, isCorrect };
  }

  let p2Score = 0;
  const nextP2: Record<number, OmrPart2Item> = {};
  for (const [k, item] of Object.entries(sheet.part2Answers)) {
    let correctCount = 0;
    (["a", "b", "c", "d"] as const).forEach((sub) => {
      if (item.choices[sub] !== null && item.choices[sub] === item.keys[sub]) {
        correctCount++;
      }
    });
    const points = BGD_TF_POINTS[Math.min(4, Math.max(0, correctCount))];
    p2Score += points;
    nextP2[Number(k)] = { ...item, correctCount, points };
  }

  let p3Score = 0;
  const nextP3: Record<number, OmrPart3Item> = {};
  for (const [k, item] of Object.entries(sheet.part3Answers)) {
    const isCorrect = matchShort(item.studentAns, [item.key]);
    if (isCorrect) p3Score += 0.5;
    nextP3[Number(k)] = { ...item, isCorrect };
  }

  const part1Score = Math.round(p1Score * 100) / 100;
  const part2Score = Math.round(p2Score * 100) / 100;
  const part3Score = Math.round(p3Score * 100) / 100;
  const totalScore = Math.min(10, Math.round((part1Score + part2Score + part3Score) * 100) / 100);

  return {
    ...sheet,
    part1Score,
    part2Score,
    part3Score,
    totalScore,
    part1Answers: nextP1,
    part2Answers: nextP2,
    part3Answers: nextP3,
  };
}

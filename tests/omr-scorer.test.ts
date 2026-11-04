import test from "node:test";
import assert from "node:assert/strict";
import { recomputeOmrSheet, OmrSheetResult } from "../src/lib/omr-scorer";

test("omr-scorer: recomputeOmrSheet calculates BGD 2025 Part I, II, III and totalScore accurately", () => {
  const initial: OmrSheetResult = {
    studentName: "Nguyễn Văn A",
    studentClass: "12A1",
    sbd: "123456",
    examCode: "101",
    totalScore: 0,
    part1Score: 0,
    part2Score: 0,
    part3Score: 0,
    part1Answers: {
      1: { choice: "A", key: "A", isCorrect: false },
      2: { choice: "C", key: "B", isCorrect: false },
    },
    part2Answers: {
      // 3/4 sub-items correct -> 0.5đ
      1: {
        choices: { a: true, b: false, c: true, d: true },
        keys: { a: true, b: false, c: true, d: false },
        correctCount: 0,
        points: 0,
      },
      // 4/4 sub-items correct -> 1.0đ
      2: {
        choices: { a: true, b: true, c: false, d: false },
        keys: { a: true, b: true, c: false, d: false },
        correctCount: 0,
        points: 0,
      },
    },
    part3Answers: {
      // comma vs dot numeric match -> 0.5đ
      1: { studentAns: "4,9", key: "4.9", isCorrect: false },
      2: { studentAns: "10", key: "12", isCorrect: false },
    },
  };

  const computed = recomputeOmrSheet(initial);
  assert.equal(computed.part1Score, 0.25);
  assert.equal(computed.part1Answers[1].isCorrect, true);
  assert.equal(computed.part1Answers[2].isCorrect, false);

  assert.equal(computed.part2Answers[1].correctCount, 3);
  assert.equal(computed.part2Answers[1].points, 0.5);
  assert.equal(computed.part2Answers[2].correctCount, 4);
  assert.equal(computed.part2Answers[2].points, 1.0);
  assert.equal(computed.part2Score, 1.5);

  assert.equal(computed.part3Answers[1].isCorrect, true);
  assert.equal(computed.part3Answers[2].isCorrect, false);
  assert.equal(computed.part3Score, 0.5);

  assert.equal(computed.totalScore, 2.25);

  // Teacher edits Question 2 in Part I from C -> B and Question 1d in Part II from true -> false
  computed.part1Answers[2].choice = "B";
  computed.part2Answers[1].choices.d = false;
  const afterEdit = recomputeOmrSheet(computed);

  assert.equal(afterEdit.part1Score, 0.5);
  assert.equal(afterEdit.part2Score, 2.0);
  assert.equal(afterEdit.totalScore, 3.0);
});

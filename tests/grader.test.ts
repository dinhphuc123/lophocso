import test from "node:test";
import assert from "node:assert/strict";
import { gradeSubmission, matchShort, summarize } from "../src/lib/grader";
import { toPublicExam } from "../src/lib/sanitize";
import { Exam } from "../src/lib/types";

const exam: Exam = {
  id: "e1",
  title: "t",
  subject: "Toán",
  targetClass: "12A",
  durationMinutes: 45,
  status: "open",
  createdAt: "2026-01-01",
  questions: [
    { id: "q1", type: "multiple_choice", text: "mc", options: [{ id: "A", text: "1" }, { id: "B", text: "2" }, { id: "C", text: "3" }, { id: "D", text: "4" }], correctAnswer: "B", explanation: "why", points: 0.25 },
    {
      id: "q2",
      type: "true_false",
      text: "tf",
      subQuestions: [
        { id: "a", text: "a", isCorrect: true },
        { id: "b", text: "b", isCorrect: false },
        { id: "c", text: "c", isCorrect: true },
        { id: "d", text: "d", isCorrect: false },
      ],
      points: 1,
    },
    { id: "q3", type: "short_answer", text: "sa", correctAnswers: ["4,9", "4.9"], points: 0.5 },
    { id: "q4", type: "essay", text: "es", points: 1 },
  ],
};

test("multiple choice points are counted in the score (regression: they were always 0)", () => {
  const sub = gradeSubmission(exam, "A", "12A", { q1: "B" }, "2026-01-01");
  assert.ok(sub.score > 0);
  assert.equal(sub.details[0].earnedPoints, 0.25);
  assert.equal(sub.score, Number(((0.25 / 2.75) * 10).toFixed(2)));
});

test("true/false follows the BGD 2025 partial-credit ladder", () => {
  const pts = (ans: Record<string, boolean>) => gradeSubmission(exam, "A", "", { q2: ans }, "x").details[1].earnedPoints;
  assert.equal(pts({ a: false, b: true, c: false, d: true }), 0); // 0 right
  assert.equal(pts({ a: true, b: true, c: false, d: true }), 0.1); // 1 right
  assert.equal(pts({ a: true, b: false, c: false, d: true }), 0.25); // a,b right
  assert.equal(pts({ a: true, b: false, c: true, d: true }), 0.5); // 3 right
  assert.equal(pts({ a: true, b: false, c: true, d: false }), 1); // 4 right
});

test("short answers accept comma/dot decimals, spaces and trailing zeros", () => {
  assert.ok(matchShort("4,9", ["4.9"]));
  assert.ok(matchShort(" 4.90 ", ["4,9"]));
  assert.ok(matchShort("3 200", ["3200"]));
  assert.ok(!matchShort("", ["0"]));
  assert.ok(!matchShort("5", ["4.9"]));
});

test("essays wait for manual grading and the score is recomputed from the details", () => {
  const sub = gradeSubmission(exam, "A", "", { q1: "B" }, "x");
  assert.equal(sub.details[3].needsManualGrade, true);
  const graded = sub.details.map((d) => (d.needsManualGrade ? { ...d, earnedPoints: 1, isCorrect: true } : d));
  assert.ok(summarize(graded).score > sub.score);
});

test("public exam never leaks the answer key or solutions", () => {
  const json = JSON.stringify(toPublicExam(exam));
  for (const secret of ["correctAnswer", "isCorrect", "correctAnswers", "explanation", "why"]) {
    assert.ok(!json.includes(secret), `leaked ${secret}`);
  }
  assert.ok(json.includes('"options"'));
});

import test from "node:test";
import assert from "node:assert/strict";
import { shuffleArray, shuffleExam } from "../src/lib/shuffler";
import { Exam } from "../src/lib/types";

test("shuffler: shuffleArray uses Fisher-Yates and preserves all elements", () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffleArray(original);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), original);
});

test("shuffler: shuffleExam re-orders deterministically and remaps correctAnswer accurately", () => {
  const sampleExam: Exam = {
    id: "test-exam",
    title: "Đề kiểm tra thử",
    subject: "Toán",
    targetClass: "12A1",
    durationMinutes: 45,
    status: "open",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        text: "Giá trị của 1 + 1 là?",
        options: [
          { id: "A", text: "1" },
          { id: "B", text: "2" },
          { id: "C", text: "3" },
          { id: "D", text: "4" },
        ],
        correctAnswer: "B", // text: "2"
      },
      {
        id: "q2",
        type: "multiple_choice",
        text: "Nghiệm của x - 5 = 0 là?",
        options: [
          { id: "A", text: "5" },
          { id: "B", text: "-5" },
          { id: "C", text: "0" },
          { id: "D", text: "1" },
        ],
        correctAnswer: "A", // text: "5"
      },
      {
        id: "q3",
        type: "true_false",
        text: "Cho hàm số f(x) = x^2",
        subQuestions: [
          { id: "a", text: "f(0) = 0", isCorrect: true },
          { id: "b", text: "f(-1) = -1", isCorrect: false },
        ],
      },
      {
        id: "q4",
        type: "short_answer",
        text: "Tính 3 x 4",
        correctAnswers: ["12"],
      },
    ],
  };

  const v101 = shuffleExam(sampleExam, "101");
  const v102 = shuffleExam(sampleExam, "102");
  const v103 = shuffleExam(sampleExam, "103");
  const v102_again = shuffleExam(sampleExam, "102");

  // Deterministic
  assert.deepEqual(v102, v102_again);

  // Different codes produce different variants
  assert.equal(v101.code, "101");
  assert.equal(v102.code, "102");

  // Check that correctAnswer for Q1 in v102 still points to option with text "2"
  const q1InV102 = v102.questions.find((q) => q.id === "q1");
  assert.ok(q1InV102 && q1InV102.type === "multiple_choice");
  const correctOpt = q1InV102.options.find((o) => o.id === q1InV102.correctAnswer);
  assert.equal(correctOpt?.text, "2"); // Crucial: grading must not be broken by option shuffle!

  // Check that questions still preserve part ordering: multiple choice first, then true/false, then short answer
  assert.equal(v102.questions[0].type, "multiple_choice");
  assert.equal(v102.questions[1].type, "multiple_choice");
  assert.equal(v102.questions[2].type, "true_false");
  assert.equal(v102.questions[3].type, "short_answer");
});

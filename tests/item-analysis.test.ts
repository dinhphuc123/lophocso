import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeExamQuestions,
  distributeExamPoints,
  auditExamQuestions,
} from "../src/lib/item-analysis";
import { Exam, StudentSubmission } from "../src/lib/types";

const sampleExam: Exam = {
  id: "ex-1",
  title: "Đề Toán 12",
  subject: "Toán",
  targetClass: "12A1",
  durationMinutes: 45,
  status: "open",
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      text: "Đạo hàm của x^2 là:",
      options: [
        { id: "A", text: "2x" },
        { id: "B", text: "x" },
        { id: "C", text: "2" },
        { id: "D", text: "x^3" },
      ],
      correctAnswer: "A",
      points: 0.25,
    },
    {
      id: "q2",
      type: "true_false",
      text: "Xét hàm số y = sin x:",
      subQuestions: [
        { id: "a", text: "Tập xác định R", isCorrect: true },
        { id: "b", text: "Chu kỳ 2pi", isCorrect: true },
        { id: "c", text: "Hàm chẵn", isCorrect: false },
        { id: "d", text: "Đạo hàm là cos x", isCorrect: true },
      ],
      points: 1.0,
    },
    {
      id: "q3",
      type: "short_answer",
      text: "Tính 2 + 3",
      correctAnswers: ["5"],
      points: 0.5,
    },
  ],
};

test("item-analysis: computes per-question accuracy and option distribution", () => {
  const subs: StudentSubmission[] = [
    {
      id: "s1",
      examId: "ex-1",
      studentName: "An",
      studentClass: "12A1",
      startedAt: "",
      submittedAt: "",
      score: 10,
      totalScore: 10,
      correctCount: 3,
      totalQuestions: 3,
      answers: {},
      details: [
        { questionId: "q1", isCorrect: true, userAnswer: "A", correctAnswer: "A", earnedPoints: 0.25, maxPoints: 0.25 },
        { questionId: "q2", isCorrect: true, userAnswer: {}, correctAnswer: {}, earnedPoints: 1.0, maxPoints: 1.0 },
        { questionId: "q3", isCorrect: false, userAnswer: "4", correctAnswer: "5", earnedPoints: 0, maxPoints: 0.5 },
      ],
    },
    {
      id: "s2",
      examId: "ex-1",
      studentName: "Bình",
      studentClass: "12A1",
      startedAt: "",
      submittedAt: "",
      score: 5,
      totalScore: 10,
      correctCount: 1,
      totalQuestions: 3,
      answers: {},
      details: [
        { questionId: "q1", isCorrect: true, userAnswer: "A", correctAnswer: "A", earnedPoints: 0.25, maxPoints: 0.25 },
        { questionId: "q2", isCorrect: false, userAnswer: {}, correctAnswer: {}, earnedPoints: 0.5, maxPoints: 1.0 },
        { questionId: "q3", isCorrect: false, userAnswer: "6", correctAnswer: "5", earnedPoints: 0, maxPoints: 0.5 },
      ],
    },
  ];

  const items = analyzeExamQuestions(sampleExam, subs);
  assert.equal(items.length, 3);
  assert.equal(items[0].correctRate, 100);
  assert.equal(items[0].difficultyTag, "Dễ");
  assert.deepEqual(items[0].optionDistribution, { A: 2, B: 0, C: 0, D: 0 });

  assert.equal(items[1].correctRate, 50);
  assert.equal(items[1].avgEarnedPoints, 0.75);
  assert.equal(items[1].difficultyTag, "Vừa sức");

  assert.equal(items[2].correctRate, 0);
  assert.equal(items[2].difficultyTag, "Rất khó");
});

test("item-analysis: distributeExamPoints and auditExamQuestions work accurately", () => {
  const eq = distributeExamPoints(sampleExam.questions, "equal10");
  const sumEq = Number(eq.reduce((a, q) => a + (q.points || 0), 0).toFixed(2));
  assert.equal(sumEq, 10);

  const bgd = distributeExamPoints(sampleExam.questions, "bgd2025");
  assert.equal(bgd[0].points, 0.25);
  assert.equal(bgd[1].points, 1.0);
  assert.equal(bgd[2].points, 0.5);

  assert.equal(auditExamQuestions(sampleExam.questions).length, 0);

  const broken = [
    {
      ...sampleExam.questions[0],
      answerUnknown: true,
    },
  ];
  const issues = auditExamQuestions(broken);
  assert.equal(issues.length, 1);
  assert.ok(issues[0].message.includes("Chưa xác định đáp án đúng"));
});

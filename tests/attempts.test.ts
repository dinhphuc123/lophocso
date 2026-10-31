import test from "node:test";
import assert from "node:assert/strict";
import { startAttempt, recordHeartbeat, getActiveAttempts, saveSubmission } from "../src/lib/db";
import { StudentSubmission } from "../src/lib/types";

test("attempts: starts an attempt and lists in getActiveAttempts", () => {
  const examId = `exam-test-${Date.now()}`;
  const studentName = "Nguyễn Văn Online";
  const studentClass = "12A1";

  const res = startAttempt(examId, studentName, studentClass);
  assert.ok("attempt" in res);
  assert.equal(res.attempt.studentName, studentName);
  assert.equal(res.attempt.submitted, false);

  const activeList = getActiveAttempts(examId);
  assert.ok(activeList.some((a) => a.studentName === studentName));
});

test("attempts: updates heartbeat and answered count", () => {
  const examId = `exam-test-${Date.now()}`;
  const studentName = "Trần Thị Trắc Nghiệm";
  const studentClass = "12A2";

  startAttempt(examId, studentName, studentClass);
  const updated = recordHeartbeat(examId, studentName, studentClass, 5, 20);

  assert.ok(updated);
  assert.equal(updated.answeredCount, 5);
  assert.equal(updated.totalQuestions, 20);
  assert.ok(updated.lastActiveAt);

  const active = getActiveAttempts(examId).find((a) => a.studentName === studentName);
  assert.ok(active);
  assert.equal(active.answeredCount, 5);
});

test("attempts: removes from active attempts once submitted", () => {
  const examId = `exam-test-${Date.now()}`;
  const studentName = "Lê Hoàn Thành";
  const studentClass = "12A3";

  startAttempt(examId, studentName, studentClass);
  assert.ok(getActiveAttempts(examId).some((a) => a.studentName === studentName));

  const sub: StudentSubmission = {
    id: `sub-${Date.now()}`,
    examId,
    studentName,
    studentClass,
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    score: 9.0,
    totalScore: 10,
    correctCount: 18,
    totalQuestions: 20,
    answers: {},
    details: [],
  };

  saveSubmission(sub);
  const activeAfter = getActiveAttempts(examId);
  assert.equal(activeAfter.some((a) => a.studentName === studentName), false);
});

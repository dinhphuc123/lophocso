import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseExamText } from "../src/lib/parser";
import { parseDocxBuffer } from "../src/lib/docx-parser";

test("multiple choice: underline wins; no key at all is flagged answerUnknown", () => {
  const [known, unknown] = parseExamText(
    "Câu 1. [NB] Hai cộng hai?\n<u>A</u>. 4 B. 5 C. 6 D. 7\nCâu 2. [NB] Ba cộng ba?\nA. 5 B. 6 C. 7 D. 8"
  );
  assert.equal(known.type === "multiple_choice" && known.correctAnswer, "A");
  assert.ok(known.type === "multiple_choice" && !known.answerUnknown);
  assert.ok(unknown.type === "multiple_choice" && unknown.answerUnknown === true);
});

test("short answer, true/false and essay are recognised with levels", () => {
  const qs = parseExamText(
    "Câu 1. [TH] Tính 2+2. Trả lời: [[4||4.0]]\nCâu 2. [TF] Xét các mệnh đề\na) [NB]#đúng (Đúng)\nb) [NB]#sai\nc) [TH]#sai\nd) [TH]#đúng (Đúng)\nCâu 3. [TL][VD] Chứng minh."
  );
  assert.deepEqual(qs.map((q) => q.type), ["short_answer", "true_false", "essay"]);
  const tf = qs[1];
  assert.ok(tf.type === "true_false");
  assert.deepEqual(tf.subQuestions.map((s) => s.isCorrect), [true, false, false, true]);
});

test("real exam file: 22 questions, 6 figures attached, formulas keep exponents", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dethiso-"));
  const buf = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "de-mau-7991.docx"));
  const res = await parseDocxBuffer(buf, { uploadDir: dir });

  assert.equal(res.questions.length, 22);
  assert.equal(res.imageCount, 6); // the 7th image is the logo in the instructions, not a question figure
  assert.equal(fs.readdirSync(dir).length, 6, "unused logo must not stay on disk");
  assert.ok(res.questions.filter((q) => q.imageUrl).every((q) => q.imageUrl!.startsWith("/uploads/img_")));

  // first question: underlined B, fractions converted
  const q1 = res.questions[0];
  assert.ok(q1.type === "multiple_choice");
  assert.equal(q1.correctAnswer, "B");
  assert.ok(!q1.answerUnknown);
  assert.match(q1.text, /\\frac\{ax\+b\}\{cx\+d\}/);

  // Câu 2 integral: squared function must keep its exponent
  const q2 = res.questions[1];
  assert.ok(q2.type === "multiple_choice");
  assert.ok(q2.options.some((o) => /\\pi.*\\int_\{a\}\^\{b\}.*\^\{2\}/.test(o.text)), JSON.stringify(q2.options));

  const unknownAnswers = res.questions.filter((q) => q.type === "multiple_choice" && q.answerUnknown);
  assert.equal(unknownAnswers.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("parseDocxBuffer without uploadDir produces base64 data URIs for serverless compatibility", async () => {
  const buf = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "de-mau-7991.docx"));
  const res = await parseDocxBuffer(buf);

  assert.equal(res.questions.length, 22);
  assert.equal(res.imageCount, 6);
  assert.ok(res.questions.filter((q) => q.imageUrl).every((q) => q.imageUrl!.startsWith("data:image/")));
});

test("grouped frequency table exam (Bai 9 Toan 12): 24 questions (12 MC, 4 TF, 6 SA, 2 Essay) & 19 Markdown tables", async () => {
  const buf = fs.readFileSync(path.join(import.meta.dirname, "fixtures", "de-thong-ke-bai9.docx"));
  const res = await parseDocxBuffer(buf);

  assert.equal(res.questions.length, 24);
  assert.equal(res.tableCount, 19);

  const mc = res.questions.filter((q) => q.type === "multiple_choice");
  const tf = res.questions.filter((q) => q.type === "true_false");
  const sa = res.questions.filter((q) => q.type === "short_answer");
  const es = res.questions.filter((q) => q.type === "essay");

  assert.equal(mc.length, 12);
  assert.equal(tf.length, 4);
  assert.equal(sa.length, 6);
  assert.equal(es.length, 2);

  // Verify all 12 MC questions have 4 options and known answers matching the official key
  const expectedMcAnswers = ["A", "C", "B", "D", "A", "D", "B", "C", "D", "B", "A", "C"];
  assert.deepEqual(
    mc.map((q) => q.correctAnswer),
    expectedMcAnswers
  );
  assert.ok(mc.every((q) => q.options.length === 4 && !q.answerUnknown));

  // Verify Câu 3 (index 2) has a Markdown pipe table and glued options A. 60.B. 75.C. 15.D. 45. properly split
  assert.match(mc[2].text, /\| Thời gian \(phút\) \|/);
  assert.equal(mc[2].options.length, 4);

  // Verify all 4 TF questions have 4 subQuestions and exact True/False key
  const expectedTfAnswers = [
    [true, false, true, false],
    [false, true, true, false],
    [true, true, false, true],
    [false, true, false, true],
  ];
  assert.deepEqual(
    tf.map((q) => q.subQuestions.map((s) => s.isCorrect)),
    expectedTfAnswers
  );

  // Verify Short Answer keys
  assert.deepEqual(sa[0].correctAnswers, ["1,79", "1.79"]);
  assert.deepEqual(sa[1].correctAnswers, ["16"]);

  // Verify Essay Câu 8 does not contain the trailing PHỤ LỤC section
  assert.ok(es[1].explanation && !/PHỤ LỤC/i.test(es[1].explanation));
  assert.ok(!/PHẦN\s+(?:II|III|IV)/i.test(mc[11].explanation || ""));
});

import { Exam, QuestionOption } from "./types";

/** Seeded PRNG for deterministic, reproducible shuffling without dependencies */
function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Standard Fisher-Yates array shuffle (~10 lines) */
export function shuffleArray<T>(array: readonly T[], random: () => number = Math.random): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Shuffles an exam deterministically by code (e.g. "101", "102", "103", "104").
 * - Preserves question parts (Multiple Choice -> True/False -> Short Answer -> Essay).
 * - Shuffles options A, B, C, D and remaps correctAnswer so grading remains 100% accurate.
 */
export function shuffleExam(exam: Exam, code: string = "101"): Exam {
  if (code === "101" || !code) return { ...exam, code: "101" };
  const numCode = parseInt(code, 10) || 101;
  const rand = prng(numCode);

  const mc = exam.questions.filter((q) => q.type === "multiple_choice");
  const tf = exam.questions.filter((q) => q.type === "true_false");
  const sa = exam.questions.filter((q) => q.type === "short_answer");
  const es = exam.questions.filter((q) => q.type === "essay");

  const shuffledMc = shuffleArray(mc, rand).map((q) => {
    if (q.type !== "multiple_choice") return q;
    const shuffledOpts = shuffleArray(q.options, rand);
    const labels = ["A", "B", "C", "D"] as const;
    const newOptions: QuestionOption[] = shuffledOpts.map((opt, i) => ({
      id: labels[i] || "A",
      text: opt.text,
    }));
    const originalCorrectText = q.options.find((o) => o.id === q.correctAnswer)?.text;
    const newCorrect = newOptions.find((o) => o.text === originalCorrectText)?.id || "A";

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrect,
    };
  });

  const shuffledTf = shuffleArray(tf, rand);
  const shuffledSa = shuffleArray(sa, rand);

  return {
    ...exam,
    code,
    questions: [...shuffledMc, ...shuffledTf, ...shuffledSa, ...es],
  };
}

import { Exam, PublicExam, PublicQuestion, Question } from "./types";

export function toPublicQuestion(q: Question): PublicQuestion {
  const base = { id: q.id, text: q.text, level: q.level, imageUrl: q.imageUrl, points: q.points };
  switch (q.type) {
    case "multiple_choice":
      return { ...base, type: q.type, options: q.options };
    case "true_false":
      return { ...base, type: q.type, subQuestions: q.subQuestions.map((s) => ({ id: s.id, text: s.text, level: s.level })) };
    default:
      return { ...base, type: q.type };
  }
}

export function toPublicExam(exam: Exam): PublicExam {
  return { ...exam, questions: exam.questions.map(toPublicQuestion) };
}

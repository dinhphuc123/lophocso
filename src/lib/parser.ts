import { Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion } from "./types";

export function parseExamText(rawText: string): Question[] {
  // Normalize line breaks
  const text = rawText.replace(/\r\n/g, "\n");
  const questions: Question[] = [];

  // Match Question headings like "Câu 1.", "Câu 1:", "Bài 1:"
  const questionRegex = /(?:^|\n)(?:Câu|Bài)\s*(\d+)[\s.:-]+/gi;
  const matches: { index: number; number: string }[] = [];

  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    matches.push({ index: match.index, number: match[1] });
  }

  if (matches.length === 0) {
    const simpleNumRegex = /(?:^|\n)(\d+)[\s.:)]+/g;
    while ((match = simpleNumRegex.exec(text)) !== null) {
      matches.push({ index: match.index, number: match[1] });
    }
  }

  // Answer key section at the bottom (if present)
  const answerKeyMap: Record<string, string> = {};
  const answerKeyRegex = /(\d+)\s*[:.-]?\s*([A-D])/gi;
  const answerKeySection = text.match(/(?:ĐÁP ÁN|BẢNG ĐÁP ÁN|BẢNG TRẢ LỜI)[\s\S]*$/i);
  if (answerKeySection) {
    let akm;
    while ((akm = answerKeyRegex.exec(answerKeySection[0])) !== null) {
      answerKeyMap[akm[1]] = akm[2].toUpperCase();
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : (answerKeySection ? answerKeySection.index! : text.length);
    let block = text.slice(start, end).trim();
    const qNum = matches[i].number;

    // 1. Extract embedded image [HINH_ANH:data:image/...]
    let imageUrl: string | undefined;
    const imgMatch = block.match(/\[HINH_ANH:([^\]]+)\]/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
      block = block.replace(/\[HINH_ANH:[^\]]+\]/g, "").trim();
    }

    // 2. Extract Level ([NB], [TH], [VD], [VDC]) from the question header only
    let level: "NB" | "TH" | "VD" | "VDC" | undefined;
    const headerLevelRx = /^(?:(?:Câu|Bài)?\s*\d+[\s.:-]+)?\s*(?:\[(?:TF|TL)\]\s*)?\[(NB|TH|VD|VDC)\]/i;
    const levelMatch = block.match(headerLevelRx);
    if (levelMatch) {
      level = levelMatch[1].toUpperCase() as "NB" | "TH" | "VD" | "VDC";
      // Remove only the header level bracket
      block = block.replace(levelMatch[0], levelMatch[0].replace(/\[(NB|TH|VD|VDC)\]/i, "")).trim();
    }

    // 3. Extract [HDG] (Hướng dẫn giải / Lời giải)
    let explanation: string | undefined;
    const hdgMatch = block.match(/(?:\[HDG\]|Lời giải|Hướng dẫn giải)[\s.:]*([\s\S]*)$/i);
    if (hdgMatch) {
      explanation = hdgMatch[1].trim();
      block = block.replace(/(?:\[HDG\]|Lời giải|Hướng dẫn giải)[\s.:]*[\s\S]*$/i, "").trim();
    }

    const uniqueId = `q-${i + 1}`;

    // Check if Essay question [TL]
    const isEssay = /\[TL\]/i.test(block);
    if (isEssay) {
      const qText = block
        .replace(/\[TL\]/gi, "")
        .replace(/^(?:Câu|Bài|\d+)[\s.:-]+/i, "")
        .trim();

      const essayQ: EssayQuestion = {
        id: uniqueId,
        type: "essay",
        text: qText,
        level,
        imageUrl,
        explanation,
        points: 1.0,
      };
      questions.push(essayQ);
      continue;
    }

    // Check if Short Answer question: contains "[[answer||answer2]]" or "Trả lời:"
    const shortAnsBracketMatch = block.match(/\[\[([\s\S]*?)\]\]/);
    if (shortAnsBracketMatch) {
      const rawAns = shortAnsBracketMatch[1].trim();
      const correctAnswers = rawAns.split("||").map((s) => s.trim());
      const qText = block
        .replace(/Trả lời:\s*\[\[[\s\S]*?\]\]/i, "")
        .replace(/\[\[[\s\S]*?\]\]/g, "")
        .replace(/^(?:Câu|Bài|\d+)[\s.:-]+/i, "")
        .trim();

      const shortQ: ShortAnswerQuestion = {
        id: uniqueId,
        type: "short_answer",
        text: qText,
        correctAnswers,
        level,
        imageUrl,
        explanation,
        points: 0.5,
      };
      questions.push(shortQ);
      continue;
    }

    // Check if True/False format: [TF] indicator or 4 sub-questions (a, b, c, d)
    const isTFIndicator = /\[TF\]/i.test(block);
    // Notice: lowercase [a-d] only to avoid matching A-D options of multiple choice
    const tfRegex = /(?:^|\n)\s*(?:<u>)?([a-d])(?:<\/u>)?[\s.:)]+(?:<\/u>)?\s*(?:\[(NB|TH|VD|VDC)\])?\s*#?([^\n]+)/g;
    const tfMatches = Array.from(block.matchAll(tfRegex));

    if (isTFIndicator || tfMatches.length >= 2) {
      const qText = block
        .replace(/\[TF\]/gi, "")
        .split(/(?:^|\n)\s*(?:<u>)?[a-d](?:<\/u>)?[\s.:)]+/i)[0]
        .replace(/^(?:Câu|Bài|\d+)[\s.:-]+/i, "")
        .trim();

      const subQuestions = tfMatches.map((m) => {
        const letter = m[1].toLowerCase() as "a" | "b" | "c" | "d";
        const subLevel = m[2]
          ? (m[2].toUpperCase() as "NB" | "TH" | "VD" | "VDC")
          : undefined;
        let content = m[3].trim().replace(/^#/, "").trim();

        // Check if there is an explicit (Đúng) / (Sai) or underline on letter / statement
        const isTrue =
          m[0].includes("<u>") ||
          /\(Đúng\)/i.test(content) ||
          /[\s-]Đúng$/i.test(content) ||
          /<u>[\s\S]*<\/u>/i.test(content);
        content = content.replace(/\((?:Đúng|Sai)\)/gi, "").replace(/<\/?u>/g, "").trim();

        return {
          id: letter,
          text: content,
          level: subLevel,
          isCorrect: isTrue,
        };
      });

      const tfQuestion: TrueFalseQuestion = {
        id: uniqueId,
        type: "true_false",
        text: qText || `Câu ${qNum}`,
        subQuestions,
        level,
        imageUrl,
        explanation,
        points: 1.0,
      };
      questions.push(tfQuestion);
      continue;
    }

    // Check if Multiple Choice (A. ... B. ... C. ... D. ...)
    const mcOptionRegex = /(?:^|[\s\t\n]+)(?:<u>)?([A-D])(?:<\/u>)?[\s.:)]+(?:<\/u>)?([\s\S]*?)(?=(?:[\s\t\n]+(?:<u>)?[A-D](?:<\/u>)?[\s.:)])|$)/g;
    const optMatches = Array.from(block.matchAll(mcOptionRegex));

    if (optMatches.length >= 2) {
      const qText = block
        .split(/(?:^|[\s\t\n]+)(?:<u>)?[A-D](?:<\/u>)?[\s.:)]+/)[0]
        .replace(/^(?:Câu|Bài|\d+)[\s.:-]+/i, "")
        .trim();

      // Check which option is underlined in docx: e.g. "<u>B</u>." or "<u>B. y=-1.</u>"
      let correct: "A" | "B" | "C" | "D" = "A";
      let answerKnown = true;
      const underlinedMatch = block.match(/<u>\s*([A-D])/i);
      if (underlinedMatch) {
        correct = underlinedMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
      } else {
        const mappedKey = answerKeyMap[qNum];
        if (mappedKey === "A" || mappedKey === "B" || mappedKey === "C" || mappedKey === "D") {
          correct = mappedKey;
        } else {
          const inlineMatch = block.match(/(?:Chọn|Đáp án|Đáp án đúng)\s*([A-D])/i);
          if (inlineMatch) {
            correct = inlineMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          } else {
            answerKnown = false; // placeholder "A": the teacher must confirm it in the preview
          }
        }
      }

      const options = optMatches.slice(0, 4).map((m) => {
        const letter = m[1].toUpperCase() as "A" | "B" | "C" | "D";
        const optText = m[2].replace(/<\/?u>/g, "").trim().replace(/;$/, "");
        return {
          id: letter,
          text: optText,
        };
      });

      const mcQuestion: MultipleChoiceQuestion = {
        id: uniqueId,
        type: "multiple_choice",
        text: qText || `Câu ${qNum}`,
        options,
        correctAnswer: correct,
        ...(answerKnown ? {} : { answerUnknown: true }),
        level,
        imageUrl,
        explanation,
        points: 0.25,
      };
      questions.push(mcQuestion);
      continue;
    }

    // Fallback Short Answer Question
    const cleanQText = block.replace(/^(?:Câu|Bài|\d+)[\s.:-]+/i, "").trim();
    const shortAnsMatch = block.match(/(?:Đáp án|Kết quả)[\s.:]+([^\n]+)/i);
    const correctAnswers = shortAnsMatch ? [shortAnsMatch[1].trim()] : [""];

    const shortQ: ShortAnswerQuestion = {
      id: uniqueId,
      type: "short_answer",
      text: cleanQText,
      correctAnswers,
      level,
      imageUrl,
      explanation,
      points: 0.5,
    };
    questions.push(shortQ);
  }

  return questions;
}

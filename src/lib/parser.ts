import { Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion } from "./types";

export function parseExamText(rawText: string): Question[] {
  // Normalize line breaks
  let text = rawText.replace(/\r\n/g, "\n");

  // Strip trailing Appendix / End-of-exam footer (e.g. "PHỤ LỤC KIỂM ĐỊNH...", "---------- HẾT ----------")
  // so appendix numbered items or notes don't get appended to the last question's explanation or parsed as questions
  const footerMatch = text.match(/(?:^|\n)\s*(?:PHỤ LỤC\b|[-=_*]{3,}\s*HẾT\s*[-=_*]{3,}|\bHẾT\b\s*$)/i);
  if (footerMatch && footerMatch.index !== undefined) {
    text = text.slice(0, footerMatch.index).trimEnd();
  }

  // Answer key section at the bottom (if present)
  const answerKeyMap: Record<string, string> = {};
  const answerKeyRegex = /(\d+)\s*[:.-]?\s*([A-D])/gi;
  const answerKeySection = text.match(/(?:^|\n)\s*(?:ĐÁP ÁN|BẢNG ĐÁP ÁN|BẢNG TRẢ LỜI)\b[\s\S]*$/i);
  if (answerKeySection && answerKeySection.index !== undefined) {
    let akm;
    while ((akm = answerKeyRegex.exec(answerKeySection[0])) !== null) {
      answerKeyMap[akm[1]] = akm[2].toUpperCase();
    }
    text = text.slice(0, answerKeySection.index).trimEnd();
  }

  const questions: Question[] = [];

  // Match Question headings like "Câu 1.", "Câu 1:", "Bài 1:" (including optional <u> wrapper from Word)
  const questionRegex = /(?:^|\n)\s*(?:<u>)?(?:Câu|Bài)\s*(\d+)(?:<\/u>)?[\s.:-]+(?:<\/u>)?/gi;
  const matches: { index: number; number: string }[] = [];

  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    matches.push({ index: match.index, number: match[1] });
  }

  if (matches.length === 0) {
    const simpleNumRegex = /(?:^|\n)\s*(?:<u>)?(\d+)(?:<\/u>)?[\s.:)]+(?:<\/u>)?/g;
    while ((match = simpleNumRegex.exec(text)) !== null) {
      matches.push({ index: match.index, number: match[1] });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let block = text.slice(start, end).trim();
    const qNum = matches[i].number;

    // 0. Strip trailing Section headers ("PHẦN II...", "PHẦN III...", "PHẦN IV...") that belong to the next section
    block = block.replace(/(?:\n\s*)+(?:<u>)?PHẦN\s+(?:I|II|III|IV|V|\d+)\b[\s\S]*$/i, "").trim();

    // 1. Extract embedded image [HINH_ANH:data:image/...]
    let imageUrl: string | undefined;
    const imgMatch = block.match(/\[HINH_ANH:([^\]]+)\]/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
      block = block.replace(/\[HINH_ANH:[^\]]+\]/g, "").trim();
    }

    // 2. Extract Level ([NB], [TH], [VD], [VDC]) from the question header only
    let level: "NB" | "TH" | "VD" | "VDC" | undefined;
    const headerLevelRx = /^(?:(?:<u>)?(?:Câu|Bài)?\s*\d+(?:<\/u>)?[\s.:-]+(?:<\/u>)?\s*)?(?:\[(?:TF|TL)\]\s*)?\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\]/i;
    const levelMatch = block.match(headerLevelRx);
    if (levelMatch) {
      level = levelMatch[1].toUpperCase() as "NB" | "TH" | "VD" | "VDC";
      block = block.replace(levelMatch[0], levelMatch[0].replace(/\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\]/i, "")).trim();
    }

    // 3. Extract [HDG] (Hướng dẫn giải / Lời giải)
    let explanation: string | undefined;
    const hdgMatch = block.match(/(?:\[(?:<u>)?HDG(?:<\/u>)?\]|Lời giải|Hướng dẫn giải)[\s.:]*([\s\S]*)$/i);
    if (hdgMatch) {
      explanation = hdgMatch[1].replace(/<\/?u>/g, "").trim();
      block = block.replace(/(?:\[(?:<u>)?HDG(?:<\/u>)?\]|Lời giải|Hướng dẫn giải)[\s.:]*[\s\S]*$/i, "").trim();
    }

    const uniqueId = `q-${i + 1}`;
    const stripHeader = (s: string) =>
      s
        .replace(/^(?:<u>)?(?:Câu|Bài|\d+)(?:<\/u>)?\s*\d*(?:<\/u>)?[\s.:-]+(?:<\/u>)?/i, "")
        .replace(/<\/?u>/g, "")
        .trim();

    // Check if Essay question [TL]
    const isEssay = /\[(?:<u>)?TL(?:<\/u>)?\]/i.test(block);
    if (isEssay) {
      const qText = stripHeader(block.replace(/\[(?:<u>)?TL(?:<\/u>)?\]/gi, ""));

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

    // Check if Short Answer question: contains "[[answer||answer2]]" or explicit "Trả lời: <number>"
    const shortAnsBracketMatch = block.match(/\[\[([\s\S]*?)\]\]/);
    if (shortAnsBracketMatch) {
      const rawAns = shortAnsBracketMatch[1].replace(/<\/?u>/g, "").trim();
      const correctAnswers = rawAns.split("||").map((s) => s.trim()).filter(Boolean);
      const qText = stripHeader(
        block
          .replace(/(?:<u>)?Trả lời:(?:<\/u>)?\s*\[\[[\s\S]*?\]\]/i, "")
          .replace(/\[\[[\s\S]*?\]\]/g, "")
      );

      const shortQ: ShortAnswerQuestion = {
        id: uniqueId,
        type: "short_answer",
        text: qText,
        correctAnswers: correctAnswers.length > 0 ? correctAnswers : [""],
        level,
        imageUrl,
        explanation,
        points: 0.5,
      };
      questions.push(shortQ);
      continue;
    }

    // Check if True/False format: [TF] indicator or 4 sub-questions (a, b, c, d)
    const isTFIndicator = /\[(?:<u>)?TF(?:<\/u>)?\]/i.test(block);
    // Notice: lowercase [a-d] only to avoid matching A-D options of multiple choice
    const tfRegex = /(?:^|\n)\s*(?:<u>)?([a-d])(?:<\/u>)?[\s.:)]+(?:<\/u>)?\s*(?:\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\])?\s*#?([^\n]+)/g;
    const tfMatches = Array.from(block.matchAll(tfRegex));

    if (isTFIndicator || tfMatches.length >= 2) {
      const qText = stripHeader(
        block
          .replace(/\[(?:<u>)?TF(?:<\/u>)?\]/gi, "")
          .split(/(?:^|\n)\s*(?:<u>)?[a-d](?:<\/u>)?[\s.:)]+/i)[0]
      );

      const subQuestions = tfMatches.map((m) => {
        const letter = m[1].toLowerCase() as "a" | "b" | "c" | "d";
        const subLevel = m[2]
          ? (m[2].toUpperCase() as "NB" | "TH" | "VD" | "VDC")
          : undefined;
        let content = m[3].trim().replace(/^#/, "").trim();

        // Check if there is an explicit (Đúng) / (Sai), underline on letter/statement, or in [HDG] ("Ý a) Đúng")
        let isTrue =
          m[0].includes("<u>") ||
          /\(Đúng\)/i.test(content) ||
          /[\s-]Đúng$/i.test(content) ||
          /<u>[\s\S]*<\/u>/i.test(content);

        if (!isTrue && explanation) {
          const hdgTfRegex = new RegExp(`(?:Ý|Câu|Mệnh đề)?\\s*${letter}\\s*[).:-]?\\s*(?:là\\s*)?(Đúng|Sai)`, "i");
          const hdgMatchTf = explanation.match(hdgTfRegex);
          if (hdgMatchTf) {
            isTrue = hdgMatchTf[1].toLowerCase() === "đúng";
          }
        }

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
    // Supports options separated by whitespace OR glued right after a period/semicolon/formula (e.g. "A. $60$.B. $75$.C. $15$.D. $45$.")
    const mcOptionBoundary = /(?:^|[\s\t\n]+|(?<=[.;$])\s*)(?:<u>)?([A-D])(?:<\/u>)?\s*[.:)]\s*(?:<\/u>)?/g;
    const rawOptPositions: Array<{ letter: "A" | "B" | "C" | "D"; matchStart: number; contentStart: number; rawMarker: string }> = [];
    let om: RegExpExecArray | null;
    while ((om = mcOptionBoundary.exec(block)) !== null) {
      const letter = om[1].toUpperCase() as "A" | "B" | "C" | "D";
      rawOptPositions.push({
        letter,
        matchStart: om.index,
        contentStart: om.index + om[0].length,
        rawMarker: om[0],
      });
    }

    // Find a valid option sequence starting with "A" (usually the last A, B, C, D sequence in the block)
    let validOptPositions = rawOptPositions;
    const lastAIndex = rawOptPositions.map((p) => p.letter).lastIndexOf("A");
    if (lastAIndex !== -1 && rawOptPositions.length - lastAIndex >= 2) {
      validOptPositions = rawOptPositions.slice(lastAIndex);
    }

    if (validOptPositions.length >= 2 && validOptPositions[0].letter === "A") {
      const firstOptStart = validOptPositions[0].matchStart;
      const qText = stripHeader(block.slice(0, firstOptStart));

      const optionsSlice = validOptPositions.slice(0, 4);
      let underlinedCorrect: "A" | "B" | "C" | "D" | undefined;

      const options = optionsSlice.map((pos, idx) => {
        const nextStart = idx + 1 < optionsSlice.length ? optionsSlice[idx + 1].matchStart : block.length;
        const rawOptChunk = block.slice(pos.contentStart, nextStart);
        if (pos.rawMarker.includes("<u>") || /<u>/.test(rawOptChunk)) {
          if (!underlinedCorrect) underlinedCorrect = pos.letter;
        }
        const optText = rawOptChunk.replace(/<\/?u>/g, "").trim().replace(/[.;]+$/, "").trim();
        return {
          id: pos.letter,
          text: optText,
        };
      });

      let correct: "A" | "B" | "C" | "D" = "A";
      let answerKnown = true;

      if (underlinedCorrect) {
        correct = underlinedCorrect;
      } else {
        const mappedKey = answerKeyMap[qNum];
        if (mappedKey === "A" || mappedKey === "B" || mappedKey === "C" || mappedKey === "D") {
          correct = mappedKey;
        } else {
          // Check inline or inside [HDG] explanation: e.g. "Chọn đáp án B", "Chọn B", "Đáp án: C"
          const searchArea = `${block}\n${explanation ?? ""}`;
          const inlineMatch = searchArea.match(/(?:Chọn\s+đáp\s+án|Chọn\s+phương\s+án|Đáp\s+án\s+đúng\s+là|Đáp\s+án\s+đúng|Đáp\s+án|Chọn)\s*[:.]?\s*([A-D])\b/i);
          if (inlineMatch) {
            correct = inlineMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          } else {
            answerKnown = false; // placeholder "A": the teacher must confirm it in the preview
          }
        }
      }

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
    let cleanQText = stripHeader(block);
    const searchShortArea = `${block}\n${explanation ?? ""}`;
    const shortAnsMatch = searchShortArea.match(/(?:Trả\s+lời|Đáp\s+án|Kết\s+quả|Vậy\s+[^\n=:]*bằng)[\s.:=]+([+-]?\d+(?:[.,]\d+)?)/i);
    let correctAnswers = shortAnsMatch ? [shortAnsMatch[1].trim()] : [""];
    // If answer has comma decimal (e.g. 1,79), also accept dot decimal (1.79)
    if (correctAnswers[0] && /^\d+,\d+$/.test(correctAnswers[0])) {
      correctAnswers = [correctAnswers[0], correctAnswers[0].replace(",", ".")];
    }
    cleanQText = cleanQText.replace(/(?:^|\n)\s*(?:Trả\s+lời|Đáp\s+án|Kết\s+quả)[\s.:]+[^\n]*$/i, "").trim();

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

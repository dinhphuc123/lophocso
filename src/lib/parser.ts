import { Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion } from "./types";

/** Extract all [HINH_ANH:...] tags from a string and return cleaned text + extracted URLs */
function extractImagesFromText(s: string): { cleaned: string; urls: string[] } {
  const urls: string[] = [];
  for (const m of s.matchAll(/\[HINH_ANH:([^\]]+)\]/g)) {
    const u = m[1]?.trim();
    if (u && !urls.includes(u)) urls.push(u);
  }
  const cleaned = s.replace(/\[HINH_ANH:[^\]]+\]/g, "").trim();
  return { cleaned, urls };
}

export function parseExamText(rawText: string): Question[] {
  // Normalize line breaks
  let text = rawText.replace(/\r\n/g, "\n");

  // Strip trailing Appendix / End-of-exam footer (e.g. "PHỤ LỤC KIỂM ĐỊNH...", "---------- HẾT ----------")
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

    // 1. Extract Level ([NB], [TH], [VD], [VDC]) from the question header only
    let level: "NB" | "TH" | "VD" | "VDC" | undefined;
    const headerLevelRx = /^(?:(?:<u>)?(?:Câu|Bài)?\s*\d+(?:<\/u>)?[\s.:-]+(?:<\/u>)?\s*)?(?:\[(?:TF|TL)\]\s*)?\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\]/i;
    const levelMatch = block.match(headerLevelRx);
    if (levelMatch) {
      level = levelMatch[1].toUpperCase() as "NB" | "TH" | "VD" | "VDC";
      block = block.replace(levelMatch[0], levelMatch[0].replace(/\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\]/i, "")).trim();
    }

    // 2. Extract [HDG] (Hướng dẫn giải / Lời giải) BEFORE stripping images from the question stem
    // so images inside [HDG] remain inside explanation (rendered inline by MathText)!
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
      const { cleaned: rawStem, urls: stemImgs } = extractImagesFromText(block.replace(/\[(?:<u>)?TL(?:<\/u>)?\]/gi, ""));
      const qText = stripHeader(rawStem);

      const essayQ: EssayQuestion = {
        id: uniqueId,
        type: "essay",
        text: qText,
        level,
        imageUrl: stemImgs[0],
        ...(stemImgs.length > 1 ? { imageUrls: stemImgs } : {}),
        explanation,
        points: 1.0,
      };
      questions.push(essayQ);
      continue;
    }

    // Check if Short Answer question: contains "[[answer||answer2]]"
    const shortAnsBracketMatch = block.match(/\[\[([\s\S]*?)\]\]/);
    if (shortAnsBracketMatch) {
      const rawAns = shortAnsBracketMatch[1].replace(/<\/?u>/g, "").trim();
      const correctAnswers = rawAns.split("||").map((s) => s.trim()).filter(Boolean);
      const { cleaned: rawStem, urls: stemImgs } = extractImagesFromText(
        block
          .replace(/(?:<u>)?Trả lời:(?:<\/u>)?\s*\[\[[\s\S]*?\]\]/i, "")
          .replace(/\[\[[\s\S]*?\]\]/g, "")
      );
      const qText = stripHeader(rawStem);

      const shortQ: ShortAnswerQuestion = {
        id: uniqueId,
        type: "short_answer",
        text: qText,
        correctAnswers: correctAnswers.length > 0 ? correctAnswers : [""],
        level,
        imageUrl: stemImgs[0],
        ...(stemImgs.length > 1 ? { imageUrls: stemImgs } : {}),
        explanation,
        points: 0.5,
      };
      questions.push(shortQ);
      continue;
    }

    // Check if True/False format: [TF] indicator or 4 sub-questions (a, b, c, d)
    const isTFIndicator = /\[(?:<u>)?TF(?:<\/u>)?\]/i.test(block);
    const tfRegex = /(?:^|\n)\s*(?:<u>)?([a-d])(?:<\/u>)?[\s.:)]+(?:<\/u>)?\s*(?:\[(?:<u>)?(NB|TH|VD|VDC)(?:<\/u>)?\])?\s*#?([^\n]+)/g;
    const tfMatches = Array.from(block.matchAll(tfRegex));

    if (isTFIndicator || tfMatches.length >= 2) {
      const rawStemPart = block
        .replace(/\[(?:<u>)?TF(?:<\/u>)?\]/gi, "")
        .split(/(?:^|\n)\s*(?:<u>)?[a-d](?:<\/u>)?[\s.:)]+/i)[0];
      const { cleaned: cleanStemPart, urls: stemImgs } = extractImagesFromText(rawStemPart);
      const qText = stripHeader(cleanStemPart);

      const subQuestions = tfMatches.map((m) => {
        const letter = m[1].toLowerCase() as "a" | "b" | "c" | "d";
        const subLevel = m[2]
          ? (m[2].toUpperCase() as "NB" | "TH" | "VD" | "VDC")
          : undefined;
        let content = m[3].trim().replace(/^#/, "").trim();

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
        imageUrl: stemImgs[0],
        ...(stemImgs.length > 1 ? { imageUrls: stemImgs } : {}),
        explanation,
        points: 1.0,
      };
      questions.push(tfQuestion);
      continue;
    }

    // Check if Multiple Choice (A. ... B. ... C. ... D. ...)
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

    let validOptPositions = rawOptPositions;
    const lastAIndex = rawOptPositions.map((p) => p.letter).lastIndexOf("A");
    if (lastAIndex !== -1 && rawOptPositions.length - lastAIndex >= 2) {
      validOptPositions = rawOptPositions.slice(lastAIndex);
    }

    if (validOptPositions.length >= 2 && validOptPositions[0].letter === "A") {
      const firstOptStart = validOptPositions[0].matchStart;
      const { cleaned: cleanStemPart, urls: stemImgs } = extractImagesFromText(block.slice(0, firstOptStart));
      const qText = stripHeader(cleanStemPart);

      const optionsSlice = validOptPositions.slice(0, 4);
      let underlinedCorrect: "A" | "B" | "C" | "D" | undefined;

      const options = optionsSlice.map((pos, idx) => {
        const nextStart = idx + 1 < optionsSlice.length ? optionsSlice[idx + 1].matchStart : block.length;
        const rawOptChunk = block.slice(pos.contentStart, nextStart);
        if (pos.rawMarker.includes("<u>") || /<u>/.test(rawOptChunk)) {
          if (!underlinedCorrect) underlinedCorrect = pos.letter;
        }
        // Keep [HINH_ANH:...] inside option text if an option has its own figure (e.g. 4 graphs A, B, C, D)!
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
          const searchArea = `${block}\n${explanation ?? ""}`;
          const inlineMatch = searchArea.match(/(?:Chọn\s+đáp\s+án|Chọn\s+phương\s+án|Đáp\s+án\s+đúng\s+là|Đáp\s+án\s+đúng|Đáp\s+án|Chọn)\s*[:.]?\s*([A-D])\b/i);
          if (inlineMatch) {
            correct = inlineMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
          } else {
            answerKnown = false;
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
        imageUrl: stemImgs[0],
        ...(stemImgs.length > 1 ? { imageUrls: stemImgs } : {}),
        explanation,
        points: 0.25,
      };
      questions.push(mcQuestion);
      continue;
    }

    // Fallback Short Answer Question
    const { cleaned: rawFallbackStem, urls: stemImgs } = extractImagesFromText(block);
    let cleanQText = stripHeader(rawFallbackStem);
    const searchShortArea = `${rawFallbackStem}\n${explanation ?? ""}`;
    const shortAnsMatch = searchShortArea.match(/(?:Trả\s+lời|Đáp\s+án|Kết\s+quả|Vậy\s+[^\n=:]*bằng)[\s.:=]+([+-]?\d+(?:[.,]\d+)?)/i);
    let correctAnswers = shortAnsMatch ? [shortAnsMatch[1].trim()] : [""];
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
      imageUrl: stemImgs[0],
      ...(stemImgs.length > 1 ? { imageUrls: stemImgs } : {}),
      explanation,
      points: 0.5,
    };
    questions.push(shortQ);
  }

  return questions;
}

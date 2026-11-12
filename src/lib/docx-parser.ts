import JSZip from "jszip";
import path from "path";
import fs from "fs";
import { createHash } from "node:crypto";
import { parseExamText } from "./parser";
import { Question } from "./types";
import { ommlToLatex } from "./omml-to-latex";

export interface DocxParseResult {
  rawText: string;
  questions: Question[];
  imageCount: number;
  tableCount?: number;
}

export interface DocxParseOptions {
  /** where extracted images are written (default public/uploads); URLs always start with /uploads/ */
  uploadDir?: string;
}

const MAX_IMAGES = 100;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Sniff the real format from the first bytes; svg and anything unknown is rejected (svg can carry scripts). */
function sniffImageExt(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "webp";
  return null;
}

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** Detect if a <w:rPr> block has an explicit highlight / red / blue answer color */
function hasColorOrHighlight(rPrXml: string): boolean {
  if (/<w:highlight(?:\s[^>]*)?\/?>/.test(rPrXml) && !/w:val="none"/.test(rPrXml)) {
    return true;
  }
  const colorMatch = rPrXml.match(/<w:color\s[^>]*w:val="([^"]+)"/i);
  if (colorMatch) {
    const val = colorMatch[1].toUpperCase();
    // Ignore auto, black, and dark gray shades
    if (
      val !== "AUTO" &&
      val !== "000000" &&
      val !== "111111" &&
      val !== "222222" &&
      val !== "333333" &&
      val !== "444444"
    ) {
      return true;
    }
  }
  return false;
}

export async function parseDocxBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  opts: DocxParseOptions = {}
): Promise<DocxParseResult> {
  const zip = await JSZip.loadAsync(buffer);
  const uploadDir = opts.uploadDir;

  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Tệp không đúng định dạng Word .docx hợp lệ (thiếu document.xml)");

  // 1. rId -> media path
  const relsMap: Record<string, string> = {};
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (relsFile) {
    for (const m of (await relsFile.async("text")).matchAll(/<Relationship\b[^>]*>/g)) {
      const id = m[0].match(/\bId="([^"]+)"/)?.[1];
      const target = m[0].match(/\bTarget="([^"]+)"/)?.[1];
      if (!id || !target || /TargetMode="External"/.test(m[0])) continue;
      relsMap[id] = target.startsWith("word/") ? target : target.startsWith("/") ? target.slice(1) : `word/${target}`;
    }
  }

  // 2. images are written lazily on first use; remember which files this call created
  const imageUrls: Record<string, string | null> = {};
  const createdNow = new Set<string>();
  let imageTotal = 0;
  async function imageFor(rId: string): Promise<string | undefined> {
    if (rId in imageUrls) return imageUrls[rId] ?? undefined;
    imageUrls[rId] = null;
    const file = relsMap[rId] && /\/media\//i.test(relsMap[rId]) ? zip.file(relsMap[rId]) : null;
    if (!file || imageTotal >= MAX_IMAGES) return undefined;
    const data = await file.async("uint8array");
    const ext = data.length <= MAX_IMAGE_BYTES ? sniffImageExt(data) : null;
    if (!ext) return undefined;

    // When an explicit uploadDir is provided (e.g. tests or custom local storage), write to disk
    if (uploadDir) {
      const name = `img_${createHash("sha256").update(data).digest("hex").slice(0, 16)}.${ext}`;
      const target = path.join(uploadDir, name);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(target, data);
        createdNow.add(target);
      }
      imageTotal++;
      return (imageUrls[rId] = `/uploads/${name}`);
    }

    // Default: Return Base64 Data URI (safe for Vercel Serverless / zero filesystem dependency)
    const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const base64 = Buffer.from(data).toString("base64");
    imageTotal++;
    return (imageUrls[rId] = `data:${mime};base64,${base64}`);
  }

  const docXml = await docFile.async("text");

  async function parseParagraph(pXml: string): Promise<{ text: string; imgUrl?: string }> {
    let pText = "";
    let imgUrl: string | undefined;
    const elemRegex = /<(m:oMathPara|m:oMath|w:r)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g;
    let m: RegExpExecArray | null;

    while ((m = elemRegex.exec(pXml)) !== null) {
      const tag = m[1];
      const content = m[0];

      if (tag === "m:oMath" || tag === "m:oMathPara") {
        const latex = ommlToLatex(content);
        if (latex) pText += tag === "m:oMathPara" ? ` $$${latex}$$ ` : ` $${latex}$ `;
        continue;
      }

      const blip = content.match(/r:embed="([^"]+)"/);
      if (blip) imgUrl = (await imageFor(blip[1])) ?? imgUrl;

      const rPr = content.match(/<w:rPr(?:\s[^>]*)?>[\s\S]*?<\/w:rPr>/)?.[0] ?? "";
      let runText = "";
      for (const part of content.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
        runText += part[0].startsWith("<w:tab") ? "\t" : part[0].startsWith("<w:br") ? "\n" : part[1];
      }
      runText = decodeXml(runText);
      // underline marks the correct answer; w:u val="none" is an explicit "no underline"
      // Also support highlight/colored option letters (A/B/C/D or a/b/c/d), ignoring colored tags like [NB] or [HDG]
      const hasUnderline = /<w:u(?:\s[^>]*)?\/?>/.test(rPr) && !/<w:u\s[^>]*w:val="none"/.test(rPr);
      const isOptionMarkerRun = /^\s*[A-Da-d]\s*[.:)]?\s*$/.test(runText);
      const underlined = hasUnderline || (isOptionMarkerRun && hasColorOrHighlight(rPr));
      if (runText) pText += underlined ? `<u>${runText}</u>` : runText;
    }
    return { text: pText.trim(), imgUrl };
  }

  // 3. Process top-level blocks in document order (<w:tbl> and <w:p>)
  // Smart Table Layout classifier:
  // - Option layout table (2x2 or 1x4 where cells start with A., B., C., D.) -> flatten to paragraphs
  // - Side-by-side stem + figure table (1 row, 2 cols where one cell has an image or question stem) -> flatten
  // - Data / statistical / variation table (e.g. grouped frequency table) -> emit Markdown pipe table
  const lines: Array<{ text: string; imgUrl?: string }> = [];
  let tableCount = 0;

  const blockRegex = /<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  for (const bm of docXml.matchAll(blockRegex)) {
    const blockXml = bm[0];
    if (blockXml.startsWith("<w:p")) {
      lines.push(await parseParagraph(blockXml));
      continue;
    }

    // Parse <w:tbl>
    const rows: Array<Array<{ text: string; imgUrl?: string }>> = [];
    for (const trMatch of blockXml.matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)) {
      const rowCells: Array<{ text: string; imgUrl?: string }> = [];
      for (const tcMatch of trMatch[0].matchAll(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g)) {
        const tcXml = tcMatch[0];
        const cellTexts: string[] = [];
        let cellImg: string | undefined;
        for (const pMatch of tcXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)) {
          const parsedP = await parseParagraph(pMatch[0]);
          if (parsedP.text) cellTexts.push(parsedP.text);
          if (parsedP.imgUrl) cellImg = parsedP.imgUrl;
        }
        // Check horizontal merge (gridSpan) so multi-column headers stay aligned
        const spanMatch = tcXml.match(/<w:gridSpan\s[^>]*w:val="(\d+)"/);
        const span = spanMatch ? Math.min(parseInt(spanMatch[1], 10) || 1, 12) : 1;

        rowCells.push({
          text: cellTexts.join(" ").replace(/\r?\n/g, " ").trim(),
          imgUrl: cellImg,
        });
        for (let s = 1; s < span; s++) {
          rowCells.push({ text: "" });
        }
      }
      if (rowCells.some((c) => c.text || c.imgUrl)) {
        rows.push(rowCells);
      }
    }

    if (rows.length === 0) continue;

    const allCells = rows.flat();
    const nonEmptyCells = allCells.filter((c) => c.text || c.imgUrl);

    // Case A: Table contains an image (e.g. 2-column stem + figure layout)
    const hasImage = allCells.some((c) => c.imgUrl);
    // Case B: Option grid table (every non-empty cell starts with A. / B. / C. / D.)
    const optionCellCount = nonEmptyCells.filter((c) =>
      /^(?:<u>)?[A-D](?:<\/u>)?[\s.:)]+/i.test(c.text.trim())
    ).length;
    const isOptionGrid = nonEmptyCells.length >= 2 && optionCellCount === nonEmptyCells.length;
    // Case C: Multi-question layout wrapper table (cells start with "Câu 1", "PHẦN I", etc.)
    const isQuestionWrapper = nonEmptyCells.some((c) => /^(?:<u>)?(?:Câu|Bài)\s*\d+/i.test(c.text.trim()));

    if (hasImage || isOptionGrid || isQuestionWrapper) {
      for (const cell of allCells) {
        if (cell.text || cell.imgUrl) {
          lines.push(cell);
        }
      }
      continue;
    }

    // Case D: Real data / frequency table -> emit Markdown pipe table
    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount === 0) continue;

    tableCount++;
    const mdRows: string[] = [];
    rows.forEach((r, rIdx) => {
      const padded = Array.from({ length: colCount }, (_, cIdx) => {
        const rawCell = r[cIdx]?.text ?? "";
        // Escape literal pipe characters outside math or replace with \mid if needed
        return rawCell.replace(/\|/g, "&#124;").trim();
      });
      mdRows.push(`| ${padded.join(" | ")} |`);
      if (rIdx === 0) {
        mdRows.push(`| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`);
      }
    });

    lines.push({ text: mdRows.join("\n") });
  }

  // 4. an image-only paragraph belongs to the line before it (the "Câu X." heading)
  const out: string[] = [];
  for (const { text, imgUrl } of lines) {
    if (!text && imgUrl) {
      if (out.length) out[out.length - 1] += ` [HINH_ANH:${imgUrl}]`;
      else out.push(`[HINH_ANH:${imgUrl}]`);
    } else if (text) {
      out.push(imgUrl ? `${text} [HINH_ANH:${imgUrl}]` : text);
    }
  }

  const rawText = out.join("\n");
  const questions = parseExamText(rawText);

  // drop files this call wrote that no question ended up using (e.g. the logo in the instructions header)
  const used = new Set(questions.map((q) => q.imageUrl).filter(Boolean));
  for (const file of createdNow) {
    if (!used.has(`/uploads/${path.basename(file)}`)) fs.rmSync(file, { force: true });
  }

  return {
    rawText,
    questions,
    imageCount: questions.filter((q) => q.imageUrl).length,
    tableCount,
  };
}

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

export async function parseDocxBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  opts: DocxParseOptions = {}
): Promise<DocxParseResult> {
  const zip = await JSZip.loadAsync(buffer);
  const uploadDir = opts.uploadDir ?? path.join(process.cwd(), "public", "uploads");

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

  // 3. paragraph by paragraph, in document order
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

      // underline marks the correct answer; w:u val="none" is an explicit "no underline"
      const underlined = /<w:u(?:\s[^>]*)?\/?>/.test(content) && !/<w:u\s[^>]*w:val="none"/.test(content);
      let runText = "";
      for (const part of content.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
        runText += part[0].startsWith("<w:tab") ? "\t" : part[0].startsWith("<w:br") ? "\n" : part[1];
      }
      runText = decodeXml(runText);
      if (runText) pText += underlined ? `<u>${runText}</u>` : runText;
    }
    return { text: pText.trim(), imgUrl };
  }

  const lines: Array<{ text: string; imgUrl?: string }> = [];
  for (const pm of docXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)) lines.push(await parseParagraph(pm[0]));

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

  return { rawText, questions, imageCount: questions.filter((q) => q.imageUrl).length };
}

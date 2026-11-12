import { NextResponse } from "next/server";
import { parseDocxBuffer } from "@/lib/docx-parser";
import { teacherOnly } from "@/lib/auth";

const MAX_DOCX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn tệp Word (.docx)" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ success: false, error: "Hệ thống chỉ hỗ trợ định dạng tệp .docx (Word)" }, { status: 400 });
    }
    if (file.size > MAX_DOCX_BYTES) {
      return NextResponse.json({ success: false, error: "Tệp quá lớn (tối đa 15 MB)" }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      // .docx is a zip: must start with "PK"
      return NextResponse.json({ success: false, error: "Tệp không phải Word .docx hợp lệ" }, { status: 400 });
    }

    const result = await parseDocxBuffer(bytes);
    return NextResponse.json({
      success: true,
      fileName: file.name,
      imageCount: result.imageCount,
      tableCount: result.tableCount ?? 0,
      questionCount: result.questions.length,
      questions: result.questions,
      rawText: result.rawText,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

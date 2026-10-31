import { NextResponse } from "next/server";
import { teacherOnly } from "@/lib/auth";
import { 
  getTeacherProfile, 
  updateTeacherProfile, 
  verifyTeacherPassword, 
  hashPassword 
} from "@/lib/profile";

export async function GET(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  const profile = await getTeacherProfile();
  return NextResponse.json({
    success: true,
    profile: {
      id: profile.id,
      name: profile.name,
      school: profile.school,
      subject: profile.subject,
      email: profile.email,
      updatedAt: profile.updatedAt,
    },
  });
}

export async function POST(req: Request) {
  const denied = await teacherOnly(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, school, subject, email, currentPassword, newPassword } = body;

    const updates: Parameters<typeof updateTeacherProfile>[0] = {};

    if (typeof name === "string") updates.name = name.trim();
    if (typeof school === "string") updates.school = school.trim();
    if (typeof subject === "string") updates.subject = subject.trim();
    if (typeof email === "string") updates.email = email.trim();

    // Password change request
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới" },
          { status: 400 }
        );
      }

      const isValid = await verifyTeacherPassword(currentPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Mật khẩu hiện tại không chính xác" },
          { status: 400 }
        );
      }

      if (typeof newPassword !== "string" || newPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: "Mật khẩu mới phải có ít nhất 4 ký tự" },
          { status: 400 }
        );
      }

      updates.passwordHash = await hashPassword(newPassword);
    }

    const updated = await updateTeacherProfile(updates);

    return NextResponse.json({
      success: true,
      message: newPassword ? "Đã cập nhật hồ sơ và đổi mật khẩu thành công" : "Đã cập nhật hồ sơ thành công",
      profile: {
        id: updated.id,
        name: updated.name,
        school: updated.school,
        subject: updated.subject,
        email: updated.email,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

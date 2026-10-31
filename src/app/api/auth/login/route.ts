import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE_SEC, checkPassword, createToken, teacherPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ success: false, error: "Thử lại sau 1 phút" }, { status: 429 });
  }
  if (!teacherPassword()) {
    return NextResponse.json({ success: false, error: "Máy chủ chưa đặt TEACHER_PASSWORD" }, { status: 503 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ success: false, error: "Sai mật khẩu" }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, await createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE_SEC,
  });
  return res;
}

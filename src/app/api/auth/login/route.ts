import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE_SEC, createToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hasCustomPassword, verifyTeacherPassword } from "@/lib/profile";

export async function GET() {
  const custom = await hasCustomPassword();
  return NextResponse.json({ success: true, hasCustomPassword: custom });
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ success: false, error: "Thử lại sau 1 phút" }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !(await verifyTeacherPassword(password))) {
    const custom = await hasCustomPassword();
    return NextResponse.json(
      { success: false, error: custom ? "Sai mật khẩu giáo viên" : "Sai mật khẩu (mặc định: giaovien)" },
      { status: 401 }
    );
  }
  const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://");
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, await createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: AUTH_MAX_AGE_SEC,
  });
  return res;
}

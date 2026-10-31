import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

// Pages only: every teacher API enforces teacherOnly() itself.
export async function proxy(req: NextRequest) {
  if (await verifyToken(req.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/teacher/:path*"] };

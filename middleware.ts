import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const login = (extra?: string) => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = extra ?? "";
    const res = NextResponse.redirect(url);
    if (token && !session) res.cookies.delete(SESSION_COOKIE); // clear stale cookie
    return res;
  };

  if (!session) return login();

  // Admin area requires an admin session.
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = `/r/${session.cid}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Client sessions may only view their own company report.
  if (pathname.startsWith("/r/") && session.role !== "admin") {
    const requested = pathname.split("/")[2];
    if (requested && requested !== session.cid) {
      const url = req.nextUrl.clone();
      url.pathname = `/r/${session.cid}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Landing: route to the right home.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "admin" ? "/admin" : `/r/${session.cid}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except login, the cron-authenticated sync API,
  // and static assets.
  matcher: [
    "/((?!login|api/sync|_next/static|_next/image|favicon.ico).*)",
  ],
};

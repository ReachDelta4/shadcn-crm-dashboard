import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isApi = url.pathname.startsWith("/api");
  const allowlistApi = new Set<string>([
    "/api/device-auth/create",
    "/api/device-auth/exchange",
  ]);
  const isAllowlisted = isApi && allowlistApi.has(url.pathname);

  const hasSupabaseSessionCookie = req.cookies.getAll().some((c) =>
    c.name.startsWith("sb-")
  );

  if (isApi) {
    if (isAllowlisted) return NextResponse.next();
    if (!hasSupabaseSessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (url.pathname.startsWith("/dashboard") && !hasSupabaseSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


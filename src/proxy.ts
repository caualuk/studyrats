import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

// Next.js 16 renamed Middleware to Proxy (same mechanism). This file runs on
// every matched request, before rendering, so we can bounce unauthenticated
// visitors away from the app and authenticated ones away from the auth
// pages. This is an *optimistic* check -- it only reads/verifies the signed
// cookie, never the database -- real authorization still happens in the
// Data Access Layer (see src/lib/auth/dal.ts) close to the data itself.
const PROTECTED_PREFIXES = ["/feed", "/ranking", "/desafios", "/perfil", "/amigos"];
const AUTH_ROUTES = ["/login", "/registro"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};

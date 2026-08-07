import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

/**
 * Clears a session cookie that no longer points at a real user (e.g. the
 * account was deleted). Server Components can only *read* cookies, so the
 * DAL redirects here -- a Route Handler -- to actually delete the cookie
 * before sending the user back to /login. Without this, proxy.ts's
 * optimistic check would keep seeing a validly-signed (but orphaned)
 * session cookie and bounce /login back to the protected route, looping.
 */
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}

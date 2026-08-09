import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Data Access Layer entry point: verifies the session cookie and redirects
 * unauthenticated requests to /login. Wrapped in React's `cache` so it only
 * runs once per request even when called from multiple Server Components.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  if (!session?.userId) {
    redirect("/login");
  }

  return session;
});

/** Same as verifySession, but returns null instead of redirecting. */
export const getOptionalSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(token);
});

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  createdAt: Date;
};

const SESSION_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
  bio: true,
  isPrivate: true,
  createdAt: true,
  passwordChangedAt: true,
} as const;

/** Fetches the authenticated user's public profile fields, or redirects. */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: SESSION_USER_SELECT,
  });

  if (!user) {
    // The session cookie is validly signed but points at a user that no
    // longer exists. Route through the Route Handler that clears the
    // cookie (Server Components can't write cookies during render) instead
    // of redirecting straight to /login, or proxy.ts's optimistic check
    // would keep seeing a "valid" session and bounce back to this page.
    redirect("/api/auth/clear-session");
  }

  if (user.passwordChangedAt && user.passwordChangedAt > session.issuedAt) {
    // The password was changed (e.g. via the reset-password flow) after
    // this cookie was signed -- most likely someone still has an old
    // session (or a stolen one) from before the reset. Force it out.
    redirect("/api/auth/clear-session");
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
  };
});

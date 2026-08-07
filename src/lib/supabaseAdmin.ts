import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Used only to make Supabase's Auth email sender dispatch the password
// reset email (see src/lib/auth/passwordReset.ts) -- the app's own users,
// sessions and passwords all live in our own Postgres tables via Prisma,
// completely separate from Supabase Auth's `auth.users`.
let client: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no .env."
      );
    }
    client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for server-side Storage access (uploads.ts). Never
// import this from client code -- the service role key bypasses RLS.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

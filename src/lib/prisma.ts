import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma ORM 7 requires an explicit driver adapter -- there's no implicit
// "url in schema.prisma" connection anymore. Connected to Supabase Postgres
// via the session pooler (see DATABASE_URL in .env).
function createPrismaClient() {
  // Supabase's session pooler caps total clients at 15. pg.Pool defaults to
  // max: 10 *per instance* -- serverless hosts (Vercel) spin up several
  // instances at once, and with another always-on instance (Render) also
  // connected, that default alone can exhaust the pooler. Keep each
  // instance's pool small and release idle connections quickly.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Standard Next.js singleton pattern: in dev, hot-reload would otherwise
// create a new PrismaClient (and a new connection pool) on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

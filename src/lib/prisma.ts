import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma ORM 7 requires an explicit driver adapter -- there's no implicit
// "url in schema.prisma" connection anymore. Connected to Supabase Postgres
// via the transaction pooler (see DATABASE_URL in .env) -- built for many
// short-lived connections from serverless/multi-instance hosts, unlike the
// session pooler (used only for migrations, see prisma.config.ts).
function createPrismaClient() {
  // Keep each instance's own pool small and release idle connections
  // quickly, on top of already using the transaction pooler -- extra
  // headroom against exhausting Supabase's connection limit when several
  // instances (or hosts) run at once.
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

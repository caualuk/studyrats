import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma ORM 7 config: this is where the CLI (migrate, studio, db push)
// reads the connection string from. Prisma Client itself gets its own
// adapter instance in src/lib/prisma.ts -- the two are configured
// separately on purpose in v7.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

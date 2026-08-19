// prisma.config.ts
// Pointing `schema` at the prisma/ *directory* activates the
// prismaSchemaFolder preview feature so Prisma CLI loads
// prisma/schema.prisma + all prisma/models/*.prisma files.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",          // directory, not a single file
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

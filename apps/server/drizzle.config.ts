// Module: Configures Drizzle Kit for the PostgreSQL database schema.
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/cv_agent",
  },
  strict: true,
  verbose: true,
})

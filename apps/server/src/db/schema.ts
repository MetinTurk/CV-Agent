// Module: Defines the PostgreSQL tables used by the CV Agent server.
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import type {
  ApplicationStatus,
  JobDescription,
  MatchAnalysis,
} from "../schemas/job-analysis"
import type { ProfileData } from "../schemas/profile-chat"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<ProfileData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const jobAnalyses = pgTable("job_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  rawContent: text("raw_content").notNull(),
  jobDescription: jsonb("job_description").$type<JobDescription>().notNull(),
  matchAnalysis: jsonb("match_analysis").$type<MatchAnalysis>(),
  applicationStatus: text("application_status")
    .$type<ApplicationStatus>()
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type UserRecord = typeof users.$inferSelect
export type NewUserRecord = typeof users.$inferInsert
export type ProfileRecord = typeof profiles.$inferSelect
export type NewProfileRecord = typeof profiles.$inferInsert
export type JobAnalysisRecord = typeof jobAnalyses.$inferSelect
export type NewJobAnalysisRecord = typeof jobAnalyses.$inferInsert

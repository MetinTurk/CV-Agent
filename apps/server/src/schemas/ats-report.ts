// Module: Defines TypeBox contracts for ATS compatibility report generation.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

import { TailoredCvSchema } from "./cv-generation"
import { JobDescriptionSchema } from "./job-analysis"

export const AtsMatchLevelSchema = t.Union([
  t.Literal("zayif"),
  t.Literal("orta"),
  t.Literal("orta-guclu"),
  t.Literal("guclu"),
])

export const AtsReportCreateRequestSchema = t.Object({
  job_description: JobDescriptionSchema,
  tailored_cv: TailoredCvSchema,
})

export const AtsReportResponseSchema = t.Object({
  similarity_score: t.Number({ minimum: 0, maximum: 100 }),
  match_level: AtsMatchLevelSchema,
  strong_matches: t.Array(t.String()),
  warnings: t.Array(t.String()),
  recommendations: t.Array(t.String()),
  created_at: t.String(),
})

export type AtsMatchLevel = Static<typeof AtsMatchLevelSchema>
export type AtsReportCreateRequest = Static<typeof AtsReportCreateRequestSchema>
export type AtsReportResponse = Static<typeof AtsReportResponseSchema>

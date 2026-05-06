// Module: Defines TypeBox contracts for the job analysis (URL → structured job description) endpoint.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

export const JobDescriptionSchema = t.Object({
  title: t.Nullable(t.String()),
  company: t.Nullable(t.String()),
  location: t.Nullable(t.String()),
  employment_type: t.Nullable(t.String()),
  summary: t.Nullable(t.String()),
  responsibilities: t.Array(t.String()),
  requirements: t.Array(t.String()),
  skills: t.Array(t.String()),
})

export const MatchAnalysisSchema = t.Object({
  yeterli_yonler: t.Array(t.String()),
  eksik_yonler: t.Array(t.String()),
  genel_uyumluluk_puani: t.Number({ minimum: 0, maximum: 100 }),
  tavsiyeler: t.Array(t.String()),
})

export const JobAnalysisCreateRequestSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
})

export const JobAnalysisResponseSchema = t.Object({
  id: t.String(),
  url: t.String(),
  job_description: JobDescriptionSchema,
  match_analysis: t.Nullable(MatchAnalysisSchema),
  created_at: t.String(),
})

export type JobDescription = Static<typeof JobDescriptionSchema>
export type MatchAnalysis = Static<typeof MatchAnalysisSchema>
export type JobAnalysisCreateRequest = Static<
  typeof JobAnalysisCreateRequestSchema
>
export type JobAnalysisResponse = Static<typeof JobAnalysisResponseSchema>

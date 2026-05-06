// Module: Defines TypeBox contracts for job posting capture and demo analysis responses.
import type { Static } from "@sinclair/typebox"
import { t } from "elysia"

export const JobSourceSiteSchema = t.Union([
  t.Literal("linkedin"),
  t.Literal("kariyer-net"),
  t.Literal("indeed"),
  t.Literal("generic"),
])

export const WorkplaceTypeSchema = t.Union([
  t.Literal("remote"),
  t.Literal("hybrid"),
  t.Literal("onsite"),
  t.Literal("unknown"),
])

export const JobPostingLanguageSchema = t.Union([
  t.Literal("tr"),
  t.Literal("en"),
  t.Literal("unknown"),
])

export const ExtractedJobPostingSchema = t.Object({
  sourceUrl: t.String({ format: "uri", minLength: 1, maxLength: 4096 }),
  sourceSite: JobSourceSiteSchema,
  title: t.Nullable(t.String({ minLength: 1, maxLength: 240 })),
  companyName: t.Nullable(t.String({ minLength: 1, maxLength: 180 })),
  location: t.Nullable(t.String({ minLength: 1, maxLength: 180 })),
  employmentType: t.Nullable(t.String({ minLength: 1, maxLength: 120 })),
  workplaceType: WorkplaceTypeSchema,
  descriptionText: t.String({ minLength: 200, maxLength: 24000 }),
  requirements: t.Array(t.String({ minLength: 1, maxLength: 240 }), {
    maxItems: 20,
  }),
  responsibilities: t.Array(t.String({ minLength: 1, maxLength: 280 }), {
    maxItems: 20,
  }),
  benefits: t.Array(t.String({ minLength: 1, maxLength: 240 }), {
    maxItems: 12,
  }),
  seniority: t.Nullable(t.String({ minLength: 1, maxLength: 120 })),
  language: JobPostingLanguageSchema,
  extractedAt: t.String({ minLength: 1, maxLength: 64 }),
})

export const CreateJobAnalysisRequestSchema = t.Object({
  jobPosting: ExtractedJobPostingSchema,
  source: t.Object({
    kind: t.Literal("chrome-extension"),
    extensionVersion: t.String({ minLength: 1, maxLength: 24 }),
    tabId: t.Optional(t.Number()),
  }),
})

export const AnalysisInsightSchema = t.Object({
  title: t.String(),
  detail: t.String(),
  evidence: t.Array(t.String()),
})

export const JobAnalysisDetailSchema = t.Object({
  id: t.String(),
  jobPosting: ExtractedJobPostingSchema,
  companyName: t.Nullable(t.String()),
  title: t.Nullable(t.String()),
  compatibilityScore: t.Number({ minimum: 0, maximum: 100 }),
  decision: t.Union([
    t.Literal("apply"),
    t.Literal("consider"),
    t.Literal("skip"),
  ]),
  strengths: t.Array(AnalysisInsightSchema),
  improvementAreas: t.Array(AnalysisInsightSchema),
  missingRequirements: t.Array(AnalysisInsightSchema),
  recommendations: t.Array(t.String()),
  createdAt: t.String(),
})

export const CreateJobAnalysisResponseSchema = t.Object({
  analysisId: t.String(),
  status: t.Union([
    t.Literal("queued"),
    t.Literal("processing"),
    t.Literal("completed"),
  ]),
  redirectUrl: t.String(),
  summary: t.String(),
  detail: JobAnalysisDetailSchema,
})

export type ExtractedJobPosting = Static<typeof ExtractedJobPostingSchema>
export type CreateJobAnalysisRequest = Static<
  typeof CreateJobAnalysisRequestSchema
>
export type AnalysisInsight = Static<typeof AnalysisInsightSchema>
export type JobAnalysisDetail = Static<typeof JobAnalysisDetailSchema>
export type CreateJobAnalysisResponse = Static<
  typeof CreateJobAnalysisResponseSchema
>

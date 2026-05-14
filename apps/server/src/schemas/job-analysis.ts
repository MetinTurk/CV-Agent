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

export const ApplicationStatusSchema = t.Union([
  t.Literal("pending"),
  t.Literal("approved"),
  t.Literal("rejected"),
])

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

export const JobAnalysisSourceSchema = t.Object({
  kind: t.Literal("chrome-extension"),
  extensionVersion: t.String({ minLength: 1, maxLength: 24 }),
  tabId: t.Optional(t.Number()),
})

export const UrlJobAnalysisCreateRequestSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
})

export const ExtensionJobAnalysisCreateRequestSchema = t.Object({
  jobPosting: ExtractedJobPostingSchema,
  source: JobAnalysisSourceSchema,
})

export const JobAnalysisCreateRequestSchema = t.Union([
  UrlJobAnalysisCreateRequestSchema,
  ExtensionJobAnalysisCreateRequestSchema,
])

export const JobAnalysisResponseSchema = t.Object({
  id: t.String(),
  url: t.String(),
  job_description: JobDescriptionSchema,
  match_analysis: t.Nullable(MatchAnalysisSchema),
  application_status: ApplicationStatusSchema,
  created_at: t.String(),
  status: t.Literal("completed"),
  redirect_url: t.String(),
})

export const JobAnalysisListResponseSchema = t.Array(JobAnalysisResponseSchema)

export const JobApplicationStatusUpdateRequestSchema = t.Object({
  application_status: ApplicationStatusSchema,
})

export type JobDescription = Static<typeof JobDescriptionSchema>
export type MatchAnalysis = Static<typeof MatchAnalysisSchema>
export type ApplicationStatus = Static<typeof ApplicationStatusSchema>
export type ExtractedJobPosting = Static<typeof ExtractedJobPostingSchema>
export type JobAnalysisSource = Static<typeof JobAnalysisSourceSchema>
export type JobAnalysisCreateRequest = Static<
  typeof JobAnalysisCreateRequestSchema
>
export type JobAnalysisResponse = Static<typeof JobAnalysisResponseSchema>
export type JobApplicationStatusUpdateRequest = Static<
  typeof JobApplicationStatusUpdateRequestSchema
>

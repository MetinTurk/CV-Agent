// Module: Defines TypeBox contracts for saved job application history.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

import { JobDescriptionSchema, MatchAnalysisSchema } from "./job-analysis"

export const ApplicationStatusSchema = t.Union([
  t.Literal("pending"),
  t.Literal("approved"),
  t.Literal("rejected"),
])

export const ApplicationSummarySchema = t.Object({
  id: t.String(),
  url: t.String(),
  job_description: JobDescriptionSchema,
  match_analysis: t.Nullable(MatchAnalysisSchema),
  application_status: ApplicationStatusSchema,
  created_at: t.String(),
})

export const ApplicationsListResponseSchema = t.Object({
  applications: t.Array(ApplicationSummarySchema),
})

export const ApplicationStatusUpdateRequestSchema = t.Object({
  status: ApplicationStatusSchema,
})

export const ApplicationStatusUpdateResponseSchema = t.Object({
  application: ApplicationSummarySchema,
})

export type ApplicationStatus = Static<typeof ApplicationStatusSchema>
export type ApplicationSummary = Static<typeof ApplicationSummarySchema>
export type ApplicationsListResponse = Static<
  typeof ApplicationsListResponseSchema
>
export type ApplicationStatusUpdateRequest = Static<
  typeof ApplicationStatusUpdateRequestSchema
>
export type ApplicationStatusUpdateResponse = Static<
  typeof ApplicationStatusUpdateResponseSchema
>

// Module: Defines TypeBox contracts for the tailored CV generation endpoint.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

import { JobDescriptionSchema } from "./job-analysis"

export const TailoredCvExperienceSchema = t.Object({
  role: t.String(),
  company: t.String(),
  period: t.String(),
  bullets: t.Array(t.String()),
})

export const TailoredCvEducationSchema = t.Object({
  institution: t.String(),
  degree: t.String(),
  period: t.String(),
})

export const TailoredCvProjectSchema = t.Object({
  name: t.String(),
  description: t.String(),
})

export const TailoredCvSchema = t.Object({
  full_name: t.String(),
  title: t.String(),
  location: t.Nullable(t.String()),
  summary: t.String(),
  skills: t.Array(t.String()),
  experiences: t.Array(TailoredCvExperienceSchema),
  educations: t.Array(TailoredCvEducationSchema),
  projects: t.Array(TailoredCvProjectSchema),
  certifications: t.Array(t.String()),
  languages: t.Array(t.String()),
})

export const CvGenerationCreateRequestSchema = t.Object({
  job_description: JobDescriptionSchema,
})

export const CvGenerationResponseSchema = t.Object({
  tailored_cv: TailoredCvSchema,
  created_at: t.String(),
})

export type TailoredCvExperience = Static<typeof TailoredCvExperienceSchema>
export type TailoredCvEducation = Static<typeof TailoredCvEducationSchema>
export type TailoredCvProject = Static<typeof TailoredCvProjectSchema>
export type TailoredCv = Static<typeof TailoredCvSchema>
export type CvGenerationCreateRequest = Static<
  typeof CvGenerationCreateRequestSchema
>
export type CvGenerationResponse = Static<typeof CvGenerationResponseSchema>

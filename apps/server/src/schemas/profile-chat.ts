// Module: Defines TypeBox contracts for the profile collection chat endpoint.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

export const REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "location",
  "skills",
  "education",
] as const

export const ProfileDataSchema = t.Object({
  full_name: t.Nullable(t.String()),
  location: t.Nullable(t.String()),
  skills: t.Array(t.String()),
  projects: t.Array(t.String()),
  certifications: t.Array(t.String()),
  languages: t.Array(t.String()),
  work_experiences: t.Array(t.String()),
  education: t.Nullable(t.String()),
  additional_information: t.Nullable(t.String()),
})

export const ProfileChatRequestSchema = t.Object({
  message: t.String({ minLength: 1, maxLength: 4000 }),
  session_id: t.String({ minLength: 1, maxLength: 80, default: "default" }),
})

export const ProfileChatResponseSchema = t.Object({
  reply: t.String(),
  session_id: t.String(),
  profile: ProfileDataSchema,
  missing_required_fields: t.Array(t.String()),
  is_profile_ready: t.Boolean(),
})

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number]
export type ProfileData = Static<typeof ProfileDataSchema>
export type ProfileChatRequest = Static<typeof ProfileChatRequestSchema>
export type ProfileChatResponse = Static<typeof ProfileChatResponseSchema>

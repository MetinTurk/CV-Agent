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
  github_url: t.Nullable(t.String()),
  additional_information: t.Nullable(t.String()),
})

export const ProfileChatRequestSchema = t.Object({
  message: t.String({ minLength: 1, maxLength: 4000 }),
  session_id: t.String({ minLength: 1, maxLength: 80, default: "default" }),
  source: t.Optional(
    t.Object({
      type: t.Literal("url"),
      value: t.String({ minLength: 1, maxLength: 2048 }),
    })
  ),
})

export const ProfileChatDocumentRequestSchema = t.Object({
  message: t.Optional(t.String({ maxLength: 4000 })),
  session_id: t.String({ minLength: 1, maxLength: 80, default: "default" }),
  document: t.File({
    maxSize: "5m",
  }),
})

export const ProfileChatResponseSchema = t.Object({
  reply: t.String(),
  session_id: t.String(),
  profile: ProfileDataSchema,
  missing_required_fields: t.Array(t.String()),
  is_profile_ready: t.Boolean(),
  redirect_to: t.Nullable(t.String()),
})

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number]
export type ProfileData = Static<typeof ProfileDataSchema>
export type ProfileChatRequest = Static<typeof ProfileChatRequestSchema>
export type ProfileChatDocumentRequest = Static<
  typeof ProfileChatDocumentRequestSchema
>
export type ProfileChatResponse = Static<typeof ProfileChatResponseSchema>
export type ProfileSourceType = "text" | "docx" | "url"
export type ProfileSourceContext = {
  type: ProfileSourceType
  label: string
  content: string
}
export type ProfilePatch = Partial<{
  full_name: string
  location: string
  skills: string[]
  projects: string[]
  certifications: string[]
  languages: string[]
  work_experiences: string[]
  education: string
  github_url: string
  additional_information: string
}>

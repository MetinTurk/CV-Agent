// Module: Defines TypeBox contracts for saved profile API responses.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

import { ProfileDataSchema } from "./profile-chat"

export const SavedProfileResponseSchema = t.Object({
  profile: ProfileDataSchema,
  updated_at: t.String(),
})

export const ProfileProjectLinkRequestSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
})

export const ProfileCertificationLinkRequestSchema = t.Object({
  url: t.String({ minLength: 1, maxLength: 2048 }),
})

export const ProfileCertificationDocumentRequestSchema = t.Object({
  document: t.File({
    maxSize: "10m",
    type: ["application/pdf", "image/png", "image/jpeg"],
  }),
})

export type SavedProfileResponse = Static<typeof SavedProfileResponseSchema>
export type ProfileProjectLinkRequest = Static<
  typeof ProfileProjectLinkRequestSchema
>
export type ProfileCertificationLinkRequest = Static<
  typeof ProfileCertificationLinkRequestSchema
>
export type ProfileCertificationDocumentRequest = Static<
  typeof ProfileCertificationDocumentRequestSchema
>

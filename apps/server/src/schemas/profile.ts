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

export type SavedProfileResponse = Static<typeof SavedProfileResponseSchema>
export type ProfileProjectLinkRequest = Static<
  typeof ProfileProjectLinkRequestSchema
>

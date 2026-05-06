// Module: Defines shared TypeBox response contracts for API errors.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

export const ErrorResponseSchema = t.Object({
  detail: t.String(),
})

export type ErrorResponse = Static<typeof ErrorResponseSchema>

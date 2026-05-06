// Module: Defines TypeBox response contracts for service health endpoints.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

export const HealthResponseSchema = t.Object({
  status: t.Literal("ok"),
  service: t.String(),
  version: t.String(),
  environment: t.String(),
})

export type HealthResponse = Static<typeof HealthResponseSchema>

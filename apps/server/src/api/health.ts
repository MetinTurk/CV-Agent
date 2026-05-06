// Module: Exposes API health endpoints for service monitoring.
import { Elysia } from "elysia"

import type { Settings } from "../core/config"
import { HealthResponseSchema } from "../schemas/health"

export function createHealthRoutes(settings: Settings) {
  return new Elysia({ name: "health-routes" }).get(
    "/health",
    () => ({
      status: "ok" as const,
      service: settings.appName,
      version: settings.apiVersion,
      environment: settings.environment,
    }),
    {
      response: HealthResponseSchema,
    }
  )
}

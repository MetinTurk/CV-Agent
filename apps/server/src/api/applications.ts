// Module: Exposes authenticated application history and manual status endpoints.
import { Elysia } from "elysia"

import { JobAnalysisRepository } from "../db/repositories/job-analyses"
import type { JobAnalysisRecord } from "../db/schema"
import { ErrorResponseSchema } from "../schemas/error"
import {
  ApplicationsListResponseSchema,
  ApplicationStatusUpdateRequestSchema,
  ApplicationStatusUpdateResponseSchema,
  type ApplicationSummary,
} from "../schemas/applications"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"

export function createApplicationRoutes(
  authService: AuthService,
  jobAnalysisRepository = new JobAnalysisRepository()
) {
  return new Elysia({
    name: "application-routes",
    prefix: "/applications",
  })
    .get(
      "",
      async ({ headers, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const records = await jobAnalysisRepository.listByUserId(
            currentUser.id
          )

          return {
            applications: records.map(toApplicationSummary),
          }
        } catch (error) {
          if (
            error instanceof AuthenticationRequiredError ||
            error instanceof InvalidTokenError
          ) {
            return status(401, {
              detail: "Invalid or expired token",
            })
          }

          console.error("Başvuru geçmişi endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        response: {
          200: ApplicationsListResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
    .patch(
      "/:analysisId/status",
      async ({ body, headers, params, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const record =
            await jobAnalysisRepository.updateApplicationStatusForUser(
              params.analysisId,
              currentUser.id,
              body.status
            )

          if (record === null) {
            return status(404, {
              detail: "Başvuru bulunamadı.",
            })
          }

          return {
            application: toApplicationSummary(record),
          }
        } catch (error) {
          if (
            error instanceof AuthenticationRequiredError ||
            error instanceof InvalidTokenError
          ) {
            return status(401, {
              detail: "Invalid or expired token",
            })
          }

          console.error("Başvuru durumu endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ApplicationStatusUpdateRequestSchema,
        response: {
          200: ApplicationStatusUpdateResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
}

function toApplicationSummary(record: JobAnalysisRecord): ApplicationSummary {
  return {
    id: record.id,
    url: record.url,
    job_description: record.jobDescription,
    match_analysis: record.matchAnalysis ?? null,
    application_status: record.applicationStatus,
    created_at: record.createdAt.toISOString(),
  }
}

// Module: Exposes the authenticated job analysis (URL → structured description) endpoint.
import { Elysia } from "elysia"

import { ErrorResponseSchema } from "../schemas/error"
import {
  JobAnalysisCreateRequestSchema,
  JobAnalysisResponseSchema,
} from "../schemas/job-analysis"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"
import {
  JobAnalysisAgentConfigurationError,
  JobAnalysisAgentRequestError,
} from "../services/job-analysis-agent-client"
import { JobAnalysisService } from "../services/job-analysis-service"
import { ProfileSourceExtractionError } from "../services/profile-source-service"

export function createJobAnalysisRoutes(
  authService: AuthService,
  jobAnalysisService: JobAnalysisService
) {
  return new Elysia({
    name: "job-analysis-routes",
    prefix: "/job-analyses",
  }).post(
    "",
    async ({ body, headers, status }) => {
      try {
        const currentUser = await authService.authenticateAuthorizationHeader(
          headers.authorization
        )

        return await jobAnalysisService.analyzeAndSave(currentUser, body.url)
      } catch (error) {
        if (
          error instanceof AuthenticationRequiredError ||
          error instanceof InvalidTokenError
        ) {
          return status(401, {
            detail: "Invalid or expired token",
          })
        }

        if (error instanceof ProfileSourceExtractionError) {
          return status(400, {
            detail: error.message,
          })
        }

        if (error instanceof JobAnalysisAgentConfigurationError) {
          return status(500, {
            detail: error.message,
          })
        }

        if (error instanceof JobAnalysisAgentRequestError) {
          console.error("[job-analysis] agent request error:", error.message, error.cause)
          return status(502, {
            detail: error.message,
          })
        }

        console.error("İş analizi endpoint'inde beklenmeyen hata", error)

        return status(500, {
          detail:
            "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
        })
      }
    },
    {
      body: JobAnalysisCreateRequestSchema,
      response: {
        200: JobAnalysisResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        502: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    }
  )
}

// Module: Exposes the authenticated tailored-CV generation endpoint.
import { Elysia } from "elysia"

import {
  CvGenerationCreateRequestSchema,
  CvGenerationResponseSchema,
} from "../schemas/cv-generation"
import { ErrorResponseSchema } from "../schemas/error"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"
import {
  CvGenerationAgentConfigurationError,
  CvGenerationAgentRequestError,
} from "../services/cv-generation-agent-client"
import { CvGenerationService } from "../services/cv-generation-service"

export function createCvGenerationRoutes(
  authService: AuthService,
  cvGenerationService: CvGenerationService
) {
  return new Elysia({
    name: "cv-generation-routes",
    prefix: "/cv-generations",
  }).post(
    "",
    async ({ body, headers, status }) => {
      try {
        const currentUser = await authService.authenticateAuthorizationHeader(
          headers.authorization
        )

        return await cvGenerationService.generate(
          currentUser,
          body.job_description
        )
      } catch (error) {
        if (
          error instanceof AuthenticationRequiredError ||
          error instanceof InvalidTokenError
        ) {
          return status(401, {
            detail: "Invalid or expired token",
          })
        }

        if (error instanceof CvGenerationAgentConfigurationError) {
          return status(500, {
            detail: error.message,
          })
        }

        if (error instanceof CvGenerationAgentRequestError) {
          console.error(
            "[cv-generation] agent request error:",
            error.message,
            error.cause
          )
          return status(502, {
            detail: error.message,
          })
        }

        console.error("CV üretim endpoint'inde beklenmeyen hata", error)

        return status(500, {
          detail:
            "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
        })
      }
    },
    {
      body: CvGenerationCreateRequestSchema,
      response: {
        200: CvGenerationResponseSchema,
        401: ErrorResponseSchema,
        502: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    }
  )
}

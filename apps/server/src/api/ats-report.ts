// Module: Exposes the authenticated ATS compatibility report endpoint.
import { Elysia } from "elysia"

import {
  AtsReportCreateRequestSchema,
  AtsReportResponseSchema,
} from "../schemas/ats-report"
import { ErrorResponseSchema } from "../schemas/error"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"
import { AtsReportService } from "../services/ats-report-service"

export function createAtsReportRoutes(
  authService: AuthService,
  atsReportService: AtsReportService
) {
  return new Elysia({
    name: "ats-report-routes",
    prefix: "/ats-reports",
  }).post(
    "",
    async ({ body, headers, status }) => {
      try {
        await authService.authenticateAuthorizationHeader(headers.authorization)

        return atsReportService.generate(body)
      } catch (error) {
        if (
          error instanceof AuthenticationRequiredError ||
          error instanceof InvalidTokenError
        ) {
          return status(401, {
            detail: "Invalid or expired token",
          })
        }

        console.error("ATS raporu endpoint'inde beklenmeyen hata", error)

        return status(500, {
          detail:
            "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
        })
      }
    },
    {
      body: AtsReportCreateRequestSchema,
      response: {
        200: AtsReportResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    }
  )
}

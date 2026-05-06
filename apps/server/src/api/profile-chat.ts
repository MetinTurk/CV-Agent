// Module: Exposes the authenticated profile collection chat endpoint.
import { Elysia } from "elysia"

import { ErrorResponseSchema } from "../schemas/error"
import {
  ProfileChatDocumentRequestSchema,
  ProfileChatRequestSchema,
  ProfileChatResponseSchema,
} from "../schemas/profile-chat"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"
import {
  ProfileAgentConfigurationError,
  ProfileAgentRequestError,
} from "../services/profile-agent-client"
import { ProfileChatService } from "../services/profile-chat-service"
import {
  ProfileSourceExtractionError,
  ProfileSourceService,
} from "../services/profile-source-service"

export function createProfileChatRoutes(
  authService: AuthService,
  profileChatService: ProfileChatService,
  profileSourceService: ProfileSourceService = new ProfileSourceService()
) {
  return new Elysia({
    name: "profile-chat-routes",
    prefix: "/profile-chat",
  })
    .post(
      "/message",
      async ({ body, headers, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const sourceContext =
            body.source === undefined
              ? undefined
              : await profileSourceService.extract({
                  type: "url",
                  url: body.source.value,
                })

          return await profileChatService.chat(currentUser, body, sourceContext)
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

          if (error instanceof ProfileAgentConfigurationError) {
            return status(500, {
              detail: error.message,
            })
          }

          if (error instanceof ProfileAgentRequestError) {
            return status(502, {
              detail: error.message,
            })
          }

          console.error("Profil chat endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileChatRequestSchema,
        response: {
          200: ProfileChatResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          502: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
    .post(
      "/document",
      async ({ body, headers, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const sourceContext = await profileSourceService.extract({
            type: "docx",
            file: body.document,
          })
          const trimmedMessage = body.message?.trim()
          const message =
            trimmedMessage !== undefined && trimmedMessage.length > 0
              ? trimmedMessage
              : "Yüklediğim DOCX dokümanındaki profil bilgilerimi kullan."

          return await profileChatService.chat(
            currentUser,
            {
              message,
              session_id: body.session_id,
            },
            sourceContext
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

          if (error instanceof ProfileSourceExtractionError) {
            return status(400, {
              detail: error.message,
            })
          }

          if (error instanceof ProfileAgentConfigurationError) {
            return status(500, {
              detail: error.message,
            })
          }

          if (error instanceof ProfileAgentRequestError) {
            return status(502, {
              detail: error.message,
            })
          }

          console.error("Profil chat endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileChatDocumentRequestSchema,
        response: {
          200: ProfileChatResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          502: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
}

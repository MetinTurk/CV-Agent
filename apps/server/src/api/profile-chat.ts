// Module: Exposes the authenticated profile collection chat endpoint.
import { Elysia } from "elysia"

import { ErrorResponseSchema } from "../schemas/error"
import {
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

export function createProfileChatRoutes(
  authService: AuthService,
  profileChatService: ProfileChatService
) {
  return new Elysia({
    name: "profile-chat-routes",
    prefix: "/profile-chat",
  }).post(
    "/message",
    async ({ body, headers, status }) => {
      try {
        const currentUser = await authService.authenticateAuthorizationHeader(
          headers.authorization
        )

        return await profileChatService.chat(currentUser, body)
      } catch (error) {
        if (
          error instanceof AuthenticationRequiredError ||
          error instanceof InvalidTokenError
        ) {
          return status(401, {
            detail: "Invalid or expired token",
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
        401: ErrorResponseSchema,
        502: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    }
  )
}

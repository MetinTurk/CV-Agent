// Module: Exposes authenticated saved profile retrieval and update endpoints.
import { Elysia } from "elysia"

import { ProfileRepository } from "../db/repositories/profiles"
import { ErrorResponseSchema } from "../schemas/error"
import { ProfileDataSchema } from "../schemas/profile-chat"
import { SavedProfileResponseSchema } from "../schemas/profile"
import {
  AuthenticationRequiredError,
  AuthService,
  InvalidTokenError,
} from "../services/auth-service"

export function createProfileRoutes(
  authService: AuthService,
  profileRepository: ProfileRepository = new ProfileRepository()
) {
  return new Elysia({
    name: "profile-routes",
    prefix: "/profile",
  })
    .get(
      "",
      async ({ headers, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const profile = await profileRepository.getByUserId(currentUser.id)

          if (profile === null) {
            return status(404, {
              detail: "Kayıtlı profil bulunamadı.",
            })
          }

          return {
            profile: profile.data,
            updated_at: profile.updatedAt.toISOString(),
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

          console.error("Profil endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        response: {
          200: SavedProfileResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
    .put(
      "",
      async ({ headers, body, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const profile = await profileRepository.upsertForUser(
            currentUser.id,
            body
          )

          return {
            profile: profile.data,
            updated_at: profile.updatedAt.toISOString(),
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

          console.error("Profil güncelleme endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileDataSchema,
        response: {
          200: SavedProfileResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
}

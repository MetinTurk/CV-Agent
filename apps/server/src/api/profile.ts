// Module: Exposes authenticated saved profile retrieval and update endpoints.
import { Elysia } from "elysia"

import { ProfileRepository } from "../db/repositories/profiles"
import { ErrorResponseSchema } from "../schemas/error"
import { ProfileDataSchema } from "../schemas/profile-chat"
import {
  ProfileCertificationDocumentRequestSchema,
  ProfileCertificationLinkRequestSchema,
  ProfileProjectLinkRequestSchema,
  SavedProfileResponseSchema,
} from "../schemas/profile"
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

          console.error(
            "Profil güncelleme endpoint'inde beklenmeyen hata",
            error
          )

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
    .post(
      "/projects",
      async ({ headers, body, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const parsedUrl = new URL(body.url)
          const profile = await profileRepository.appendProject(
            currentUser.id,
            parsedUrl.toString()
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

          if (error instanceof TypeError) {
            return status(400, {
              detail: "Geçerli bir proje bağlantısı girin.",
            })
          }

          console.error("Proje ekleme endpoint'inde beklenmeyen hata", error)

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileProjectLinkRequestSchema,
        response: {
          200: SavedProfileResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
    .post(
      "/certifications",
      async ({ headers, body, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const parsedUrl = new URL(body.url)
          const profile = await profileRepository.appendCertification(
            currentUser.id,
            parsedUrl.toString()
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

          if (error instanceof TypeError) {
            return status(400, {
              detail: "Geçerli bir sertifika bağlantısı girin.",
            })
          }

          console.error(
            "Sertifika ekleme endpoint'inde beklenmeyen hata",
            error
          )

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileCertificationLinkRequestSchema,
        response: {
          200: SavedProfileResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
    .post(
      "/certifications/document",
      async ({ headers, body, status }) => {
        try {
          const currentUser = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )
          const fileName =
            body.document.name.trim().length > 0
              ? body.document.name.trim()
              : "Yüklenen sertifika belgesi"
          const profile = await profileRepository.appendCertification(
            currentUser.id,
            `Belge: ${fileName}`
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

          console.error(
            "Sertifika belge yükleme endpoint'inde beklenmeyen hata",
            error
          )

          return status(500, {
            detail:
              "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
          })
        }
      },
      {
        body: ProfileCertificationDocumentRequestSchema,
        response: {
          200: SavedProfileResponseSchema,
          401: ErrorResponseSchema,
          422: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      }
    )
}

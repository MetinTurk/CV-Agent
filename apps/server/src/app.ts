// Module: Creates and configures the Elysia application instance.
import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"

import { createAuthRoutes } from "./api/auth"
import { createHealthRoutes } from "./api/health"
import { createJobAnalysisRoutes } from "./api/job-analysis"
import { createProfileRoutes } from "./api/profile"
import { createProfileChatRoutes } from "./api/profile-chat"
import { getCorsOrigins, type Settings } from "./core/config"
import { ProfileRepository } from "./db/repositories/profiles"
import { UserRepository } from "./db/repositories/users"
import { AuthService } from "./services/auth-service"
import { JobAnalysisService } from "./services/job-analysis-service"
import { ProfileChatService } from "./services/profile-chat-service"

export function createApp(settings: Settings) {
  const userRepository = new UserRepository()
  const profileRepository = new ProfileRepository()
  const authService = new AuthService(userRepository, settings)
  const profileChatService = new ProfileChatService(
    settings,
    undefined,
    profileRepository
  )
  const jobAnalysisService = new JobAnalysisService(
    settings,
    undefined,
    undefined,
    undefined,
    profileRepository
  )

  return new Elysia()
    .use(
      cors({
        origin: getCorsOrigins(settings),
        credentials: true,
        methods: "*",
        allowedHeaders: "*",
      })
    )
    .onError(({ code, error, status }) => {
      if (code === "VALIDATION") {
        return status(422, {
          detail:
            error instanceof Error
              ? error.message
              : "İstek alanlarını kontrol edin.",
        })
      }

      if (code === "NOT_FOUND") {
        return status(404, {
          detail: "İstenen kaynak bulunamadı.",
        })
      }

      console.error(error)

      return status(500, {
        detail: "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
      })
    })
    .get("/", () => ({
      service: settings.appName,
      status: "ok",
      docs: "/api/health",
    }))
    .group("/api", (api) =>
      api
        .use(createAuthRoutes(authService))
        .use(createHealthRoutes(settings))
        .use(createProfileRoutes(authService, profileRepository))
        .use(createProfileChatRoutes(authService, profileChatService))
        .use(createJobAnalysisRoutes(authService, jobAnalysisService))
    )
}

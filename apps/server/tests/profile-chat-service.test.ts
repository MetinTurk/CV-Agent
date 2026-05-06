// Module: Verifies that profile chat delegates message handling to the LLM agent.
import { expect, test } from "bun:test"

import type { Settings } from "../src/core/config"
import type { UserRecord } from "../src/db/schema"
import type { ProfileAgentRequest } from "../src/services/profile-agent-client"
import { ProfileChatService } from "../src/services/profile-chat-service"

const testSettings: Settings = {
  appName: "CV Agent API",
  apiVersion: "0.1.0",
  environment: "test",
  host: "0.0.0.0",
  port: 3000,
  databaseUrl: "postgres://postgres:postgres@localhost:5432/cv_agent",
  accessTokenSecret: "test-secret",
  accessTokenExpireMinutes: 60,
  corsAllowedOrigins: ["http://localhost:5173"],
  corsAllowedOriginRegex: null,
  googleApiKey: "test-google-api-key",
  profileAgentModel: "gemini-3-flash-preview",
  profileAgentRequestTimeoutSeconds: 20,
  profileAgentMaxRetries: 1,
}

const testUser: UserRecord = {
  id: "f4f2fdac-c49d-4cab-a9c8-1a717ca6a641",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
}

test("profile chat sends user messages to the LLM agent", async () => {
  const agentRequests: ProfileAgentRequest[] = []
  const service = new ProfileChatService(testSettings, {
    async generateResponse(request) {
      agentRequests.push(request)

      return {
        reply: "Kaydettim. Eğitim bilgini paylaşır mısın?",
        profilePatch: {
          full_name: "Ayşe Yılmaz",
          location: "İstanbul",
          skills: ["React", "TypeScript"],
        },
      }
    },
  })

  const response = await service.chat(testUser, {
    message: "Ben Ayşe Yılmaz, İstanbul'dayım. React ve TypeScript biliyorum.",
    session_id: "first-login-profile",
  })

  expect(agentRequests).toHaveLength(1)
  expect(agentRequests[0]?.message).toBe(
    "Ben Ayşe Yılmaz, İstanbul'dayım. React ve TypeScript biliyorum."
  )
  expect(response.reply).toBe("Kaydettim. Eğitim bilgini paylaşır mısın?")
  expect(response.profile.full_name).toBe("Ayşe Yılmaz")
  expect(response.profile.location).toBe("İstanbul")
  expect(response.profile.skills).toEqual(["React", "TypeScript"])
  expect(response.missing_required_fields).toEqual(["education"])
  expect(response.is_profile_ready).toBe(false)
})

test("profile chat forwards extracted source context to the LLM agent", async () => {
  const agentRequests: ProfileAgentRequest[] = []
  const service = new ProfileChatService(testSettings, {
    async generateResponse(request) {
      agentRequests.push(request)

      return {
        reply: "DOCX içeriğini kaydettim. Eğitim bilgini paylaşır mısın?",
        profilePatch: {
          projects: ["Kariyer takip paneli"],
        },
      }
    },
  })

  const response = await service.chat(
    testUser,
    {
      message: "Bu dokümandaki profil bilgilerimi kullan.",
      session_id: "first-login-profile",
    },
    {
      type: "docx",
      label: "profile.docx",
      content: "Kariyer takip paneli projesinde React kullandım.",
    }
  )

  expect(agentRequests).toHaveLength(1)
  expect(agentRequests[0]?.sourceContext).toEqual({
    type: "docx",
    label: "profile.docx",
    content: "Kariyer takip paneli projesinde React kullandım.",
  })
  expect(response.profile.projects).toEqual(["Kariyer takip paneli"])
})

test("profile chat does not generate a local fallback response when LLM fails", async () => {
  const service = new ProfileChatService(testSettings, {
    async generateResponse() {
      throw new Error("LLM unavailable")
    },
  })

  await expect(
    service.chat(testUser, {
      message: "Adım Ayşe Yılmaz ve İstanbul'dayım.",
      session_id: "first-login-profile",
    })
  ).rejects.toThrow("LLM unavailable")
})

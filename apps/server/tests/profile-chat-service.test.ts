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
  groqApiKey: "test-groq-api-key",
  openRouterApiKey: null,
  agentModel: "openai/gpt-oss-120b",
  agentRequestTimeoutSeconds: 20,
  agentMaxRetries: 1,
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
  const savedProfiles: unknown[] = []
  const service = new ProfileChatService(
    testSettings,
    {
      async generateResponse(request) {
        agentRequests.push(request)

        return {
          reply: "Kaydettim. Eğitim bilgini paylaşır mısın?",
          profilePatch: {
            full_name: "Ayşe Yılmaz",
            location: "İstanbul",
            skills: ["React", "TypeScript"],
          },
          askedAbout: [],
        }
      },
    },
    {
      async upsertForUser(_userId, profileData) {
        savedProfiles.push(profileData)
      },
    }
  )

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
  expect(response.redirect_to).toBe(null)
  expect(savedProfiles).toHaveLength(0)
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
        askedAbout: [],
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

test("profile chat saves profile and returns redirect when required fields are complete", async () => {
  const savedProfiles: Array<{ userId: string; profileData: unknown }> = []
  const service = new ProfileChatService(
    testSettings,
    {
      async generateResponse() {
        return {
          reply: "Profilin hazır. Profil sayfana yönlendiriyorum.",
          profilePatch: {
            full_name: "Ayşe Yılmaz",
            location: "İstanbul",
            skills: ["React", "TypeScript"],
            education: "Boğaziçi Üniversitesi Bilgisayar Mühendisliği",
          },
          askedAbout: [
            "work_experiences",
            "projects",
            "certifications",
            "languages",
            "additional_information",
          ],
        }
      },
    },
    {
      async upsertForUser(userId, profileData) {
        savedProfiles.push({ userId, profileData })
      },
    }
  )

  const response = await service.chat(testUser, {
    message:
      "Adım Ayşe Yılmaz. İstanbul'dayım. React ve TypeScript biliyorum. Boğaziçi Üniversitesi Bilgisayar Mühendisliği mezunuyum.",
    session_id: "first-login-profile",
  })

  expect(response.is_profile_ready).toBe(true)
  expect(response.missing_required_fields).toEqual([])
  expect(response.redirect_to).toBe("/profile")
  expect(savedProfiles).toEqual([
    {
      userId: testUser.id,
      profileData: response.profile,
    },
  ])
})

test("profile chat imports GitHub projects when an optional GitHub URL is saved", async () => {
  const savedProfiles: Array<{ userId: string; profileData: unknown }> = []
  const service = new ProfileChatService(
    testSettings,
    {
      async generateResponse() {
        return {
          reply: "Profilin hazır. GitHub projelerini de ekledim.",
          profilePatch: {
            full_name: "Ayşe Yılmaz",
            location: "İstanbul",
            skills: ["React", "TypeScript"],
            education: "Boğaziçi Üniversitesi Bilgisayar Mühendisliği",
            github_url: "https://github.com/ayse",
          },
          askedAbout: [
            "work_experiences",
            "projects",
            "certifications",
            "languages",
            "additional_information",
          ],
        }
      },
    },
    {
      async upsertForUser(userId, profileData) {
        savedProfiles.push({ userId, profileData })
      },
    },
    {
      async importProfileProjects() {
        return {
          canonicalProfileUrl: "https://github.com/ayse",
          projects: [
            "cv-agent [TypeScript] - CV üretim platformu (https://github.com/ayse/cv-agent)",
          ],
        }
      },
    }
  )

  const response = await service.chat(testUser, {
    message:
      "Adım Ayşe Yılmaz. İstanbul'dayım. React ve TypeScript biliyorum. GitHub profilim https://github.com/ayse",
    session_id: "first-login-profile-github",
  })

  expect(response.is_profile_ready).toBe(true)
  expect(response.profile.github_url).toBe("https://github.com/ayse")
  expect(response.profile.projects).toEqual([
    "cv-agent [TypeScript] - CV üretim platformu (https://github.com/ayse/cv-agent)",
  ])
  expect(savedProfiles).toEqual([
    {
      userId: testUser.id,
      profileData: response.profile,
    },
  ])
})

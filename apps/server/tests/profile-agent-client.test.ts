// Module: Verifies Groq profile agent response parsing edge cases.
import { expect, test } from "bun:test"

import {
  parseProfileAgentResult,
  ProfileAgentClient,
  ProfileAgentRequestError,
} from "../src/services/profile-agent-client"
import type { Settings } from "../src/core/config"
import type { ProfileAgentRequest } from "../src/services/profile-agent-client"

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
  agentModel: "openai/gpt-oss-120b",
  agentRequestTimeoutSeconds: 20,
  agentMaxRetries: 0,
}

const testRequest: ProfileAgentRequest = {
  message: "Adım Ayşe Yılmaz.",
  profile: {
    full_name: null,
    location: null,
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    work_experiences: [],
    education: null,
    additional_information: null,
  },
  missingRequiredFields: ["full_name", "location", "skills", "education"],
  conversationMessages: [],
}

test("profile agent parser ignores null and unknown patch fields", () => {
  const result = parseProfileAgentResult(
    JSON.stringify({
      reply: "Adını kaydettim. Nerede yaşıyorsun?",
      profile_patch: {
        full_name: "Ayşe Yılmaz",
        location: null,
        skills: null,
        unknown_field: "write-me-not",
      },
    })
  )

  expect(result.reply).toBe("Adını kaydettim. Nerede yaşıyorsun?")
  expect(result.profilePatch).toEqual({
    full_name: "Ayşe Yılmaz",
  })
})

test("profile agent parser ignores incorrectly typed patch fields", () => {
  const result = parseProfileAgentResult(
    JSON.stringify({
      reply: "Bilgileri kontrol ettim.",
      profile_patch: {
        full_name: 42,
        skills: ["React", 42],
        projects: ["CV Agent"],
      },
    })
  )

  expect(result.profilePatch).toEqual({
    projects: ["CV Agent"],
  })
})

test("profile agent client classifies malformed LLM JSON as request error", async () => {
  const originalFetch = globalThis.fetch
  const mockFetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"reply": 42, "profile_patch": {}}',
            },
          },
        ],
      }),
      { status: 200 }
    )

  globalThis.fetch = Object.assign(mockFetch, {
    preconnect: originalFetch.preconnect,
  }) as typeof fetch

  try {
    const client = new ProfileAgentClient(testSettings)

    await expect(client.generateResponse(testRequest)).rejects.toThrow(
      ProfileAgentRequestError
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

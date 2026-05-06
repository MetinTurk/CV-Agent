// Module: Verifies Elysia runtime settings defaults and environment overrides.
import { afterEach, expect, test } from "bun:test"

import { getSettings, resetSettingsCache } from "../src/core/config"

afterEach(() => {
  delete Bun.env.PROFILE_AGENT_MODEL
  delete Bun.env.PROFILE_AGENT_REQUEST_TIMEOUT_SECONDS
  delete Bun.env.PROFILE_AGENT_MAX_RETRIES
  resetSettingsCache()
})

test("default profile agent model is supported Gemini Flash model", () => {
  delete Bun.env.PROFILE_AGENT_MODEL
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.profileAgentModel).toBe("gemini-3-flash-preview")
})

test("default profile agent request settings avoid long pending responses", () => {
  delete Bun.env.PROFILE_AGENT_REQUEST_TIMEOUT_SECONDS
  delete Bun.env.PROFILE_AGENT_MAX_RETRIES
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.profileAgentRequestTimeoutSeconds).toBe(30)
  expect(settings.profileAgentMaxRetries).toBe(1)
})

test("profile agent model can be overridden", () => {
  Bun.env.PROFILE_AGENT_MODEL = "gemini-3-flash-preview"
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.profileAgentModel).toBe("gemini-3-flash-preview")
})

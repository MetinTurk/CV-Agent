// Module: Verifies Elysia runtime settings defaults and environment overrides.
import { afterEach, expect, test } from "bun:test"

import { getSettings, resetSettingsCache } from "../src/core/config"

afterEach(() => {
  delete Bun.env.PROFILE_AGENT_MODEL
  resetSettingsCache()
})

test("default profile agent model is supported Gemini model", () => {
  delete Bun.env.PROFILE_AGENT_MODEL
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.profileAgentModel).toBe("google_genai:gemini-3-pro-preview")
})

test("profile agent model can be overridden", () => {
  Bun.env.PROFILE_AGENT_MODEL = "google_genai:gemini-3-flash-preview"
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.profileAgentModel).toBe("google_genai:gemini-3-flash-preview")
})

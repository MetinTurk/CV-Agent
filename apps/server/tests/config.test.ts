// Module: Verifies Elysia runtime settings defaults and environment overrides.
import { afterEach, expect, test } from "bun:test"

import { getSettings, resetSettingsCache } from "../src/core/config"

afterEach(() => {
  delete Bun.env.AGENT_MODEL
  delete Bun.env.AGENT_REQUEST_TIMEOUT_SECONDS
  delete Bun.env.AGENT_MAX_RETRIES
  resetSettingsCache()
})

test("default agent model is the configured OpenRouter Qwen model", () => {
  delete Bun.env.AGENT_MODEL
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.agentModel).toBe("qwen/qwen3-32b")
})

test("default agent request settings avoid long pending responses", () => {
  delete Bun.env.AGENT_REQUEST_TIMEOUT_SECONDS
  delete Bun.env.AGENT_MAX_RETRIES
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.agentRequestTimeoutSeconds).toBe(30)
  expect(settings.agentMaxRetries).toBe(1)
})

test("agent model can be overridden", () => {
  Bun.env.AGENT_MODEL = "openai/gpt-oss-20b"
  resetSettingsCache()

  const settings = getSettings()

  expect(settings.agentModel).toBe("openai/gpt-oss-20b")
})

test("development CORS origin regex allows Chrome extensions", () => {
  resetSettingsCache()

  const settings = getSettings()
  const originPattern = new RegExp(settings.corsAllowedOriginRegex ?? "")

  expect(
    originPattern.test("chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
  ).toBe(true)
})

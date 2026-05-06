// Module: Defines typed runtime settings for the Elysia application.
const DEFAULT_CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
const DEFAULT_DEVELOPMENT_CORS_ORIGIN_REGEX =
  "^http://(localhost|127\\.0\\.0\\.1):[0-9]+$"
const DEFAULT_DATABASE_URL =
  "postgres://postgres:postgres@localhost:5432/cv_agent"

export type Settings = {
  appName: string
  apiVersion: string
  environment: string
  host: string
  port: number
  databaseUrl: string
  accessTokenSecret: string
  accessTokenExpireMinutes: number
  corsAllowedOrigins: string[]
  corsAllowedOriginRegex: string | null
  groqApiKey: string | null
  agentModel: string
  agentRequestTimeoutSeconds: number
  agentMaxRetries: number
}

let cachedSettings: Settings | null = null

export function parseCsvEnv(
  value: string | undefined,
  defaultValue: string[]
): string[] {
  if (value === undefined) {
    return defaultValue
  }

  const parsedValues = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return parsedValues.length > 0 ? parsedValues : defaultValue
}

function parseNumberEnv(
  value: string | undefined,
  defaultValue: number
): number {
  if (value === undefined) {
    return defaultValue
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue
}

function parseIntegerEnv(
  value: string | undefined,
  defaultValue: number
): number {
  if (value === undefined) {
    return defaultValue
  }

  const parsedValue = Number.parseInt(value, 10)
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue
}

function optionalEnv(value: string | undefined): string | null {
  if (value === undefined) {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export function resetSettingsCache(): void {
  cachedSettings = null
}

export function getSettings(): Settings {
  if (cachedSettings !== null) {
    return cachedSettings
  }

  const environment = Bun.env.ENVIRONMENT ?? "development"
  const defaultCorsAllowedOriginRegex =
    environment === "development" ? DEFAULT_DEVELOPMENT_CORS_ORIGIN_REGEX : null

  cachedSettings = {
    appName: Bun.env.APP_NAME ?? "CV Agent API",
    apiVersion: Bun.env.API_VERSION ?? "0.1.0",
    environment,
    host: Bun.env.HOST ?? "0.0.0.0",
    port: parseIntegerEnv(Bun.env.PORT, 3000),
    databaseUrl: Bun.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    accessTokenSecret:
      Bun.env.ACCESS_TOKEN_SECRET ?? "development-only-change-me",
    accessTokenExpireMinutes: parseIntegerEnv(
      Bun.env.ACCESS_TOKEN_EXPIRE_MINUTES,
      60
    ),
    corsAllowedOrigins: parseCsvEnv(
      Bun.env.CORS_ALLOWED_ORIGINS,
      DEFAULT_CORS_ALLOWED_ORIGINS
    ),
    corsAllowedOriginRegex:
      Bun.env.CORS_ALLOWED_ORIGIN_REGEX ?? defaultCorsAllowedOriginRegex,
    groqApiKey: optionalEnv(Bun.env.GROQ_API_KEY),
    agentModel: Bun.env.AGENT_MODEL ?? "openai/gpt-oss-120b",
    agentRequestTimeoutSeconds: parseNumberEnv(
      Bun.env.AGENT_REQUEST_TIMEOUT_SECONDS,
      30
    ),
    agentMaxRetries: parseIntegerEnv(Bun.env.AGENT_MAX_RETRIES, 1),
  }

  return cachedSettings
}

export function getCorsOrigins(settings: Settings): Array<string | RegExp> {
  const origins: Array<string | RegExp> = [...settings.corsAllowedOrigins]

  if (settings.corsAllowedOriginRegex === null) {
    return origins
  }

  try {
    origins.push(new RegExp(settings.corsAllowedOriginRegex))
  } catch {
    console.warn("CORS_ALLOWED_ORIGIN_REGEX geçersiz olduğu için yok sayıldı.")
  }

  return origins
}

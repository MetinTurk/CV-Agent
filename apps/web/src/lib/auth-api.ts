// Module: Provides typed HTTP helpers for the authentication API.
export type AuthUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}

export type AuthResponse = {
  access_token: string
  token_type: "bearer"
  expires_in: number
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  first_name: string
  last_name: string
  email: string
  password: string
}

type ApiRequestOptions = {
  method?: "GET" | "POST"
  body?: unknown
  token?: string
}

type ApiErrorPayload = {
  detail?: unknown
}

type ApiValidationError = {
  loc?: unknown
  msg?: unknown
  type?: unknown
  ctx?: unknown
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"
).replace(/\/$/, "")

const FIELD_LABELS: Record<string, string> = {
  first_name: "Ad",
  last_name: "Soyad",
  email: "E-posta",
  password: "Şifre",
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null && "detail" in value
}

function isValidationErrorItem(value: unknown): value is ApiValidationError {
  return typeof value === "object" && value !== null
}

function getValidationField(error: ApiValidationError): string {
  if (!Array.isArray(error.loc)) {
    return "Alan"
  }

  for (let index = error.loc.length - 1; index >= 0; index -= 1) {
    const field = error.loc[index]
    if (typeof field === "string") {
      return FIELD_LABELS[field] ?? field
    }
  }

  return "Alan"
}

function getMinLength(error: ApiValidationError): number | null {
  if (typeof error.ctx !== "object" || error.ctx === null) {
    return null
  }

  if (!("min_length" in error.ctx)) {
    return null
  }

  const minLength = error.ctx.min_length
  return typeof minLength === "number" ? minLength : null
}

function getMaxLength(error: ApiValidationError): number | null {
  if (typeof error.ctx !== "object" || error.ctx === null) {
    return null
  }

  if (!("max_length" in error.ctx)) {
    return null
  }

  const maxLength = error.ctx.max_length
  return typeof maxLength === "number" ? maxLength : null
}

function formatValidationError(error: ApiValidationError): string {
  const field = getValidationField(error)
  const errorType = typeof error.type === "string" ? error.type : ""
  const minLength = getMinLength(error)
  const maxLength = getMaxLength(error)

  if (errorType === "missing") {
    return `${field} alanı zorunludur.`
  }

  if (errorType === "string_too_short") {
    if (minLength === 1) {
      return `${field} alanı zorunludur.`
    }

    if (minLength !== null) {
      return `${field} en az ${minLength} karakter olmalıdır.`
    }
  }

  if (errorType === "string_too_long" && maxLength !== null) {
    return `${field} en fazla ${maxLength} karakter olmalıdır.`
  }

  if (field === "E-posta") {
    return "Geçerli bir e-posta adresi girin."
  }

  return `${field} alanını kontrol edin.`
}

function getErrorMessage(payload: unknown): string {
  if (!isApiErrorPayload(payload)) {
    return "İstek tamamlanamadı."
  }

  if (typeof payload.detail === "string") {
    return payload.detail
  }

  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .filter(isValidationErrorItem)
      .map(formatValidationError)

    if (messages.length > 0) {
      return messages.join("\n")
    }

    return "Form alanlarını kontrol edin."
  }

  return "İstek tamamlanamadı."
}

async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    let errorPayload: unknown = null

    try {
      errorPayload = await response.json()
    } catch {
      throw new Error("İstek tamamlanamadı.")
    }

    throw new Error(getErrorMessage(errorPayload))
  }

  return response.json() as Promise<T>
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  })
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  })
}

export function getCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", {
    token,
  })
}

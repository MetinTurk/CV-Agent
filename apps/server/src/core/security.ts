// Module: Provides password hashing and JWT signing helpers for authentication.
import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

import type { Settings } from "./config"

const JWT_ALGORITHM = "HS256"
const PASSWORD_ALGORITHM = "pbkdf2_sha256"
const PASSWORD_ITERATIONS = 200_000

type JwtPayload = {
  sub: string
  exp: number
  iat: number
}

function base64urlEncode(value: Buffer): string {
  return value.toString("base64url")
}

function base64urlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url")
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const passwordHash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    32,
    "sha256"
  )

  return [
    PASSWORD_ALGORITHM,
    PASSWORD_ITERATIONS.toString(),
    base64urlEncode(salt),
    base64urlEncode(passwordHash),
  ].join("$")
}

export function verifyPassword(
  password: string,
  storedPasswordHash: string
): boolean {
  const parts = storedPasswordHash.split("$")
  if (parts.length !== 4) {
    return false
  }

  const [algorithm, iterationsText, saltText, expectedHashText] = parts
  if (algorithm !== PASSWORD_ALGORITHM) {
    return false
  }

  const iterations = Number.parseInt(iterationsText, 10)
  if (!Number.isFinite(iterations)) {
    return false
  }

  let salt: Buffer
  let expectedHash: Buffer

  try {
    salt = base64urlDecode(saltText)
    expectedHash = base64urlDecode(expectedHashText)
  } catch {
    return false
  }

  const passwordHash = pbkdf2Sync(
    password,
    salt,
    iterations,
    expectedHash.length,
    "sha256"
  )

  if (passwordHash.length !== expectedHash.length) {
    return false
  }

  return timingSafeEqual(passwordHash, expectedHash)
}

export function createAccessToken(
  subject: string,
  settings: Settings,
  expiresInMinutes = settings.accessTokenExpireMinutes
): string {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + expiresInMinutes * 60
  const header = {
    alg: JWT_ALGORITHM,
    typ: "JWT",
  }
  const payload: JwtPayload = {
    sub: subject,
    exp: expiresAt,
    iat: issuedAt,
  }

  const encodedHeader = base64urlEncode(
    Buffer.from(JSON.stringify(header), "utf8")
  )
  const encodedPayload = base64urlEncode(
    Buffer.from(JSON.stringify(payload), "utf8")
  )
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac("sha256", settings.accessTokenSecret)
    .update(signingInput)
    .digest()

  return `${signingInput}.${base64urlEncode(signature)}`
}

export function decodeAccessToken(
  token: string,
  settings: Settings
): JwtPayload {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".")
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid token")
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = createHmac("sha256", settings.accessTokenSecret)
    .update(signingInput)
    .digest()
  const providedSignature = base64urlDecode(encodedSignature)

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error("Invalid token signature")
  }

  const header = JSON.parse(
    base64urlDecode(encodedHeader).toString("utf8")
  ) as {
    alg?: unknown
  }
  if (header.alg !== JWT_ALGORITHM) {
    throw new Error("Invalid token algorithm")
  }

  const payload = JSON.parse(
    base64urlDecode(encodedPayload).toString("utf8")
  ) as Partial<JwtPayload>

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid token subject")
  }

  if (typeof payload.exp !== "number" || Date.now() / 1000 >= payload.exp) {
    throw new Error("Expired token")
  }

  if (typeof payload.iat !== "number") {
    throw new Error("Invalid token issued time")
  }

  return {
    sub: payload.sub,
    exp: payload.exp,
    iat: payload.iat,
  }
}

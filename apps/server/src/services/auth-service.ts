// Module: Implements authentication use cases independently from HTTP routes.
import type { Settings } from "../core/config"
import {
  createAccessToken,
  decodeAccessToken,
  hashPassword,
  verifyPassword,
} from "../core/security"
import type { UserRecord } from "../db/schema"
import {
  isUniqueConstraintError,
  UserRepository,
} from "../db/repositories/users"
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from "../schemas/auth"

export class DuplicateEmailError extends Error {}
export class InvalidCredentialsError extends Error {}
export class AuthenticationRequiredError extends Error {}
export class InvalidTokenError extends Error {}

export class AuthValidationError extends Error {
  constructor(public readonly detail: string) {
    super(detail)
  }
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly settings: Settings
  ) {}

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const normalizedRequest = normalizeRegisterRequest(request)
    const existingUser = await this.userRepository.getByEmail(
      normalizedRequest.email
    )
    if (existingUser !== null) {
      throw new DuplicateEmailError()
    }

    try {
      const user = await this.userRepository.create({
        email: normalizedRequest.email,
        firstName: normalizedRequest.first_name,
        lastName: normalizedRequest.last_name,
        passwordHash: hashPassword(normalizedRequest.password),
      })

      return this.createAuthResponse(user)
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new DuplicateEmailError()
      }

      throw error
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const normalizedEmail = normalizeEmail(request.email)
    const user = await this.userRepository.getByEmail(normalizedEmail)

    if (user === null || !verifyPassword(request.password, user.passwordHash)) {
      throw new InvalidCredentialsError()
    }

    return this.createAuthResponse(user)
  }

  async getUser(userId: string): Promise<UserRecord | null> {
    return this.userRepository.getById(userId)
  }

  async authenticateAuthorizationHeader(
    authorizationHeader: string | undefined
  ): Promise<UserRecord> {
    if (authorizationHeader === undefined) {
      throw new AuthenticationRequiredError()
    }

    const [scheme, token] = authorizationHeader.split(" ")
    if (scheme !== "Bearer" || !token) {
      throw new InvalidTokenError()
    }

    try {
      const payload = decodeAccessToken(token, this.settings)
      const user = await this.getUser(payload.sub)

      if (user === null) {
        throw new InvalidTokenError()
      }

      return user
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw error
      }

      throw new InvalidTokenError()
    }
  }

  private createAuthResponse(user: UserRecord): AuthResponse {
    return {
      access_token: createAccessToken(user.id, this.settings),
      token_type: "bearer",
      expires_in: this.settings.accessTokenExpireMinutes * 60,
      user: toUserResponse(user),
    }
  }
}

export function toUserResponse(user: UserRecord): UserResponse {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    created_at: user.createdAt.toISOString(),
  }
}

function normalizeRegisterRequest(request: RegisterRequest): RegisterRequest {
  const firstName = normalizeText(request.first_name)
  const lastName = normalizeText(request.last_name)
  const email = normalizeEmail(request.email)

  if (firstName === null) {
    throw new AuthValidationError("Ad alanı zorunludur.")
  }

  if (lastName === null) {
    throw new AuthValidationError("Soyad alanı zorunludur.")
  }

  if (!isValidEmail(email)) {
    throw new AuthValidationError("Geçerli bir e-posta adresi girin.")
  }

  return {
    first_name: firstName,
    last_name: lastName,
    email,
    password: request.password,
  }
}

function normalizeText(value: string): string | null {
  const normalizedValue = value.trim().replace(/\s+/g, " ")
  return normalizedValue.length > 0 ? normalizedValue : null
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string): boolean {
  const [, domain] = value.split("@")
  return value.includes("@") && domain !== undefined && domain.includes(".")
}

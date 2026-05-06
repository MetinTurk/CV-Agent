// Module: Exposes authentication endpoints for account creation and JWT sessions.
import { Elysia } from "elysia"

import {
  AuthenticationRequiredError,
  AuthService,
  AuthValidationError,
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
  toUserResponse,
} from "../services/auth-service"
import {
  AuthResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  UserResponseSchema,
} from "../schemas/auth"
import { ErrorResponseSchema } from "../schemas/error"

export function createAuthRoutes(authService: AuthService) {
  return new Elysia({ name: "auth-routes", prefix: "/auth" })
    .post(
      "/register",
      async ({ body, status }) => {
        try {
          return status(201, await authService.register(body))
        } catch (error) {
          if (error instanceof DuplicateEmailError) {
            return status(409, {
              detail: "Bu e-posta adresi zaten kayıtlı.",
            })
          }

          if (error instanceof AuthValidationError) {
            return status(422, {
              detail: error.detail,
            })
          }

          throw error
        }
      },
      {
        body: RegisterRequestSchema,
        response: {
          201: AuthResponseSchema,
          409: ErrorResponseSchema,
          422: ErrorResponseSchema,
        },
      }
    )
    .post(
      "/login",
      async ({ body, status }) => {
        try {
          return await authService.login(body)
        } catch (error) {
          if (error instanceof InvalidCredentialsError) {
            return status(401, {
              detail: "E-posta veya şifre hatalı.",
            })
          }

          throw error
        }
      },
      {
        body: LoginRequestSchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
        },
      }
    )
    .get(
      "/me",
      async ({ headers, status }) => {
        try {
          const user = await authService.authenticateAuthorizationHeader(
            headers.authorization
          )

          return toUserResponse(user)
        } catch (error) {
          if (
            error instanceof AuthenticationRequiredError ||
            error instanceof InvalidTokenError
          ) {
            return status(401, {
              detail: "Invalid or expired token",
            })
          }

          throw error
        }
      },
      {
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
        },
      }
    )
}

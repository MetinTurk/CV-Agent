// Module: Defines TypeBox request and response contracts for authentication.
import { t } from "elysia"
import type { Static } from "@sinclair/typebox"

export const RegisterRequestSchema = t.Object({
  first_name: t.String({ minLength: 1, maxLength: 80 }),
  last_name: t.String({ minLength: 1, maxLength: 80 }),
  email: t.String({ minLength: 3, maxLength: 254 }),
  password: t.String({ minLength: 8, maxLength: 128 }),
})

export const LoginRequestSchema = t.Object({
  email: t.String({ minLength: 3, maxLength: 254 }),
  password: t.String({ minLength: 1, maxLength: 128 }),
})

export const UserResponseSchema = t.Object({
  id: t.String(),
  email: t.String(),
  first_name: t.String(),
  last_name: t.String(),
  created_at: t.String(),
})

export const AuthResponseSchema = t.Object({
  access_token: t.String(),
  token_type: t.Literal("bearer"),
  expires_in: t.Number(),
  user: UserResponseSchema,
})

export type RegisterRequest = Static<typeof RegisterRequestSchema>
export type LoginRequest = Static<typeof LoginRequestSchema>
export type UserResponse = Static<typeof UserResponseSchema>
export type AuthResponse = Static<typeof AuthResponseSchema>

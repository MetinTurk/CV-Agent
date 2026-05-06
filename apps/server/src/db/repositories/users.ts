// Module: Provides user persistence operations behind a repository boundary.
import { eq } from "drizzle-orm"

import { db } from "../client"
import { type NewUserRecord, type UserRecord, users } from "../schema"

export class UserRepository {
  async getById(userId: string): Promise<UserRecord | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user ?? null
  }

  async getByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    return user ?? null
  }

  async create(user: NewUserRecord): Promise<UserRecord> {
    const [createdUser] = await db.insert(users).values(user).returning()
    if (createdUser === undefined) {
      throw new Error("User could not be created.")
    }

    return createdUser
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  )
}

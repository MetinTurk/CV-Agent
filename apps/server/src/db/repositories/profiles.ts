// Module: Provides profile persistence operations behind a repository boundary.
import { eq, sql } from "drizzle-orm"

import { db } from "../client"
import { type ProfileRecord, profiles } from "../schema"
import type { ProfileData } from "../../schemas/profile-chat"

export class ProfileRepository {
  async getByUserId(userId: string): Promise<ProfileRecord | null> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1)

    return profile ?? null
  }

  async upsertForUser(
    userId: string,
    profileData: ProfileData
  ): Promise<ProfileRecord> {
    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        data: profileData,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          data: profileData,
          updatedAt: sql`now()`,
        },
      })
      .returning()

    if (profile === undefined) {
      throw new Error("Profile could not be saved.")
    }

    return profile
  }
}

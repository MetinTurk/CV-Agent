// Module: Provides profile persistence operations behind a repository boundary.
import { eq, sql } from "drizzle-orm"

import { db } from "../client"
import { type ProfileRecord, profiles } from "../schema"
import type { ProfileData } from "../../schemas/profile-chat"

type ProfileListField = "projects" | "certifications"

function createEmptyProfileData(): ProfileData {
  return {
    full_name: null,
    location: null,
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    work_experiences: [],
    education: null,
    additional_information: null,
  }
}

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

  async appendProject(userId: string, project: string): Promise<ProfileRecord> {
    return this.appendListItem(userId, "projects", project)
  }

  async appendCertification(
    userId: string,
    certification: string
  ): Promise<ProfileRecord> {
    return this.appendListItem(userId, "certifications", certification)
  }

  private async appendListItem(
    userId: string,
    field: ProfileListField,
    value: string
  ): Promise<ProfileRecord> {
    const existingProfile = await this.getByUserId(userId)
    const profileData = existingProfile?.data ?? createEmptyProfileData()
    const trimmedValue = value.trim()
    const currentValues = profileData[field]
    const hasExistingValue = currentValues.some(
      (item) =>
        item.trim().toLocaleLowerCase("tr-TR") ===
        trimmedValue.toLocaleLowerCase("tr-TR")
    )

    if (hasExistingValue) {
      return existingProfile ?? this.upsertForUser(userId, profileData)
    }

    return this.upsertForUser(userId, {
      ...profileData,
      [field]: [...currentValues, trimmedValue],
    })
  }
}

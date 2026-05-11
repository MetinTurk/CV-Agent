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
    github_url: null,
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

    return profile === undefined
      ? null
      : {
          ...profile,
          data: normalizeProfileData(profile.data),
        }
  }

  async upsertForUser(
    userId: string,
    profileData: ProfileData
  ): Promise<ProfileRecord> {
    const normalizedProfileData = normalizeProfileData(profileData)
    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        data: normalizedProfileData,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          data: normalizedProfileData,
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

  async mergeGithubProjects(
    userId: string,
    githubUrl: string,
    projects: string[]
  ): Promise<ProfileRecord> {
    const existingProfile = await this.getByUserId(userId)
    const profileData = existingProfile?.data ?? createEmptyProfileData()

    return this.upsertForUser(userId, {
      ...profileData,
      github_url: githubUrl,
      projects: mergeListValues(profileData.projects, projects),
    })
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

function normalizeProfileData(profileData: ProfileData): ProfileData {
  return {
    ...createEmptyProfileData(),
    ...profileData,
    skills: Array.isArray(profileData.skills) ? profileData.skills : [],
    projects: Array.isArray(profileData.projects) ? profileData.projects : [],
    github_url:
      typeof profileData.github_url === "string"
        ? profileData.github_url
        : null,
    certifications: Array.isArray(profileData.certifications)
      ? profileData.certifications
      : [],
    languages: Array.isArray(profileData.languages)
      ? profileData.languages
      : [],
    work_experiences: Array.isArray(profileData.work_experiences)
      ? profileData.work_experiences
      : [],
  }
}

function mergeListValues(
  currentValues: string[],
  nextValues: string[]
): string[] {
  const mergedValues = [...currentValues]
  const normalizedExisting = new Set(
    mergedValues.map((value) => value.trim().toLocaleLowerCase("tr-TR"))
  )

  for (const value of nextValues) {
    const trimmedValue = value.trim()
    if (trimmedValue.length === 0) {
      continue
    }

    const normalizedValue = trimmedValue.toLocaleLowerCase("tr-TR")
    if (!normalizedExisting.has(normalizedValue)) {
      mergedValues.push(trimmedValue)
      normalizedExisting.add(normalizedValue)
    }
  }

  return mergedValues
}

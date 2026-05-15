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
    github_url: null,
    additional_information: null,
  }
}

function normalizeProfileData(profileData: ProfileData): ProfileData {
  return {
    ...profileData,
    github_url: profileData.github_url ?? null,
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
    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        data: normalizeProfileData(profileData),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          data: normalizeProfileData(profileData),
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
    projects: Array<{ value: string; sourceUrl: string }>
  ): Promise<{ profile: ProfileRecord; importedProjects: string[] }> {
    const existingProfile = await this.getByUserId(userId)
    const profileData = existingProfile?.data ?? createEmptyProfileData()
    const currentProjects = profileData.projects
    const importedProjects: string[] = []
    const normalizedExistingProjects = new Set(
      currentProjects.map((project) => project.toLocaleLowerCase("tr-TR"))
    )

    for (const project of projects) {
      const normalizedProject = project.value.toLocaleLowerCase("tr-TR")
      const normalizedSourceUrl = project.sourceUrl.toLocaleLowerCase("tr-TR")
      const hasExistingProject =
        normalizedExistingProjects.has(normalizedProject) ||
        currentProjects.some((currentProject) =>
          currentProject
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSourceUrl)
        )

      if (hasExistingProject) {
        continue
      }

      importedProjects.push(project.value)
      normalizedExistingProjects.add(normalizedProject)
    }

    const profile = await this.upsertForUser(userId, {
      ...profileData,
      github_url: githubUrl,
      projects: [...currentProjects, ...importedProjects],
    })

    return { profile, importedProjects }
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

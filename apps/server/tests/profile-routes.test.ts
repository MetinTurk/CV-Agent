// Module: Verifies authenticated saved profile HTTP route contracts.
import { expect, test } from "bun:test"

import { createProfileRoutes } from "../src/api/profile"
import type { ProfileRepository } from "../src/db/repositories/profiles"
import type { ProfileRecord, UserRecord } from "../src/db/schema"
import {
  AuthenticationRequiredError,
  type AuthService,
} from "../src/services/auth-service"
import type { GitHubProjectService } from "../src/services/github-project-service"

const currentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
} satisfies UserRecord

const savedProfile = {
  userId: currentUser.id,
  data: {
    full_name: "Ayşe Yılmaz",
    location: "İstanbul",
    skills: ["React", "TypeScript"],
    projects: [
      "cv-agent [TypeScript] - CV üretim platformu (https://github.com/ayse/cv-agent)",
    ],
    github_url: "https://github.com/ayse",
    certifications: [],
    languages: [],
    work_experiences: [],
    education: "Boğaziçi Üniversitesi",
    additional_information: null,
  },
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
  updatedAt: new Date("2026-05-07T06:01:00.000Z"),
} satisfies ProfileRecord

test("POST /profile/github/import requires a bearer token", async () => {
  const app = createTestApp()
  const response = await app.handle(
    new Request("http://localhost/profile/github/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ url: "https://github.com/ayse" }),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(401)
  expect(body.detail).toBe("Invalid or expired token")
})

test("POST /profile/github/import imports GitHub projects into the profile", async () => {
  const capturedGithubUrls: string[] = []
  const app = createTestApp({
    githubProjectService: {
      async importProfileProjects(githubUrl) {
        capturedGithubUrls.push(githubUrl)

        return {
          canonicalProfileUrl: "https://github.com/ayse",
          projects: savedProfile.data.projects,
        }
      },
    },
    profileRepository: {
      async mergeGithubProjects(_userId, githubUrl, projects) {
        return {
          ...savedProfile,
          data: {
            ...savedProfile.data,
            github_url: githubUrl,
            projects,
          },
        }
      },
    },
  })
  const response = await app.handle(
    new Request("http://localhost/profile/github/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ url: "https://github.com/ayse" }),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(capturedGithubUrls).toEqual(["https://github.com/ayse"])
  expect(body.profile.github_url).toBe("https://github.com/ayse")
  expect(body.imported_projects).toEqual(savedProfile.data.projects)
})

type TestProfileRoutesOverrides = {
  profileRepository?: Partial<ProfileRepository>
  githubProjectService?: Partial<GitHubProjectService>
}

function createTestApp(overrides: TestProfileRoutesOverrides = {}) {
  const authService = {
    async authenticateAuthorizationHeader(
      authorizationHeader: string | undefined
    ) {
      if (authorizationHeader !== "Bearer valid-token") {
        throw new AuthenticationRequiredError()
      }

      return currentUser
    },
  } as unknown as AuthService

  const profileRepository = {
    async getByUserId() {
      return savedProfile
    },
    async upsertForUser() {
      return savedProfile
    },
    async appendProject() {
      return savedProfile
    },
    async mergeGithubProjects() {
      return savedProfile
    },
    ...overrides.profileRepository,
  } as unknown as ProfileRepository

  const githubProjectService = {
    async importProfileProjects() {
      return {
        canonicalProfileUrl: savedProfile.data.github_url,
        projects: savedProfile.data.projects,
      }
    },
    ...overrides.githubProjectService,
  } as unknown as GitHubProjectService

  return createProfileRoutes(
    authService,
    profileRepository,
    githubProjectService
  )
}

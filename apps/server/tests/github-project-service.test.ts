// Module: Verifies GitHub public repository imports into profile projects.
import { expect, test } from "bun:test"

import type { ProfileRecord } from "../src/db/schema"
import type { ProfileData } from "../src/schemas/profile-chat"
import {
  type GithubFetcher,
  GithubProfileUrlError,
  GithubProjectImportError,
  GithubProjectService,
} from "../src/services/github-project-service"

const baseProfile: ProfileData = {
  full_name: "Ayşe Yılmaz",
  location: "İstanbul",
  skills: ["React"],
  projects: ["cv-agent - Existing project (https://github.com/ayse/cv-agent)"],
  certifications: [],
  languages: [],
  work_experiences: [],
  education: "Boğaziçi Üniversitesi",
  github_url: null,
  additional_information: null,
}

test("github project service imports public non-fork repos without duplicates", async () => {
  let capturedGithubUrl = ""
  const service = new GithubProjectService(
    {
      async mergeGithubProjects(
        _userId: string,
        githubUrl: string,
        projects: Array<{ value: string; sourceUrl: string }>
      ) {
        capturedGithubUrl = githubUrl
        const importedProjects = projects
          .filter((project) => !project.sourceUrl.includes("cv-agent"))
          .map((project) => project.value)

        return {
          importedProjects,
          profile: createProfileRecord({
            ...baseProfile,
            github_url: githubUrl,
            projects: [...baseProfile.projects, ...importedProjects],
          }),
        }
      },
    } as never,
    mockFetch([
      {
        name: "cv-agent",
        description: "CV assistant",
        html_url: "https://github.com/ayse/cv-agent",
        language: "TypeScript",
        fork: false,
        archived: false,
      },
      {
        name: "portfolio",
        description: "Personal portfolio",
        html_url: "https://github.com/ayse/portfolio",
        language: "React",
        fork: false,
        archived: false,
      },
      {
        name: "forked-lib",
        description: "Fork",
        html_url: "https://github.com/ayse/forked-lib",
        language: "JavaScript",
        fork: true,
        archived: false,
      },
    ])
  )

  const result = await service.importPublicReposForProfile(
    "user-1",
    "https://github.com/ayse"
  )

  expect(capturedGithubUrl).toBe("https://github.com/ayse")
  expect(result.importedProjects).toEqual([
    "portfolio - Personal portfolio (https://github.com/ayse/portfolio) [React]",
  ])
  expect(result.profile.data.github_url).toBe("https://github.com/ayse")
})

test("github project service rejects non github profile urls", async () => {
  const service = new GithubProjectService({} as never, mockFetch([]))

  await expect(
    service.importPublicReposForProfile("user-1", "https://gitlab.com/ayse")
  ).rejects.toThrow(GithubProfileUrlError)
})

test("github project service reports github API failures", async () => {
  const service = new GithubProjectService({} as never, async () => {
    return new Response(JSON.stringify({ message: "rate limited" }), {
      status: 403,
    })
  })

  await expect(
    service.importPublicReposForProfile("user-1", "https://github.com/ayse")
  ).rejects.toThrow(GithubProjectImportError)
})

function mockFetch(payload: unknown): GithubFetcher {
  return (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })) satisfies GithubFetcher
}

function createProfileRecord(profile: ProfileData): ProfileRecord {
  return {
    userId: "user-1",
    data: profile,
    createdAt: new Date("2026-05-14T10:00:00.000Z"),
    updatedAt: new Date("2026-05-14T10:01:00.000Z"),
  }
}

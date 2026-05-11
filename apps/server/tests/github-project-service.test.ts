// Module: Verifies GitHub public repository import parsing and formatting.
import { expect, test } from "bun:test"

import {
  GitHubProjectService,
  GitHubProfileUrlError,
  parseGitHubUsername,
} from "../src/services/github-project-service"

test("parseGitHubUsername extracts the profile owner from GitHub URLs", () => {
  expect(parseGitHubUsername("https://github.com/metinturk")).toBe("metinturk")
  expect(
    parseGitHubUsername("https://github.com/metinturk?tab=repositories")
  ).toBe("metinturk")
})

test("parseGitHubUsername rejects non-GitHub profile URLs", () => {
  expect(() => parseGitHubUsername("https://example.com/metinturk")).toThrow(
    GitHubProfileUrlError
  )
  expect(() => parseGitHubUsername("https://github.com/trending")).toThrow(
    GitHubProfileUrlError
  )
})

test("GitHubProjectService imports public non-archived owner repositories", async () => {
  const originalFetch = globalThis.fetch
  const mockFetch = async (input: RequestInfo | URL) => {
    expect(String(input)).toContain("/users/metinturk/repos")

    return new Response(
      JSON.stringify([
        {
          name: "cv-agent",
          html_url: "https://github.com/metinturk/cv-agent",
          description: "CV üretim platformu",
          language: "TypeScript",
          stargazers_count: 7,
          fork: false,
          archived: false,
        },
        {
          name: "archived-project",
          html_url: "https://github.com/metinturk/archived-project",
          fork: false,
          archived: true,
        },
        {
          name: "forked-project",
          html_url: "https://github.com/metinturk/forked-project",
          fork: true,
          archived: false,
        },
      ]),
      { status: 200 }
    )
  }

  globalThis.fetch = Object.assign(mockFetch, {
    preconnect: originalFetch.preconnect,
  }) as typeof fetch

  try {
    const service = new GitHubProjectService()
    const result = await service.importProfileProjects(
      "https://github.com/metinturk"
    )

    expect(result.canonicalProfileUrl).toBe("https://github.com/metinturk")
    expect(result.projects).toEqual([
      "cv-agent [TypeScript] ★7 - CV üretim platformu (https://github.com/metinturk/cv-agent)",
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})

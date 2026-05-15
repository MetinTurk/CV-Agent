// Module: Imports public GitHub repositories into the saved profile project list.
import { ProfileRepository } from "../db/repositories/profiles"
import type { ProfileRecord } from "../db/schema"

export type GithubFetcher = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

type GithubRepoPayload = {
  name?: unknown
  description?: unknown
  html_url?: unknown
  language?: unknown
  fork?: unknown
  archived?: unknown
}

export type GithubProjectsImportResult = {
  profile: ProfileRecord
  importedProjects: string[]
}

export class GithubProfileUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GithubProfileUrlError"
  }
}

export class GithubProjectImportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "GithubProjectImportError"
  }
}

export class GithubProjectService {
  constructor(
    private readonly profileRepository: ProfileRepository = new ProfileRepository(),
    private readonly fetcher: GithubFetcher = fetch
  ) {}

  async importPublicReposForProfile(
    userId: string,
    githubUrl: string
  ): Promise<GithubProjectsImportResult> {
    const githubProfile = parseGithubProfileUrl(githubUrl)
    const repos = await this.fetchPublicRepos(githubProfile.username)
    const projects = repos.map(formatGithubRepoAsProject)

    return await this.profileRepository.mergeGithubProjects(
      userId,
      githubProfile.normalizedUrl,
      projects
    )
  }

  private async fetchPublicRepos(username: string): Promise<GithubRepo[]> {
    let response: Response

    try {
      response = await this.fetcher(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "CV-Agent",
          },
        }
      )
    } catch (error) {
      throw new GithubProjectImportError(
        "GitHub API'ye ulaşılamadı. Lütfen daha sonra tekrar deneyin.",
        error instanceof Error ? { cause: error } : undefined
      )
    }

    if (response.status === 404) {
      throw new GithubProjectImportError("GitHub profili bulunamadı.")
    }

    if (response.status === 403) {
      throw new GithubProjectImportError(
        "GitHub API kullanım limiti dolmuş olabilir. Lütfen biraz sonra tekrar deneyin."
      )
    }

    if (!response.ok) {
      throw new GithubProjectImportError("GitHub repoları alınamadı.")
    }

    const payload = (await response.json()) as unknown
    if (!Array.isArray(payload)) {
      throw new GithubProjectImportError(
        "GitHub API beklenmeyen veri döndürdü."
      )
    }

    return payload
      .map(parseGithubRepo)
      .filter((repo): repo is GithubRepo => repo !== null)
      .filter((repo) => !repo.fork && !repo.archived)
      .slice(0, 20)
  }
}

type GithubProfile = {
  username: string
  normalizedUrl: string
}

type GithubRepo = {
  name: string
  description: string | null
  htmlUrl: string
  language: string | null
  fork: boolean
  archived: boolean
}

function parseGithubProfileUrl(value: string): GithubProfile {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(value.trim())
  } catch {
    throw new GithubProfileUrlError(
      "GitHub bağlantısı https://github.com/kullanici formatında olmalıdır."
    )
  }

  const hostname = parsedUrl.hostname.toLocaleLowerCase("en-US")
  if (hostname !== "github.com" && hostname !== "www.github.com") {
    throw new GithubProfileUrlError(
      "GitHub bağlantısı https://github.com/kullanici formatında olmalıdır."
    )
  }

  const [username] = parsedUrl.pathname.split("/").filter(Boolean)
  if (username === undefined || username.length === 0) {
    throw new GithubProfileUrlError("Geçerli bir GitHub kullanıcı adı girin.")
  }

  return {
    username,
    normalizedUrl: `https://github.com/${username}`,
  }
}

function parseGithubRepo(value: unknown): GithubRepo | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const repo = value as GithubRepoPayload
  if (typeof repo.name !== "string" || typeof repo.html_url !== "string") {
    return null
  }

  return {
    name: repo.name,
    description:
      typeof repo.description === "string" && repo.description.trim().length > 0
        ? repo.description.trim()
        : null,
    htmlUrl: repo.html_url,
    language:
      typeof repo.language === "string" && repo.language.trim().length > 0
        ? repo.language.trim()
        : null,
    fork: repo.fork === true,
    archived: repo.archived === true,
  }
}

function formatGithubRepoAsProject(repo: GithubRepo): {
  value: string
  sourceUrl: string
} {
  const description = repo.description === null ? "" : ` - ${repo.description}`
  const language = repo.language === null ? "" : ` [${repo.language}]`

  return {
    value: `${repo.name}${description} (${repo.htmlUrl})${language}`,
    sourceUrl: repo.htmlUrl,
  }
}

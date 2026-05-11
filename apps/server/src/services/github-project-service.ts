// Module: Fetches public GitHub repositories and converts them into profile project entries.
type GitHubRepositoryPayload = {
  name?: unknown
  html_url?: unknown
  description?: unknown
  language?: unknown
  fork?: unknown
  archived?: unknown
  stargazers_count?: unknown
}

export type GitHubProjectImportResult = {
  canonicalProfileUrl: string
  projects: string[]
}

export class GitHubProfileUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GitHubProfileUrlError"
  }
}

export class GitHubProjectFetchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "GitHubProjectFetchError"
  }
}

const GITHUB_RESERVED_PATHS = new Set([
  "about",
  "apps",
  "blog",
  "collections",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "marketplace",
  "new",
  "organizations",
  "pricing",
  "settings",
  "sponsors",
  "topics",
  "trending",
])

export class GitHubProjectService {
  async importProfileProjects(
    githubUrl: string
  ): Promise<GitHubProjectImportResult> {
    const username = parseGitHubUsername(githubUrl)
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(
        username
      )}/repos?type=owner&sort=updated&per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "CV-Agent",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new GitHubProfileUrlError("GitHub kullanıcısı bulunamadı.")
      }

      throw new GitHubProjectFetchError(
        "GitHub projeleri alınamadı. Lütfen daha sonra tekrar deneyin."
      )
    }

    const payload = (await response.json()) as unknown
    if (!Array.isArray(payload)) {
      throw new GitHubProjectFetchError(
        "GitHub API beklenmeyen yanıt döndürdü."
      )
    }

    return {
      canonicalProfileUrl: `https://github.com/${username}`,
      projects: payload
        .filter(isPublicProjectRepository)
        .slice(0, 20)
        .map(formatGitHubProject),
    }
  }
}

export function parseGitHubUsername(githubUrl: string): string {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(githubUrl.trim())
  } catch {
    throw new GitHubProfileUrlError("Geçerli bir GitHub profil linki girin.")
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.hostname.toLocaleLowerCase("en-US") !== "github.com"
  ) {
    throw new GitHubProfileUrlError(
      "GitHub profil linki https://github.com/kullanıcı formatında olmalıdır."
    )
  }

  const username = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? ""
  if (
    username.length === 0 ||
    username.endsWith(".git") ||
    GITHUB_RESERVED_PATHS.has(username.toLocaleLowerCase("en-US"))
  ) {
    throw new GitHubProfileUrlError(
      "Geçerli bir GitHub kullanıcı adı bulunamadı."
    )
  }

  return username
}

function isPublicProjectRepository(
  value: unknown
): value is Required<Pick<GitHubRepositoryPayload, "name" | "html_url">> &
  GitHubRepositoryPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const repository = value as GitHubRepositoryPayload
  return (
    typeof repository.name === "string" &&
    typeof repository.html_url === "string" &&
    repository.fork !== true &&
    repository.archived !== true
  )
}

function formatGitHubProject(repository: GitHubRepositoryPayload): string {
  const name = String(repository.name)
  const description =
    typeof repository.description === "string" &&
    repository.description.trim().length > 0
      ? ` - ${repository.description.trim()}`
      : ""
  const language =
    typeof repository.language === "string" && repository.language.length > 0
      ? ` [${repository.language}]`
      : ""
  const stars =
    typeof repository.stargazers_count === "number" &&
    repository.stargazers_count > 0
      ? ` ★${repository.stargazers_count}`
      : ""

  return `${name}${language}${stars}${description} (${String(
    repository.html_url
  )})`
}

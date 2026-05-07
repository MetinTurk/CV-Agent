// Module: Verifies job analysis orchestration for URL and extension sources.
import { expect, test } from "bun:test"

import type { Settings } from "../src/core/config"
import type { JobAnalysisRecord, UserRecord } from "../src/db/schema"
import type { JobAnalysisRepository } from "../src/db/repositories/job-analyses"
import type { ProfileRepository } from "../src/db/repositories/profiles"
import type { JobAnalysisAgentClient } from "../src/services/job-analysis-agent-client"
import { JobAnalysisService } from "../src/services/job-analysis-service"
import type {
  ExtractedJobPosting,
  JobDescription,
  MatchAnalysis,
} from "../src/schemas/job-analysis"

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
} satisfies UserRecord

const testSettings: Settings = {
  appName: "CV Agent API",
  apiVersion: "0.1.0",
  environment: "test",
  host: "0.0.0.0",
  port: 3000,
  databaseUrl: "postgres://postgres:postgres@localhost:5432/cv_agent",
  accessTokenSecret: "test-secret",
  accessTokenExpireMinutes: 60,
  corsAllowedOrigins: ["http://localhost:5173"],
  corsAllowedOriginRegex: null,
  groqApiKey: "test-groq-key",
  openRouterApiKey: null,
  agentModel: "test-model",
  agentRequestTimeoutSeconds: 1,
  agentMaxRetries: 0,
}

const jobDescription: JobDescription = {
  title: "Frontend Engineer",
  company: "CloudScale Inc.",
  location: "İstanbul",
  employment_type: "Tam zamanlı",
  summary: "React ve TypeScript odaklı frontend rolü.",
  responsibilities: ["Arayüz geliştirmek"],
  requirements: ["React"],
  skills: ["React", "TypeScript"],
}

const matchAnalysis: MatchAnalysis = {
  yeterli_yonler: ["React deneyimi eşleşiyor."],
  eksik_yonler: [],
  genel_uyumluluk_puani: 86,
  tavsiyeler: ["Projelerde ölçülebilir etkiyi vurgula."],
}

const extractedJobPosting: ExtractedJobPosting = {
  sourceUrl: "https://www.kariyer.net/is-ilani/frontend-engineer",
  sourceSite: "kariyer-net",
  title: "Frontend Engineer",
  companyName: "CloudScale Inc.",
  location: "İstanbul",
  employmentType: "Tam zamanlı",
  workplaceType: "hybrid",
  descriptionText:
    "CloudScale Inc. ürün ekipleriyle birlikte çalışan, React ve TypeScript tabanlı kullanıcı arayüzleri geliştiren, API entegrasyonlarında sorumluluk alan ve analiz çıktılarıyla ürünü iyileştiren bir Frontend Engineer arıyor. Adayın tasarım sistemleriyle çalışması, otomasyon süreçlerini anlaması ve kullanıcı deneyimi metriklerini takip etmesi bekleniyor.",
  requirements: ["React", "TypeScript", "API entegrasyonu"],
  responsibilities: ["İş ilanı analiz ekranlarını geliştirmek"],
  benefits: ["Hibrit çalışma"],
  seniority: "Mid-Senior",
  language: "tr",
  extractedAt: "2026-05-07T06:00:00.000Z",
}

test("job analysis service preserves the manual URL extraction flow", async () => {
  let capturedSourceInput: unknown = null
  let capturedAgentInput: unknown = null
  let capturedCreateInput: unknown = null
  const service = createService({
    sourceService: {
      async extract(input: unknown) {
        capturedSourceInput = input
        return {
          type: "url",
          label: "https://example.com/job",
          content: "Visible job posting text from the public URL.",
        }
      },
    },
    agentClient: {
      async generateJobDescription(input: unknown) {
        capturedAgentInput = input
        return jobDescription
      },
      async generateMatchAnalysis() {
        return matchAnalysis
      },
    },
    repository: {
      async create(input: Parameters<JobAnalysisRepository["create"]>[0]) {
        capturedCreateInput = input
        return createRecord(input)
      },
    },
  })

  const response = await service.analyzeAndSave(user, {
    url: "https://example.com/job",
  })

  expect(capturedSourceInput).toEqual({
    type: "url",
    url: "https://example.com/job",
  })
  expect(capturedAgentInput).toEqual({
    url: "https://example.com/job",
    pageContent: "Visible job posting text from the public URL.",
  })
  expect(capturedCreateInput).toMatchObject({
    userId: user.id,
    url: "https://example.com/job",
    rawContent: "Visible job posting text from the public URL.",
  })
  expect(response.redirect_url).toBe("/job-analysis/analysis-1")
})

test("job analysis service uses extension text without fetching the URL", async () => {
  let capturedAgentInput: unknown = null
  let capturedCreateInput: unknown = null
  const service = createService({
    sourceService: {
      async extract() {
        throw new Error("URL extraction should not run for extension payloads.")
      },
    },
    agentClient: {
      async generateJobDescription(input: unknown) {
        capturedAgentInput = input
        return jobDescription
      },
      async generateMatchAnalysis() {
        return matchAnalysis
      },
    },
    repository: {
      async create(input: Parameters<JobAnalysisRepository["create"]>[0]) {
        capturedCreateInput = input
        return createRecord(input)
      },
    },
  })

  const response = await service.analyzeAndSave(user, {
    jobPosting: extractedJobPosting,
    source: {
      kind: "chrome-extension",
      extensionVersion: "1.0.4",
      tabId: 42,
    },
  })

  expect(capturedAgentInput).toEqual({
    url: extractedJobPosting.sourceUrl,
    pageContent: extractedJobPosting.descriptionText,
  })
  expect(capturedCreateInput).toMatchObject({
    userId: user.id,
    url: extractedJobPosting.sourceUrl,
    rawContent: extractedJobPosting.descriptionText,
  })
  expect(response.status).toBe("completed")
  expect(response.redirect_url).toBe("/job-analysis/analysis-1")
})

type ServiceOverrides = {
  sourceService?: object
  agentClient?: object
  repository?: object
  profileRepository?: object
}

function createService(overrides: ServiceOverrides): JobAnalysisService {
  return new JobAnalysisService(
    testSettings,
    overrides.agentClient as unknown as JobAnalysisAgentClient,
    overrides.sourceService as never,
    overrides.repository as unknown as JobAnalysisRepository,
    (overrides.profileRepository ?? {
      async getByUserId() {
        return null
      },
    }) as unknown as ProfileRepository
  )
}

function createRecord(
  input: Parameters<JobAnalysisRepository["create"]>[0]
): JobAnalysisRecord {
  return {
    id: "analysis-1",
    userId: input.userId,
    url: input.url,
    rawContent: input.rawContent,
    jobDescription: input.jobDescription,
    matchAnalysis: input.matchAnalysis,
    createdAt: new Date("2026-05-07T06:01:00.000Z"),
  }
}

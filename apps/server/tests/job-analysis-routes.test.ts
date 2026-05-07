// Module: Verifies authenticated job analysis HTTP route contracts.
import { expect, test } from "bun:test"

import { createJobAnalysisRoutes } from "../src/api/job-analysis"
import {
  AuthenticationRequiredError,
  type AuthService,
} from "../src/services/auth-service"
import type { JobAnalysisService } from "../src/services/job-analysis-service"
import type {
  JobAnalysisCreateRequest,
  JobAnalysisResponse,
} from "../src/schemas/job-analysis"
import type { UserRecord } from "../src/db/schema"

const currentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
} satisfies UserRecord

const validExtensionRequest: JobAnalysisCreateRequest = {
  jobPosting: {
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
    responsibilities: [
      "İş ilanı analiz ekranlarını kullanıcı odaklı geliştirmek",
      "Backend API sözleşmeleriyle uyumlu arayüzler tasarlamak",
    ],
    benefits: ["Hibrit çalışma", "Teknik gelişim bütçesi"],
    seniority: "Mid-Senior",
    language: "tr",
    extractedAt: "2026-05-07T06:00:00.000Z",
  },
  source: {
    kind: "chrome-extension",
    extensionVersion: "1.0.4",
    tabId: 42,
  },
}

const successfulResponse: JobAnalysisResponse = {
  id: "analysis-1",
  url: "https://www.kariyer.net/is-ilani/frontend-engineer",
  job_description: {
    title: "Frontend Engineer",
    company: "CloudScale Inc.",
    location: "İstanbul",
    employment_type: "Tam zamanlı",
    summary: "React ve TypeScript odaklı frontend rolü.",
    responsibilities: ["Arayüz geliştirmek"],
    requirements: ["React"],
    skills: ["React", "TypeScript"],
  },
  match_analysis: {
    yeterli_yonler: ["React deneyimi eşleşiyor."],
    eksik_yonler: [],
    genel_uyumluluk_puani: 86,
    tavsiyeler: ["Projelerde ölçülebilir etkiyi vurgula."],
  },
  created_at: "2026-05-07T06:01:00.000Z",
  status: "completed",
  redirect_url: "/job-analysis/analysis-1",
}

test("POST /job-analyses requires a bearer token", async () => {
  const app = createTestApp()
  const response = await app.handle(
    new Request("http://localhost/job-analyses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(validExtensionRequest),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(401)
  expect(body.detail).toBe("Invalid or expired token")
})

test("POST /job-analyses accepts extension job posting payloads", async () => {
  let capturedRequest: unknown = null
  const app = createTestApp({
    analyzeAndSave: async (_user, request) => {
      capturedRequest = request
      return successfulResponse
    },
  })
  const response = await app.handle(
    new Request("http://localhost/job-analyses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-token",
      },
      body: JSON.stringify(validExtensionRequest),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(capturedRequest).toEqual(validExtensionRequest)
  expect(body.status).toBe("completed")
  expect(body.redirect_url).toBe("/job-analysis/analysis-1")
})

test("POST /job-analyses rejects short extension descriptions", async () => {
  let wasServiceCalled = false
  const invalidRequest = {
    ...validExtensionRequest,
    jobPosting: {
      ...validExtensionRequest.jobPosting,
      descriptionText: "Kısa ilan.",
    },
  }
  const app = createTestApp({
    analyzeAndSave: async () => {
      wasServiceCalled = true
      return successfulResponse
    },
  })
  const response = await app.handle(
    new Request("http://localhost/job-analyses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-token",
      },
      body: JSON.stringify(invalidRequest),
    })
  )

  expect(response.status).toBe(422)
  expect(wasServiceCalled).toBe(false)
})

test("GET /job-analyses/:id returns the owner's analysis", async () => {
  const app = createTestApp({
    getByIdForUser: async () => successfulResponse,
  })
  const response = await app.handle(
    new Request("http://localhost/job-analyses/analysis-1", {
      headers: {
        authorization: "Bearer valid-token",
      },
    })
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.id).toBe("analysis-1")
  expect(body.redirect_url).toBe("/job-analysis/analysis-1")
})

test("GET /job-analyses/:id hides analyses owned by another user", async () => {
  const app = createTestApp({
    getByIdForUser: async () => null,
  })
  const response = await app.handle(
    new Request("http://localhost/job-analyses/analysis-2", {
      headers: {
        authorization: "Bearer valid-token",
      },
    })
  )
  const body = await response.json()

  expect(response.status).toBe(404)
  expect(body.detail).toBe("İş analizi bulunamadı.")
})

type TestJobAnalysisService = {
  analyzeAndSave?: (
    user: UserRecord,
    request: JobAnalysisCreateRequest
  ) => Promise<JobAnalysisResponse>
  getByIdForUser?: (
    analysisId: string,
    user: UserRecord
  ) => Promise<JobAnalysisResponse | null>
}

function createTestApp(serviceOverrides: TestJobAnalysisService = {}) {
  const authService = {
    async authenticateAuthorizationHeader(authorizationHeader: string | undefined) {
      if (authorizationHeader !== "Bearer valid-token") {
        throw new AuthenticationRequiredError()
      }

      return currentUser
    },
  } as unknown as AuthService

  const jobAnalysisService = {
    analyzeAndSave:
      serviceOverrides.analyzeAndSave ??
      (async () => successfulResponse),
    getByIdForUser:
      serviceOverrides.getByIdForUser ??
      (async () => successfulResponse),
  } as unknown as JobAnalysisService

  return createJobAnalysisRoutes(authService, jobAnalysisService)
}

// Module: Verifies the demo job analysis API contract used by the extension.
import { expect, test } from "bun:test"

import { createApp } from "../src/app"
import type { Settings } from "../src/core/config"
import type { CreateJobAnalysisRequest } from "../src/schemas/job-analysis"

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
  googleApiKey: null,
  profileAgentModel: "gemini-3-flash-preview",
  profileAgentRequestTimeoutSeconds: 20,
  profileAgentMaxRetries: 0,
}

const validRequest: CreateJobAnalysisRequest = {
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
    extractedAt: "2026-05-06T12:00:00.000Z",
  },
  source: {
    kind: "chrome-extension",
    extensionVersion: "1.0.4",
    tabId: 42,
  },
}

test("POST /api/job-analyses returns a completed demo analysis", async () => {
  const app = createApp(testSettings)
  const response = await app.handle(
    new Request("http://localhost/api/job-analyses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(validRequest),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(201)
  expect(body.status).toBe("completed")
  expect(body.analysisId).toStartWith("demo-")
  expect(body.redirectUrl).toStartWith("/job-analysis?analysisId=")
  expect(body.detail.compatibilityScore).toBeGreaterThanOrEqual(80)
})

test("POST /api/job-analyses rejects short job descriptions", async () => {
  const app = createApp(testSettings)
  const invalidRequest = {
    ...validRequest,
    jobPosting: {
      ...validRequest.jobPosting,
      descriptionText: "Kısa ilan.",
    },
  }
  const response = await app.handle(
    new Request("http://localhost/api/job-analyses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(invalidRequest),
    })
  )

  expect(response.status).toBe(422)
})

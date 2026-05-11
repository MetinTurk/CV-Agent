// Module: Verifies authenticated ATS report HTTP route contracts.
import { expect, test } from "bun:test"

import { createAtsReportRoutes } from "../src/api/ats-report"
import type {
  AtsReportCreateRequest,
  AtsReportResponse,
} from "../src/schemas/ats-report"
import {
  AuthenticationRequiredError,
  type AuthService,
} from "../src/services/auth-service"
import type { AtsReportService } from "../src/services/ats-report-service"
import type { UserRecord } from "../src/db/schema"

const currentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
} satisfies UserRecord

const validRequest: AtsReportCreateRequest = {
  job_description: {
    title: "Backend Engineer",
    company: "CloudScale Inc.",
    location: "İstanbul",
    employment_type: "Tam zamanlı",
    summary: "Node.js ve PostgreSQL odaklı backend rolü.",
    responsibilities: ["REST API geliştirmek"],
    requirements: ["Node.js", "Express.js", "PostgreSQL", "Docker"],
    skills: ["Node.js", "Express.js", "PostgreSQL", "REST API"],
  },
  tailored_cv: {
    full_name: "Ayşe Yılmaz",
    title: "Backend Engineer",
    location: "İstanbul",
    summary:
      "Node.js, Express.js ve PostgreSQL ile ölçeklenebilir REST API geliştiren backend mühendisi.",
    skills: ["Node.js", "Express.js", "PostgreSQL", "REST API"],
    experiences: [
      {
        role: "Backend Developer",
        company: "CloudScale",
        period: "2024 - 2026",
        bullets: ["Node.js tabanlı REST API servisleri geliştirdi."],
      },
    ],
    educations: [],
    projects: [],
    certifications: [],
    languages: ["Türkçe"],
  },
}

const successfulResponse: AtsReportResponse = {
  similarity_score: 82,
  match_level: "orta-guclu",
  strong_matches: ["Node.js CV içinde görünür durumda."],
  warnings: ["Docker CV içinde belirgin görünmüyor."],
  recommendations: ["Docker deneyiminiz varsa CV'ye ekleyin."],
  created_at: "2026-05-07T06:01:00.000Z",
}

test("POST /ats-reports requires a bearer token", async () => {
  const app = createTestApp()
  const response = await app.handle(
    new Request("http://localhost/ats-reports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(validRequest),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(401)
  expect(body.detail).toBe("Invalid or expired token")
})

test("POST /ats-reports returns an ATS report for a tailored CV", async () => {
  let capturedRequest: unknown = null
  const app = createTestApp({
    generate: (request) => {
      capturedRequest = request
      return successfulResponse
    },
  })
  const response = await app.handle(
    new Request("http://localhost/ats-reports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer valid-token",
      },
      body: JSON.stringify(validRequest),
    })
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(capturedRequest).toEqual(validRequest)
  expect(body.similarity_score).toBe(82)
  expect(body.match_level).toBe("orta-guclu")
  expect(body.warnings).toEqual(["Docker CV içinde belirgin görünmüyor."])
})

type TestAtsReportService = {
  generate?: (request: AtsReportCreateRequest) => AtsReportResponse
}

function createTestApp(serviceOverrides: TestAtsReportService = {}) {
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

  const atsReportService = {
    generate: serviceOverrides.generate ?? (() => successfulResponse),
  } as unknown as AtsReportService

  return createAtsReportRoutes(authService, atsReportService)
}

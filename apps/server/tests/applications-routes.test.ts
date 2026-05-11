// Module: Verifies authenticated application history HTTP route contracts.
import { expect, test } from "bun:test"

import { createApplicationRoutes } from "../src/api/applications"
import type { JobAnalysisRepository } from "../src/db/repositories/job-analyses"
import type { JobAnalysisRecord, UserRecord } from "../src/db/schema"
import {
  AuthenticationRequiredError,
  type AuthService,
} from "../src/services/auth-service"
import type { ApplicationStatus } from "../src/schemas/applications"

const currentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ayse@example.com",
  firstName: "Ayşe",
  lastName: "Yılmaz",
  passwordHash: "hash",
  createdAt: new Date("2026-05-07T06:00:00.000Z"),
} satisfies UserRecord

const savedApplication = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: currentUser.id,
  url: "https://www.kariyer.net/is-ilani/frontend-engineer",
  rawContent: "Frontend Engineer ilan içeriği",
  jobDescription: {
    title: "Frontend Engineer",
    company: "CloudScale Inc.",
    location: "İstanbul",
    employment_type: "Tam zamanlı",
    summary: "React ve TypeScript odaklı frontend rolü.",
    responsibilities: ["Arayüz geliştirmek"],
    requirements: ["React"],
    skills: ["React", "TypeScript"],
  },
  matchAnalysis: {
    yeterli_yonler: ["React deneyimi eşleşiyor."],
    eksik_yonler: [],
    genel_uyumluluk_puani: 86,
    tavsiyeler: ["Projelerde ölçülebilir etkiyi vurgula."],
  },
  applicationStatus: "pending",
  createdAt: new Date("2026-05-07T06:01:00.000Z"),
} satisfies JobAnalysisRecord

test("GET /applications requires a bearer token", async () => {
  const app = createTestApp()
  const response = await app.handle(
    new Request("http://localhost/applications")
  )
  const body = await response.json()

  expect(response.status).toBe(401)
  expect(body.detail).toBe("Invalid or expired token")
})

test("GET /applications returns saved analyses as application history", async () => {
  const app = createTestApp({
    listByUserId: async () => [savedApplication],
  })
  const response = await app.handle(
    new Request("http://localhost/applications", {
      headers: {
        authorization: "Bearer valid-token",
      },
    })
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.applications).toHaveLength(1)
  expect(body.applications[0].job_description.company).toBe("CloudScale Inc.")
  expect(body.applications[0].application_status).toBe("pending")
})

test("PATCH /applications/:id/status updates the owner's application status", async () => {
  const capturedStatuses: ApplicationStatus[] = []
  const app = createTestApp({
    updateApplicationStatusForUser: async (_analysisId, _userId, status) => {
      capturedStatuses.push(status)
      return {
        ...savedApplication,
        applicationStatus: status,
      }
    },
  })
  const response = await app.handle(
    new Request(
      "http://localhost/applications/22222222-2222-4222-8222-222222222222/status",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ status: "approved" }),
      }
    )
  )
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(capturedStatuses).toEqual(["approved"])
  expect(body.application.application_status).toBe("approved")
})

test("PATCH /applications/:id/status hides applications owned by another user", async () => {
  const app = createTestApp({
    updateApplicationStatusForUser: async () => null,
  })
  const response = await app.handle(
    new Request(
      "http://localhost/applications/33333333-3333-4333-8333-333333333333/status",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ status: "rejected" }),
      }
    )
  )
  const body = await response.json()

  expect(response.status).toBe(404)
  expect(body.detail).toBe("Başvuru bulunamadı.")
})

type TestApplicationRepository = {
  listByUserId?: (userId: string) => Promise<JobAnalysisRecord[]>
  updateApplicationStatusForUser?: (
    analysisId: string,
    userId: string,
    status: ApplicationStatus
  ) => Promise<JobAnalysisRecord | null>
}

function createTestApp(repositoryOverrides: TestApplicationRepository = {}) {
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

  const repository = {
    listByUserId:
      repositoryOverrides.listByUserId ?? (async () => [savedApplication]),
    updateApplicationStatusForUser:
      repositoryOverrides.updateApplicationStatusForUser ??
      (async () => savedApplication),
  } as unknown as JobAnalysisRepository

  return createApplicationRoutes(authService, repository)
}

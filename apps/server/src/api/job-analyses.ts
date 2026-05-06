// Module: Exposes demo job analysis endpoints used by the browser extension.
import { Elysia } from "elysia"

import {
  CreateJobAnalysisRequestSchema,
  CreateJobAnalysisResponseSchema,
} from "../schemas/job-analysis"
import { ErrorResponseSchema } from "../schemas/error"
import { JobAnalysisService } from "../services/job-analysis-service"

export function createJobAnalysisRoutes(
  jobAnalysisService: JobAnalysisService = new JobAnalysisService()
) {
  return new Elysia({
    name: "job-analysis-routes",
    prefix: "/job-analyses",
  }).post(
    "",
    ({ body, status }) =>
      status(201, jobAnalysisService.createDemoAnalysis(body)),
    {
      body: CreateJobAnalysisRequestSchema,
      response: {
        201: CreateJobAnalysisResponseSchema,
        422: ErrorResponseSchema,
      },
    }
  )
}

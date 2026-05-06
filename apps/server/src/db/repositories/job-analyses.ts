// Module: Provides job analysis persistence operations behind a repository boundary.
import { desc, eq } from "drizzle-orm"

import { db } from "../client"
import { jobAnalyses, type JobAnalysisRecord } from "../schema"
import type {
  JobDescription,
  MatchAnalysis,
} from "../../schemas/job-analysis"

export type CreateJobAnalysisInput = {
  userId: string
  url: string
  rawContent: string
  jobDescription: JobDescription
  matchAnalysis: MatchAnalysis | null
}

export class JobAnalysisRepository {
  async create(input: CreateJobAnalysisInput): Promise<JobAnalysisRecord> {
    const [record] = await db
      .insert(jobAnalyses)
      .values({
        userId: input.userId,
        url: input.url,
        rawContent: input.rawContent,
        jobDescription: input.jobDescription,
        matchAnalysis: input.matchAnalysis,
      })
      .returning()

    if (record === undefined) {
      throw new Error("Job analysis could not be saved.")
    }

    return record
  }

  async listByUserId(userId: string): Promise<JobAnalysisRecord[]> {
    return await db
      .select()
      .from(jobAnalyses)
      .where(eq(jobAnalyses.userId, userId))
      .orderBy(desc(jobAnalyses.createdAt))
  }
}

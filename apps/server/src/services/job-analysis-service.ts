// Module: Orchestrates URL → job description extraction, profile/job match analysis and persistence.
import type { Settings } from "../core/config"
import { JobAnalysisAgentClient } from "./job-analysis-agent-client"
import { ProfileSourceService } from "./profile-source-service"
import { JobAnalysisRepository } from "../db/repositories/job-analyses"
import { ProfileRepository } from "../db/repositories/profiles"
import type { JobAnalysisRecord, UserRecord } from "../db/schema"
import type {
  JobAnalysisResponse,
  JobDescription,
  MatchAnalysis,
} from "../schemas/job-analysis"
import type { ProfileData } from "../schemas/profile-chat"

const EMPTY_PROFILE: ProfileData = {
  full_name: null,
  location: null,
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  work_experiences: [],
  education: null,
  additional_information: null,
}

export class JobAnalysisService {
  private readonly agentClient: JobAnalysisAgentClient
  private readonly sourceService: ProfileSourceService
  private readonly repository: JobAnalysisRepository
  private readonly profileRepository: ProfileRepository

  constructor(
    settings: Settings,
    agentClient?: JobAnalysisAgentClient,
    sourceService?: ProfileSourceService,
    repository?: JobAnalysisRepository,
    profileRepository?: ProfileRepository
  ) {
    this.agentClient = agentClient ?? new JobAnalysisAgentClient(settings)
    this.sourceService = sourceService ?? new ProfileSourceService()
    this.repository = repository ?? new JobAnalysisRepository()
    this.profileRepository = profileRepository ?? new ProfileRepository()
  }

  async analyzeAndSave(
    user: UserRecord,
    url: string
  ): Promise<JobAnalysisResponse> {
    const sourceContext = await this.sourceService.extract({
      type: "url",
      url,
    })

    const jobDescription: JobDescription =
      await this.agentClient.generateJobDescription({
        url: sourceContext.label,
        pageContent: sourceContext.content,
      })

    const profileRecord = await this.profileRepository.getByUserId(user.id)
    const profile = profileRecord?.data ?? EMPTY_PROFILE

    let matchAnalysis: MatchAnalysis | null = null
    try {
      matchAnalysis = await this.agentClient.generateMatchAnalysis({
        profile,
        jobDescription,
      })
    } catch (error) {
      console.error(
        "[job-analysis] match analizi üretilemedi:",
        error instanceof Error ? error.message : error
      )
    }

    const record = await this.repository.create({
      userId: user.id,
      url: sourceContext.label,
      rawContent: sourceContext.content,
      jobDescription,
      matchAnalysis,
    })

    return toResponse(record)
  }
}

function toResponse(record: JobAnalysisRecord): JobAnalysisResponse {
  return {
    id: record.id,
    url: record.url,
    job_description: record.jobDescription,
    match_analysis: record.matchAnalysis ?? null,
    created_at: record.createdAt.toISOString(),
  }
}

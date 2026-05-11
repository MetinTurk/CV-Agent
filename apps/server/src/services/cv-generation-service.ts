// Module: Orchestrates loading the user profile and producing a tailored CV via the CV agent.
import type { Settings } from "../core/config"
import { ProfileRepository } from "../db/repositories/profiles"
import type { UserRecord } from "../db/schema"
import type { CvGenerationResponse, TailoredCv } from "../schemas/cv-generation"
import type { JobDescription } from "../schemas/job-analysis"
import type { ProfileData } from "../schemas/profile-chat"
import { CvGenerationAgentClient } from "./cv-generation-agent-client"

const EMPTY_PROFILE: ProfileData = {
  full_name: null,
  location: null,
  skills: [],
  projects: [],
  github_url: null,
  certifications: [],
  languages: [],
  work_experiences: [],
  education: null,
  additional_information: null,
}

export class CvGenerationService {
  private readonly agentClient: CvGenerationAgentClient
  private readonly profileRepository: ProfileRepository

  constructor(
    settings: Settings,
    agentClient?: CvGenerationAgentClient,
    profileRepository?: ProfileRepository
  ) {
    this.agentClient = agentClient ?? new CvGenerationAgentClient(settings)
    this.profileRepository = profileRepository ?? new ProfileRepository()
  }

  async generate(
    user: UserRecord,
    jobDescription: JobDescription
  ): Promise<CvGenerationResponse> {
    const profileRecord = await this.profileRepository.getByUserId(user.id)
    const profile = profileRecord?.data ?? EMPTY_PROFILE

    const tailoredCv: TailoredCv = await this.agentClient.generateTailoredCv({
      profile,
      jobDescription,
    })

    return {
      tailored_cv: tailoredCv,
      created_at: new Date().toISOString(),
    }
  }
}

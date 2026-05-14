// Module: Manages the profile collection conversation state and profile merging.
import type { Settings } from "../core/config"
import { ProfileRepository } from "../db/repositories/profiles"
import type { UserRecord } from "../db/schema"
import {
  REQUIRED_PROFILE_FIELDS,
  type ProfileChatRequest,
  type ProfileChatResponse,
  type ProfileData,
  type ProfilePatch,
  type ProfileSourceContext,
  type RequiredProfileField,
} from "../schemas/profile-chat"
import {
  OPTIONAL_PROFILE_FIELDS,
  ProfileAgentClient,
  type ProfileAgentRequest,
  type ProfileAgentResult,
} from "./profile-agent-client"

type ProfileConversationState = {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  profile: ProfileData
  coveredOptionalFields: Set<string>
}

type ProfileAgent = {
  generateResponse(request: ProfileAgentRequest): Promise<ProfileAgentResult>
}

type ProfileStore = {
  upsertForUser(userId: string, profileData: ProfileData): Promise<unknown>
}

const EMPTY_PROFILE: ProfileData = {
  full_name: null,
  location: null,
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  work_experiences: [],
  education: null,
  github_url: null,
  additional_information: null,
}

export class ProfileChatService {
  private readonly conversations = new Map<string, ProfileConversationState>()

  constructor(
    settings: Settings,
    private readonly profileAgent: ProfileAgent = new ProfileAgentClient(
      settings
    ),
    private readonly profileStore: ProfileStore = new ProfileRepository()
  ) {}

  async chat(
    user: UserRecord,
    request: ProfileChatRequest,
    sourceContext?: ProfileSourceContext
  ): Promise<ProfileChatResponse> {
    const sessionId = normalizeRequiredText(request.session_id)
    const message = normalizeRequiredText(request.message)
    const conversationKey = `${user.id}:${sessionId}`
    const conversation = this.getConversation(conversationKey)
    const missingRequiredFieldsBeforeMessage = getMissingRequiredFields(
      conversation.profile
    )

    const agentResult = await this.getAgentResult({
      message,
      sourceContext,
      profile: conversation.profile,
      missingRequiredFields: missingRequiredFieldsBeforeMessage,
      coveredOptionalFields: [...conversation.coveredOptionalFields],
      conversationMessages: conversation.messages,
    })

    const patch = agentResult.profilePatch
    conversation.profile = mergeProfile(conversation.profile, patch)

    for (const field of agentResult.askedAbout) {
      conversation.coveredOptionalFields.add(field)
    }
    for (const field of OPTIONAL_PROFILE_FIELDS) {
      const value = conversation.profile[field]
      const hasData = Array.isArray(value) ? value.length > 0 : value !== null
      if (hasData) {
        conversation.coveredOptionalFields.add(field)
      }
    }

    const missingRequiredFields = getMissingRequiredFields(conversation.profile)
    const reply = normalizeRequiredText(agentResult.reply)
    const allOptionalCovered = OPTIONAL_PROFILE_FIELDS.every((f) =>
      conversation.coveredOptionalFields.has(f)
    )
    const isProfileReady =
      missingRequiredFields.length === 0 && allOptionalCovered

    conversation.messages = [
      ...conversation.messages,
      {
        role: "user",
        content: buildConversationUserMessage(message, sourceContext),
      },
      { role: "assistant", content: reply },
    ]

    if (isProfileReady) {
      await this.profileStore.upsertForUser(user.id, conversation.profile)
    }

    return {
      reply,
      session_id: sessionId,
      profile: conversation.profile,
      missing_required_fields: missingRequiredFields,
      is_profile_ready: isProfileReady,
      redirect_to: isProfileReady ? "/profile" : null,
    }
  }

  private async getAgentResult(
    request: ProfileAgentRequest
  ): Promise<ProfileAgentResult> {
    return await this.profileAgent.generateResponse(request)
  }

  private getConversation(conversationKey: string): ProfileConversationState {
    const existingConversation = this.conversations.get(conversationKey)
    if (existingConversation !== undefined) {
      return existingConversation
    }

    const conversation: ProfileConversationState = {
      messages: [],
      profile: {
        ...EMPTY_PROFILE,
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        work_experiences: [],
      },
      coveredOptionalFields: new Set(),
    }
    this.conversations.set(conversationKey, conversation)

    return conversation
  }
}

function buildConversationUserMessage(
  message: string,
  sourceContext: ProfileSourceContext | undefined
): string {
  if (sourceContext === undefined) {
    return message
  }

  return `${message}\n\nKaynak (${sourceContext.type}: ${sourceContext.label}):\n${sourceContext.content}`
}

function normalizeRequiredText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function cleanText(value: string | undefined): string | null {
  if (value === undefined) {
    return null
  }

  const normalizedValue = normalizeRequiredText(value)
  return normalizedValue.length > 0 ? normalizedValue : null
}

function mergeList(
  currentValues: string[],
  nextValues: string[] | undefined
): string[] {
  if (nextValues === undefined || nextValues.length === 0) {
    return currentValues
  }

  const mergedValues = [...currentValues]
  const normalizedExisting = new Set(
    mergedValues.map((value) => value.toLocaleLowerCase("tr"))
  )

  for (const value of nextValues) {
    const cleanedValue = cleanText(value)
    if (cleanedValue === null) {
      continue
    }

    const normalizedValue = cleanedValue.toLocaleLowerCase("tr")
    if (!normalizedExisting.has(normalizedValue)) {
      mergedValues.push(cleanedValue)
      normalizedExisting.add(normalizedValue)
    }
  }

  return mergedValues
}

function mergeProfile(profile: ProfileData, patch: ProfilePatch): ProfileData {
  return {
    full_name: cleanText(patch.full_name) ?? profile.full_name,
    location: cleanText(patch.location) ?? profile.location,
    skills: mergeList(profile.skills, patch.skills),
    projects: mergeList(profile.projects, patch.projects),
    certifications: mergeList(profile.certifications, patch.certifications),
    languages: mergeList(profile.languages, patch.languages),
    work_experiences: mergeList(
      profile.work_experiences,
      patch.work_experiences
    ),
    education: cleanText(patch.education) ?? profile.education,
    github_url: cleanText(patch.github_url) ?? profile.github_url,
    additional_information:
      cleanText(patch.additional_information) ?? profile.additional_information,
  }
}

function getMissingRequiredFields(
  profile: ProfileData
): RequiredProfileField[] {
  return REQUIRED_PROFILE_FIELDS.filter((fieldName) => {
    if (fieldName === "skills") {
      return profile.skills.length === 0
    }

    return profile[fieldName] === null
  })
}

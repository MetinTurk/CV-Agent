// Module: Manages the profile collection conversation state and profile merging.
import type { UserRecord } from "../db/schema"
import {
  REQUIRED_PROFILE_FIELDS,
  type ProfileChatRequest,
  type ProfileChatResponse,
  type ProfileData,
  type RequiredProfileField,
} from "../schemas/profile-chat"

const FIELD_LABELS: Record<RequiredProfileField, string> = {
  full_name: "Ad Soyad",
  location: "Şehir/Ülke",
  skills: "Yetenekler",
  education: "Eğitim/Ortalama",
}

type ProfileConversationState = {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  profile: ProfileData
}

type ProfilePatch = Partial<{
  full_name: string
  location: string
  skills: string[]
  projects: string[]
  certifications: string[]
  languages: string[]
  work_experiences: string[]
  education: string
  additional_information: string
}>

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

export class ProfileChatService {
  private readonly conversations = new Map<string, ProfileConversationState>()

  chat(user: UserRecord, request: ProfileChatRequest): ProfileChatResponse {
    const sessionId = normalizeRequiredText(request.session_id)
    const message = normalizeRequiredText(request.message)
    const conversationKey = `${user.id}:${sessionId}`
    const conversation = this.getConversation(conversationKey)

    const patch = extractProfilePatch(message)
    conversation.profile = mergeProfile(conversation.profile, patch)

    const missingRequiredFields = getMissingRequiredFields(conversation.profile)
    const reply = buildReply(conversation.profile, missingRequiredFields, patch)

    conversation.messages = [
      ...conversation.messages,
      { role: "user", content: message },
      { role: "assistant", content: reply },
    ]

    return {
      reply,
      session_id: sessionId,
      profile: conversation.profile,
      missing_required_fields: missingRequiredFields,
      is_profile_ready: missingRequiredFields.length === 0,
    }
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
    }
    this.conversations.set(conversationKey, conversation)

    return conversation
  }
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

function splitValues(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => cleanText(item))
    .filter((item): item is string => item !== null)
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

function extractProfilePatch(message: string): ProfilePatch {
  const patch: ProfilePatch = {}
  const labeledSegments = extractLabeledSegments(message)

  for (const [label, value] of labeledSegments) {
    const normalizedLabel = label.toLocaleLowerCase("tr")

    if (/(ad|isim|full.?name)/iu.test(normalizedLabel)) {
      patch.full_name = value
    } else if (
      /(şehir|sehir|ülke|ulke|lokasyon|location|konum)/iu.test(normalizedLabel)
    ) {
      patch.location = value
    } else if (/(yetenek|beceri|skill|teknoloji)/iu.test(normalizedLabel)) {
      patch.skills = splitValues(value)
    } else if (/(proje|project)/iu.test(normalizedLabel)) {
      patch.projects = splitValues(value)
    } else if (
      /(sertifika|certificate|certification)/iu.test(normalizedLabel)
    ) {
      patch.certifications = splitValues(value)
    } else if (/(dil|language)/iu.test(normalizedLabel)) {
      patch.languages = splitValues(value)
    } else if (/(deneyim|iş|is|experience)/iu.test(normalizedLabel)) {
      patch.work_experiences = splitValues(value)
    } else if (
      /(eğitim|egitim|okul|üniversite|universite|gpa|ortalama)/iu.test(
        normalizedLabel
      )
    ) {
      patch.education = value
    }
  }

  if (Object.keys(patch).length > 0) {
    return patch
  }

  return inferPatchFromSentence(message)
}

function extractLabeledSegments(message: string): Array<[string, string]> {
  const segments: Array<[string, string]> = []
  const lines = message.split(/\n|\. /)

  for (const line of lines) {
    const match = line.match(/^([^:=-]{2,40})[:=-]\s*(.+)$/u)
    if (match !== null) {
      segments.push([match[1].trim(), match[2].trim()])
    }
  }

  return segments
}

function inferPatchFromSentence(message: string): ProfilePatch {
  const lowerMessage = message.toLocaleLowerCase("tr")
  const patch: ProfilePatch = {}

  const locationMatch = message.match(
    /(?:istanbul|ankara|izmir|bursa|antalya|adana|konya|turkey|türkiye|almanya|germany|remote|uzaktan)/iu
  )
  if (locationMatch !== null) {
    patch.location = locationMatch[0]
  }

  const knownSkills = [
    "typescript",
    "javascript",
    "react",
    "node",
    "python",
    "fastapi",
    "elysia",
    "postgresql",
    "drizzle",
    "sql",
    "docker",
    "aws",
    "git",
  ]
  const skills = knownSkills.filter((skill) => lowerMessage.includes(skill))
  if (skills.length > 0) {
    patch.skills = skills
  }

  if (
    /(üniversite|universite|lisans|yüksek lisans|yuksek lisans|gpa|ortalama)/iu.test(
      message
    )
  ) {
    patch.education = message
  }

  if (/(proje|project)/iu.test(message)) {
    patch.projects = [message]
  }

  if (/(sertifika|certificate|certification)/iu.test(message)) {
    patch.certifications = [message]
  }

  return patch
}

function buildReply(
  profile: ProfileData,
  missingRequiredFields: RequiredProfileField[],
  patch: ProfilePatch
): string {
  const savedAnyField = Object.keys(patch).length > 0
  const prefix = savedAnyField
    ? "Kaydettim."
    : "Mesajını aldım; yapılandırılmış profil alanı olarak net kaydedebilmem için biraz daha açık yazalım."

  if (missingRequiredFields.length === 0) {
    return `${prefix} Zorunlu profil alanları tamamlandı. İstersen projelerini, sertifikalarını, dillerini ve iş deneyimlerini de ekleyebilirsin.`
  }

  const missingLabels = missingRequiredFields.map(
    (fieldName) => FIELD_LABELS[fieldName]
  )
  const nextQuestion = getNextQuestion(profile, missingRequiredFields[0])

  return `${prefix} Eksik zorunlu alanlar: ${missingLabels.join(", ")}. ${nextQuestion}`
}

function getNextQuestion(
  profile: ProfileData,
  nextMissingField: RequiredProfileField
): string {
  if (nextMissingField === "full_name") {
    return "Ad soyadını nasıl yazmamı istersin?"
  }

  if (nextMissingField === "location") {
    return "Hangi şehir/ülke ya da çalışma lokasyonu bilgisini ekleyelim?"
  }

  if (nextMissingField === "skills") {
    return "Başvuru CV’sinde öne çıkarmak istediğin teknik ve profesyonel yetenekleri virgülle yazar mısın?"
  }

  const locationText =
    profile.location === null ? "" : ` ${profile.location} bilgisiyle birlikte`
  return `Eğitim, bölüm, tarih ve varsa not ortalamanı${locationText} paylaşır mısın?`
}

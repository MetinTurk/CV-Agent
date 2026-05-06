// Module: Calls the Groq profile collection agent (gpt-oss) and validates its JSON reply.
import type { Settings } from "../core/config"
import type {
  ProfileData,
  ProfilePatch,
  ProfileSourceContext,
  RequiredProfileField,
} from "../schemas/profile-chat"

type ProfileConversationMessage = {
  role: "user" | "assistant"
  content: string
}

export type ProfileAgentRequest = {
  message: string
  sourceContext?: ProfileSourceContext
  profile: ProfileData
  missingRequiredFields: RequiredProfileField[]
  conversationMessages: ProfileConversationMessage[]
}

export type ProfileAgentResult = {
  reply: string
  profilePatch: ProfilePatch
}

type GroqMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

type GroqChoice = {
  message?: {
    content?: unknown
  }
}

type GroqResponse = {
  choices?: GroqChoice[]
  error?: {
    message?: unknown
  }
}

type ProfileAgentJson = {
  reply?: unknown
  profile_patch?: unknown
}

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions"

const PROFILE_AGENT_SYSTEM_PROMPT = `
Sen CV Agent uygulamasının Profil Oluşturma Asistanısın.
Görevin kullanıcının CV profili için gerekli bilgileri Türkçe, doğal ve kısa bir sohbetle toplamaktır.

Kurallar:
- Sadece geçerli JSON döndür.
- JSON şeması: {"reply": string, "profile_patch": object}
- profile_patch içine yalnızca kullanıcının son mesajında açıkça verdiği bilgileri yaz.
- source_context varsa bu kaynak metnini kullanıcının sağladığı bilgi olarak değerlendir.
- Bilgi uydurma, tahminle alan doldurma.
- Kullanıcı eksik zorunlu alanlardan birini verdiyse kaydettiğini söyle.
- Eksik zorunlu alan varsa reply sonunda tek ve net bir takip sorusu sor.
- Zorunlu alanlar tamamlandıysa opsiyonel proje, sertifika, dil veya iş deneyimi bilgisini iste.
- Kullanıcıya gösterilen tüm metinlerde Türkçe karakter kullan.
`.trim()

export class ProfileAgentConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProfileAgentConfigurationError"
  }
}

export class ProfileAgentRequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "ProfileAgentRequestError"
  }
}

export class ProfileAgentClient {
  constructor(private readonly settings: Settings) {}

  async generateResponse(
    request: ProfileAgentRequest
  ): Promise<ProfileAgentResult> {
    if (this.settings.groqApiKey === null) {
      throw new ProfileAgentConfigurationError(
        "GROQ_API_KEY tanımlı olmadığı için profil asistanı LLM isteği gönderemiyor."
      )
    }

    const response = await this.fetchWithRetries(request)

    try {
      const text = extractGroqText(response)
      return parseProfileAgentResult(text)
    } catch (error) {
      throw new ProfileAgentRequestError(
        "Profil asistanı LLM yanıtı işlenemedi.",
        error instanceof Error ? { cause: error } : undefined
      )
    }
  }

  private async fetchWithRetries(
    request: ProfileAgentRequest
  ): Promise<GroqResponse> {
    const attempts = Math.max(1, this.settings.agentMaxRetries + 1)
    let lastError: unknown = null

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.fetchOnce(request)
      } catch (error) {
        lastError = error
        console.error(
          `[profile-agent] attempt ${attempt}/${attempts} failed:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    throw new ProfileAgentRequestError(
      "Profil asistanı LLM yanıtı alınamadı.",
      lastError instanceof Error ? { cause: lastError } : undefined
    )
  }

  private async fetchOnce(
    request: ProfileAgentRequest
  ): Promise<GroqResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      this.settings.agentRequestTimeoutSeconds * 1000
    )

    try {
      const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.settings.groqApiKey ?? ""}`,
        },
        body: JSON.stringify(buildGroqPayload(this.settings.agentModel, request)),
        signal: controller.signal,
      })

      const payload = (await response.json()) as GroqResponse

      if (!response.ok) {
        const errorMessage =
          typeof payload.error?.message === "string"
            ? payload.error.message
            : "Profil asistanı LLM isteği başarısız oldu."
        console.error(
          `[profile-agent] Groq ${response.status}:`,
          JSON.stringify(payload).slice(0, 1000)
        )
        throw new ProfileAgentRequestError(errorMessage)
      }

      return payload
    } finally {
      clearTimeout(timeout)
    }
  }
}

function buildGroqPayload(model: string, request: ProfileAgentRequest): object {
  const recentMessages = request.conversationMessages.slice(-8)

  const messages: GroqMessage[] = [
    { role: "system", content: PROFILE_AGENT_SYSTEM_PROMPT },
    ...recentMessages.map<GroqMessage>((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: JSON.stringify({
        current_profile: request.profile,
        missing_required_fields: request.missingRequiredFields,
        latest_user_message: request.message,
        source_context: request.sourceContext ?? null,
      }),
    },
  ]

  return {
    model,
    messages,
    temperature: 0.2,
    response_format: { type: "json_object" },
  }
}

function extractGroqText(response: GroqResponse): string {
  const content = response.choices?.[0]?.message?.content
  const text = typeof content === "string" ? content.trim() : ""

  if (text.length === 0) {
    throw new Error("Profil asistanı LLM yanıtı boş döndü.")
  }

  return text
}

export function parseProfileAgentResult(text: string): ProfileAgentResult {
  const parsedJson = parseJsonObject(text)

  if (!isProfileAgentJson(parsedJson)) {
    throw new Error("Profil asistanı LLM yanıtı beklenen JSON şemasında değil.")
  }

  return {
    reply: parsedJson.reply,
    profilePatch: sanitizeProfilePatch(parsedJson.profile_patch),
  }
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/u)
    if (jsonMatch === null) {
      throw new Error("Profil asistanı LLM yanıtı JSON olarak okunamadı.")
    }

    return JSON.parse(jsonMatch[0])
  }
}

function isProfileAgentJson(value: unknown): value is {
  reply: string
  profile_patch: Record<string, unknown>
} {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as ProfileAgentJson
  return (
    typeof candidate.reply === "string" &&
    isObjectRecord(candidate.profile_patch)
  )
}

function sanitizeProfilePatch(value: Record<string, unknown>): ProfilePatch {
  const profilePatch: ProfilePatch = {}
  const allowedStringFields = [
    "full_name",
    "location",
    "education",
    "additional_information",
  ] as const
  const allowedListFields = [
    "skills",
    "projects",
    "certifications",
    "languages",
    "work_experiences",
  ] as const
  for (const fieldName of allowedStringFields) {
    const fieldValue = value[fieldName]
    if (typeof fieldValue === "string") {
      profilePatch[fieldName] = fieldValue
    }
  }

  for (const fieldName of allowedListFields) {
    const fieldValue = value[fieldName]
    if (
      Array.isArray(fieldValue) &&
      fieldValue.every((item) => typeof item === "string")
    ) {
      profilePatch[fieldName] = fieldValue
    }
  }

  return profilePatch
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

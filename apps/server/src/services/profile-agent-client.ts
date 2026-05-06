// Module: Calls the Gemini profile collection agent and validates its JSON reply.
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

type GeminiTextPart = {
  text?: unknown
}

type GeminiCandidate = {
  content?: {
    parts?: GeminiTextPart[]
  }
}

type GeminiResponse = {
  candidates?: GeminiCandidate[]
  error?: {
    message?: unknown
  }
}

type ProfileAgentJson = {
  reply?: unknown
  profile_patch?: unknown
}

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
    if (this.settings.googleApiKey === null) {
      throw new ProfileAgentConfigurationError(
        "GOOGLE_API_KEY tanımlı olmadığı için profil asistanı LLM isteği gönderemiyor."
      )
    }

    const response = await this.fetchWithRetries(request)
    const text = extractGeminiText(response)
    return parseProfileAgentResult(text)
  }

  private async fetchWithRetries(
    request: ProfileAgentRequest
  ): Promise<GeminiResponse> {
    const attempts = Math.max(1, this.settings.profileAgentMaxRetries + 1)
    let lastError: unknown = null

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.fetchOnce(request)
      } catch (error) {
        lastError = error
      }
    }

    throw new ProfileAgentRequestError(
      "Profil asistanı LLM yanıtı alınamadı.",
      lastError instanceof Error ? { cause: lastError } : undefined
    )
  }

  private async fetchOnce(
    request: ProfileAgentRequest
  ): Promise<GeminiResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      this.settings.profileAgentRequestTimeoutSeconds * 1000
    )

    try {
      const response = await fetch(this.buildEndpointUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildGeminiPayload(request)),
        signal: controller.signal,
      })

      const payload = (await response.json()) as GeminiResponse

      if (!response.ok) {
        const errorMessage =
          typeof payload.error?.message === "string"
            ? payload.error.message
            : "Profil asistanı LLM isteği başarısız oldu."
        throw new ProfileAgentRequestError(errorMessage)
      }

      return payload
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildEndpointUrl(): string {
    const model = normalizeGeminiModel(this.settings.profileAgentModel)
    const encodedModel = encodeURIComponent(model)
    const encodedApiKey = encodeURIComponent(this.settings.googleApiKey ?? "")

    return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${encodedApiKey}`
  }
}

function normalizeGeminiModel(model: string): string {
  return model.replace(/^google_genai:/u, "")
}

function buildGeminiPayload(request: ProfileAgentRequest): object {
  const recentMessages = request.conversationMessages.slice(-8)

  return {
    systemInstruction: {
      parts: [{ text: PROFILE_AGENT_SYSTEM_PROMPT }],
    },
    contents: [
      ...recentMessages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              current_profile: request.profile,
              missing_required_fields: request.missingRequiredFields,
              latest_user_message: request.message,
              source_context: request.sourceContext ?? null,
            }),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  }
}

function extractGeminiText(response: GeminiResponse): string {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim()

  if (text === undefined || text.length === 0) {
    throw new Error("Profil asistanı LLM yanıtı boş döndü.")
  }

  return text
}

function parseProfileAgentResult(text: string): ProfileAgentResult {
  const parsedJson = parseJsonObject(text)

  if (!isProfileAgentJson(parsedJson)) {
    throw new Error("Profil asistanı LLM yanıtı beklenen JSON şemasında değil.")
  }

  return {
    reply: parsedJson.reply,
    profilePatch: parsedJson.profile_patch,
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
  profile_patch: ProfilePatch
} {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as ProfileAgentJson
  return (
    typeof candidate.reply === "string" &&
    isProfilePatch(candidate.profile_patch)
  )
}

function isProfilePatch(value: unknown): value is ProfilePatch {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const allowedStringFields = [
    "full_name",
    "location",
    "education",
    "additional_information",
  ]
  const allowedListFields = [
    "skills",
    "projects",
    "certifications",
    "languages",
    "work_experiences",
  ]
  const allowedFields = new Set([...allowedStringFields, ...allowedListFields])

  for (const [fieldName, fieldValue] of Object.entries(candidate)) {
    if (!allowedFields.has(fieldName)) {
      return false
    }

    if (
      allowedStringFields.includes(fieldName) &&
      typeof fieldValue !== "string"
    ) {
      return false
    }

    if (
      allowedListFields.includes(fieldName) &&
      (!Array.isArray(fieldValue) ||
        fieldValue.some((item) => typeof item !== "string"))
    ) {
      return false
    }
  }

  return true
}

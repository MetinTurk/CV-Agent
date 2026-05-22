// Module: Calls the Groq tailored-CV agent and validates its structured JSON reply.
import type { Settings } from "../core/config"
import type { JobDescription } from "../schemas/job-analysis"
import type { ProfileData } from "../schemas/profile-chat"
import type {
  TailoredCv,
  TailoredCvEducation,
  TailoredCvExperience,
  TailoredCvProject,
} from "../schemas/cv-generation"

export type CvGenerationAgentRequest = {
  profile: ProfileData
  jobDescription: JobDescription
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

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions"

const CV_GENERATION_SYSTEM_PROMPT = `
Sen CV Agent uygulamasının Hedefli CV Yazım Asistanısın.
Görevin, kullanıcının profil bilgileri ile verilen iş tanımını birleştirerek bu pozisyona özel hazırlanmış bir CV üretmektir.

Kurallar:
- Sadece geçerli JSON döndür.
- JSON şeması:
  {
    "full_name": string,
    "title": string,
    "location": string | null,
    "summary": string,
    "skills": string[],
    "experiences": [
      { "role": string, "company": string, "period": string, "bullets": string[] }
    ],
    "educations": [
      { "institution": string, "degree": string, "period": string }
    ],
    "projects": [
      { "name": string, "description": string }
    ],
    "certifications": string[],
    "languages": string[]
  }
- title: ilanın pozisyon başlığı ile uyumlu, profilde olmasa bile uygun bir profesyonel ünvan seç.
- summary: 3-4 cümlelik profesyonel özet; profildeki güçlü yönleri ilanın gereksinimleriyle eşleştir.
- skills: önce ilanla örtüşen ve profilde geçen yetenekleri listele.
- experiences: profildeki iş deneyimlerini ilanla en alakalı etkilere odaklanarak madde madde yeniden yaz. Her bullet eylem fiiliyle başlasın ve mümkünse ölçülebilir sonuç ver.
- educations: profildeki eğitim bilgisinden çıkarabildiklerini doldur; bilgi yetersizse boş dizi döndür.
- projects: profildeki projeleri ilanla alakalı kısa açıklamalarla yeniden ifade et.
- certifications, languages: profilde geçenleri olduğu gibi aktar.
- Bilgi uydurma; profilde olmayan deneyim, yetenek, sertifika veya eğitim ekleme. Profilde yoksa boş dizi veya null döndür.
- Tüm metinler doğal Türkçe olsun ve Türkçe karakter kullan; ilan İngilizce ise teknik terimleri ilanla uyumlu tut.
- Listelerde her madde tek satır ve net bir ifade olsun.
`.trim()

export class CvGenerationAgentConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CvGenerationAgentConfigurationError"
  }
}

export class CvGenerationAgentRequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "CvGenerationAgentRequestError"
  }
}

export class CvGenerationAgentClient {
  constructor(private readonly settings: Settings) {}

  async generateTailoredCv(
    request: CvGenerationAgentRequest
  ): Promise<TailoredCv> {
    if (this.settings.groqApiKey === null) {
      throw new CvGenerationAgentConfigurationError(
        "GROQ_API_KEY tanımlı olmadığı için CV üretim asistanı LLM isteği gönderemiyor."
      )
    }

    const response = await this.fetchWithRetries(
      buildPayload(this.settings.agentModel, request),
      "tailored-cv"
    )

    try {
      const text = extractGroqText(response)
      return parseTailoredCv(text, request.profile)
    } catch (error) {
      throw new CvGenerationAgentRequestError(
        "CV üretim asistanı LLM yanıtı işlenemedi.",
        error instanceof Error ? { cause: error } : undefined
      )
    }
  }

  private async fetchWithRetries(
    payload: object,
    label: string
  ): Promise<GroqResponse> {
    const attempts = Math.max(1, this.settings.agentMaxRetries + 1)
    let lastError: unknown = null

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.fetchOnce(payload)
      } catch (error) {
        lastError = error
        console.error(
          `[cv-generation-agent:${label}] attempt ${attempt}/${attempts} failed:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    throw new CvGenerationAgentRequestError(
      "CV üretim asistanı LLM yanıtı alınamadı.",
      lastError instanceof Error ? { cause: lastError } : undefined
    )
  }

  private async fetchOnce(payload: object): Promise<GroqResponse> {
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
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const responsePayload = (await response.json()) as GroqResponse

      if (!response.ok) {
        const errorMessage =
          typeof responsePayload.error?.message === "string"
            ? responsePayload.error.message
            : "CV üretim asistanı LLM isteği başarısız oldu."
        console.error(
          `[cv-generation-agent] Groq ${response.status}:`,
          JSON.stringify(responsePayload).slice(0, 1000)
        )
        throw new CvGenerationAgentRequestError(errorMessage)
      }

      return responsePayload
    } finally {
      clearTimeout(timeout)
    }
  }
}

function buildPayload(
  model: string,
  request: CvGenerationAgentRequest
): object {
  const messages: GroqMessage[] = [
    { role: "system", content: CV_GENERATION_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        user_profile: request.profile,
        job_description: request.jobDescription,
      }),
    },
  ]

  return {
    model,
    messages,
    temperature: 0.4,
    response_format: { type: "json_object" },
  }
}

function extractGroqText(response: GroqResponse): string {
  const content = response.choices?.[0]?.message?.content
  const text = typeof content === "string" ? content.trim() : ""

  if (text.length === 0) {
    throw new Error("CV üretim asistanı LLM yanıtı boş döndü.")
  }

  return text
}

export function parseTailoredCv(
  text: string,
  profile: ProfileData
): TailoredCv {
  const parsed = parseJsonObject(text)

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("CV üretim asistanı LLM yanıtı beklenen JSON şemasında değil.")
  }

  const candidate = parsed as Record<string, unknown>

  return {
    full_name: stringOr(candidate.full_name, profile.full_name ?? ""),
    title: stringOr(candidate.title, ""),
    location: stringOrNull(candidate.location) ?? profile.location ?? null,
    summary: stringOr(candidate.summary, ""),
    skills: stringArray(candidate.skills),
    experiences: experiencesArray(candidate.experiences),
    educations: educationsArray(candidate.educations),
    projects: projectsArray(candidate.projects),
    certifications: stringArray(candidate.certifications),
    languages: stringArray(candidate.languages),
  }
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/u)
    if (jsonMatch === null) {
      throw new Error("CV üretim asistanı LLM yanıtı JSON olarak okunamadı.")
    }

    return JSON.parse(jsonMatch[0])
  }
}

function stringOr(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function experiencesArray(value: unknown): TailoredCvExperience[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item): TailoredCvExperience | null => {
      if (typeof item !== "object" || item === null) {
        return null
      }
      const record = item as Record<string, unknown>
      const role = stringOr(record.role, "")
      const company = stringOr(record.company, "")
      const period = stringOr(record.period, "")
      const bullets = stringArray(record.bullets)
      if (role.length === 0 && company.length === 0 && bullets.length === 0) {
        return null
      }
      return { role, company, period, bullets }
    })
    .filter((item): item is TailoredCvExperience => item !== null)
}

function educationsArray(value: unknown): TailoredCvEducation[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item): TailoredCvEducation | null => {
      if (typeof item !== "object" || item === null) {
        return null
      }
      const record = item as Record<string, unknown>
      const institution = stringOr(record.institution, "")
      const degree = stringOr(record.degree, "")
      const period = stringOr(record.period, "")
      if (
        institution.length === 0 &&
        degree.length === 0 &&
        period.length === 0
      ) {
        return null
      }
      return { institution, degree, period }
    })
    .filter((item): item is TailoredCvEducation => item !== null)
}

function projectsArray(value: unknown): TailoredCvProject[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item): TailoredCvProject | null => {
      if (typeof item === "string") {
        const trimmed = item.trim()
        if (trimmed.length === 0) return null
        return { name: trimmed, description: "" }
      }
      if (typeof item !== "object" || item === null) {
        return null
      }
      const record = item as Record<string, unknown>
      const name = stringOr(record.name, "")
      const description = stringOr(record.description, "")
      if (name.length === 0 && description.length === 0) {
        return null
      }
      return { name, description }
    })
    .filter((item): item is TailoredCvProject => item !== null)
}

// Module: Calls the Groq job-analysis agent (qwen3-32b) and validates its structured JSON reply.
import type { Settings } from "../core/config"
import type {
  JobDescription,
  MatchAnalysis,
} from "../schemas/job-analysis"
import type { ProfileData } from "../schemas/profile-chat"

export type JobAnalysisAgentRequest = {
  url: string
  pageContent: string
}

export type MatchAnalysisAgentRequest = {
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

const JOB_ANALYSIS_SYSTEM_PROMPT = `
Sen CV Agent uygulamasının İş İlanı Analiz Asistanısın.
Görevin verilen iş ilanı sayfasından yapılandırılmış bir iş tanımı çıkarmaktır.

Kurallar:
- Sadece geçerli JSON döndür.
- JSON şeması:
  {
    "title": string | null,
    "company": string | null,
    "location": string | null,
    "employment_type": string | null,
    "summary": string | null,
    "responsibilities": string[],
    "requirements": string[],
    "skills": string[]
  }
- Bilgi uydurma; sayfada açıkça yer almayan alanları null veya boş dizi olarak bırak.
- summary en fazla 3 cümle olsun ve ilanın özünü ver.
- responsibilities, requirements ve skills listelerinde her madde tek satır olsun.
- Çıktı metinlerinde Türkçe karakter kullan; ilan İngilizce ise olduğu gibi koru.
`.trim()

const MATCH_ANALYSIS_SYSTEM_PROMPT = `
Sen CV Agent uygulamasının Uyum Analizi Asistanısın.
Görevin kullanıcının profili ile verilen iş tanımını karşılaştırarak yapılandırılmış bir uyum analizi üretmektir.

Kurallar:
- Sadece geçerli JSON döndür.
- JSON şeması:
  {
    "yeterli_yonler": string[],
    "eksik_yonler": string[],
    "genel_uyumluluk_puani": number,
    "tavsiyeler": string[]
  }
- yeterli_yonler: kullanıcının profilinde olan ve iş ilanının gereksinimleriyle örtüşen yetkinlik, deneyim veya eğitim maddelerini listele.
- eksik_yonler: iş ilanında istenip kullanıcı profilinde bulunmayan veya yetersiz olan yetkinlikleri listele.
- genel_uyumluluk_puani: 0 ile 100 arasında bir tam sayı; profilin ilanla genel uyum yüzdesini ifade etsin.
- tavsiyeler: kullanıcının bu ilana daha uygun hale gelmesi için somut, uygulanabilir öneriler ver (kurs, sertifika, proje, CV vurgusu vb.).
- Bilgi uydurma; profil veya ilanda açıkça olmayan bir şeyi varsaymadan çıkar.
- Tüm metinler doğal Türkçe olsun ve Türkçe karakter kullan.
- Listelerde her madde tek satır ve net bir ifade olsun.
`.trim()

export class JobAnalysisAgentConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "JobAnalysisAgentConfigurationError"
  }
}

export class JobAnalysisAgentRequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "JobAnalysisAgentRequestError"
  }
}

export class JobAnalysisAgentClient {
  constructor(private readonly settings: Settings) {}

  async generateJobDescription(
    request: JobAnalysisAgentRequest
  ): Promise<JobDescription> {
    if (this.settings.groqApiKey === null) {
      throw new JobAnalysisAgentConfigurationError(
        "GROQ_API_KEY tanımlı olmadığı için iş analizi asistanı LLM isteği gönderemiyor."
      )
    }

    const response = await this.fetchWithRetries(
      buildJobDescriptionPayload(this.settings.agentModel, request),
      "job-description"
    )

    try {
      const text = extractGroqText(response)
      return parseJobDescription(text)
    } catch (error) {
      throw new JobAnalysisAgentRequestError(
        "İş analizi asistanı LLM yanıtı işlenemedi.",
        error instanceof Error ? { cause: error } : undefined
      )
    }
  }

  async generateMatchAnalysis(
    request: MatchAnalysisAgentRequest
  ): Promise<MatchAnalysis> {
    if (this.settings.groqApiKey === null) {
      throw new JobAnalysisAgentConfigurationError(
        "GROQ_API_KEY tanımlı olmadığı için uyum analizi asistanı LLM isteği gönderemiyor."
      )
    }

    const response = await this.fetchWithRetries(
      buildMatchAnalysisPayload(this.settings.agentModel, request),
      "match-analysis"
    )

    try {
      const text = extractGroqText(response)
      return parseMatchAnalysis(text)
    } catch (error) {
      throw new JobAnalysisAgentRequestError(
        "Uyum analizi asistanı LLM yanıtı işlenemedi.",
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
          `[job-analysis-agent:${label}] attempt ${attempt}/${attempts} failed:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    throw new JobAnalysisAgentRequestError(
      "İş analizi asistanı LLM yanıtı alınamadı.",
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
            : "İş analizi asistanı LLM isteği başarısız oldu."
        console.error(
          `[job-analysis-agent] Groq ${response.status}:`,
          JSON.stringify(responsePayload).slice(0, 1000)
        )
        throw new JobAnalysisAgentRequestError(errorMessage)
      }

      return responsePayload
    } finally {
      clearTimeout(timeout)
    }
  }
}

function buildJobDescriptionPayload(
  model: string,
  request: JobAnalysisAgentRequest
): object {
  const messages: GroqMessage[] = [
    { role: "system", content: JOB_ANALYSIS_SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        source_url: request.url,
        page_content: request.pageContent,
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

function buildMatchAnalysisPayload(
  model: string,
  request: MatchAnalysisAgentRequest
): object {
  const messages: GroqMessage[] = [
    { role: "system", content: MATCH_ANALYSIS_SYSTEM_PROMPT },
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
    temperature: 0.2,
    response_format: { type: "json_object" },
  }
}

function extractGroqText(response: GroqResponse): string {
  const content = response.choices?.[0]?.message?.content
  const text = typeof content === "string" ? content.trim() : ""

  if (text.length === 0) {
    throw new Error("İş analizi asistanı LLM yanıtı boş döndü.")
  }

  return text
}

export function parseJobDescription(text: string): JobDescription {
  const parsed = parseJsonObject(text)

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("İş analizi asistanı LLM yanıtı beklenen JSON şemasında değil.")
  }

  const candidate = parsed as Record<string, unknown>

  return {
    title: stringOrNull(candidate.title),
    company: stringOrNull(candidate.company),
    location: stringOrNull(candidate.location),
    employment_type: stringOrNull(candidate.employment_type),
    summary: stringOrNull(candidate.summary),
    responsibilities: stringArray(candidate.responsibilities),
    requirements: stringArray(candidate.requirements),
    skills: stringArray(candidate.skills),
  }
}

export function parseMatchAnalysis(text: string): MatchAnalysis {
  const parsed = parseJsonObject(text)

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Uyum analizi asistanı LLM yanıtı beklenen JSON şemasında değil.")
  }

  const candidate = parsed as Record<string, unknown>

  return {
    yeterli_yonler: stringArray(candidate.yeterli_yonler),
    eksik_yonler: stringArray(candidate.eksik_yonler),
    genel_uyumluluk_puani: clampScore(candidate.genel_uyumluluk_puani),
    tavsiyeler: stringArray(candidate.tavsiyeler),
  }
}

function clampScore(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN

  if (!Number.isFinite(numeric)) {
    return 0
  }

  const rounded = Math.round(numeric)
  if (rounded < 0) return 0
  if (rounded > 100) return 100
  return rounded
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/u)
    if (jsonMatch === null) {
      throw new Error("İş analizi asistanı LLM yanıtı JSON olarak okunamadı.")
    }

    return JSON.parse(jsonMatch[0])
  }
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

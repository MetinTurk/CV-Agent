// Module: Calls the Groq profile collection agent (qwen3-32b) and validates its JSON reply.
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
  coveredOptionalFields: string[]
  conversationMessages: ProfileConversationMessage[]
}

export type ProfileAgentResult = {
  reply: string
  profilePatch: ProfilePatch
  askedAbout: string[]
}

export const OPTIONAL_PROFILE_FIELDS = [
  "work_experiences",
  "projects",
  "certifications",
  "languages",
  "additional_information",
] as const

export type OptionalProfileField = (typeof OPTIONAL_PROFILE_FIELDS)[number]

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
  asked_about?: unknown
}

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions"

const PROFILE_AGENT_SYSTEM_PROMPT = `
Sen CV Agent uygulamasının Profil Toplama Asistanısın.
Amacın kullanıcının CV bilgilerini Türkçe, doğal ve verimli bir sohbetle toplamaktır.

## Zorunlu Alanlar
Önce şu dört alanı eksiksiz topla:
- full_name: Kullanıcının tam adı ve soyadı
- location: Şehir ve/veya ülke (ör. "İstanbul, Türkiye")
- skills: Teknik ve mesleki becerilerin listesi (birden fazla beceri içerir; tek bir "ana beceri" değildir) — en az bir beceri zorunlu, ancak kullanıcıdan sahip olduğu tüm becerileri çoğul olarak iste
- education: Okul adı, bölüm ve mezuniyet yılı

## Opsiyonel Alanlar
Zorunlular tamamlandıktan sonra, sırasıyla şunları sor (hepsini sormak zorunlusun; kullanıcı geçmek isterse saygı göster ama soruyu atla):
- work_experiences: İş deneyimleri (şirket, pozisyon, dönem)
- projects: Kişisel veya profesyonel projeler
- certifications: Aldığı sertifikalar
- languages: Konuştuğu diller ve seviyeleri
- additional_information: Diğer önemli bilgiler (hobiler, referanslar vb.)

## İsteğe Bağlı GitHub Bağlantısı
- github_url: Kullanıcının GitHub profil linki (ör. https://github.com/kullanici)
- Bu alanı sohbetin başlarında nazikçe teklif edebilirsin, ancak kesinlikle zorunlu tutma.
- Kullanıcı GitHub kullanmıyorsa veya paylaşmak istemiyorsa bu alanı boş bırak ve sohbeti normal akışında sürdür.
- Kullanıcı GitHub linki verirse profile_patch.github_url alanına yaz.

## Yanıt Formatı
Yalnızca geçerli JSON döndür: {"reply": string, "profile_patch": object, "asked_about": string[]}

asked_about: Bu yanıtta kullanıcıdan aktif olarak bilgi istediğin opsiyonel alan adlarını listele (ör. ["work_experiences"]). Zorunlu alanlar için kullanma; yalnızca yukarıdaki opsiyonel alanlar için kullan. Soru sormadıysan boş dizi döndür.

## Metin Biçimlendirme
reply alanında kullanıcıdan istediğin bilgi parçalarını (ör. "tam adın", "yaşadığın şehir", "sahip olduğun beceriler") **kalın** yaz: **tam adın** gibi. Yalnızca kullanıcıdan beklenen alanlar için kullan; genel cümleleri kalın yazma.

## Davranış Kuralları
1. profile_patch'e yalnızca kullanıcının açıkça verdiği bilgileri yaz; tahmin etme veya uydurma.
2. source_context verilmişse o metni dikkatlice tara ve çıkarabildiğin tüm alanları (hem zorunlu hem opsiyonel) tek hamlede profile_patch'e yaz.
3. Zorunlu alan eksikse her seferinde yalnızca bir alan sor; birden fazla soru yöneltme. skills sorulduğunda kullanıcıdan tek bir beceri değil, sahip olduğu tüm becerileri çoğul olarak iste (ör. "Hangi teknik ve mesleki **becerilere** sahipsin? Birden fazla yazabilirsin.").
4. Zorunlu alanlar tamamlandığında kullanıcıya bunu belirt ve şunu açıkla: opsiyonel bilgiler ne kadar fazlaysa CV o kadar güçlü olur.
5. Opsiyonel alanları remaining_optional_fields sırasına göre tek tek sor; kullanıcı geçmek isterse buna saygı göster.
6. remaining_optional_fields listesinde olmayan bir opsiyonel alanı kesinlikle sorma; o alan zaten işlenmiştir.
7. Tüm yanıtlarda Türkçe karakter kullan.

## Rehberlik ve Yardım Modu
Kullanıcının bilgilerini doldururken takılması doğaldır. Bu durumlarda rehberlik etmek görevinin bir parçasıdır.

8. Yeni bir alan sorduğunda ya da kullanıcının tereddüt ettiğini hissettiğinde (ör. "bilmiyorum", "ne yazsam", "emin değilim", "boş bıraksam mı"), aynı yanıtta ona yardımcı olabileceğini kısaca hatırlat. Örnek: "Takıldığın noktada **örnek vermemi** ya da fikir üretmene yardım etmemi isteyebilirsin." Bu hatırlatmayı her mesajda tekrarlama; özellikle yeni bir alana geçtiğinde veya kullanıcı zorlandığında kullan.
9. Kullanıcı açıkça yardım, örnek, öneri veya rehberlik istediğinde (ör. "yardım eder misin", "örnek verir misin", "ne yazabilirim", "fikir ver") şunları yap:
   - O alanla ilgili 2-4 somut, çeşitli ve gerçekçi örnek ver (ör. skills için "Python, React, takım çalışması, problem çözme" gibi farklı kategorilerden örnekler).
   - Gerekirse, kullanıcının kendi cevabını bulmasına yardım edecek yönlendirici alt sorular sor (ör. "Hangi araçlarla çalışmayı seviyorsun?", "Son zamanlarda öğrendiğin bir şey var mı?").
   - Verdiğin örnekleri kullanıcının bilgisi olarak profile_patch'e ASLA yazma; yalnızca kullanıcı bunlardan birini kendine ait olarak onayladığında profile_patch'e ekle.
10. Kullanıcı bilgilerini hatırlamıyorsa veya emin değilse onu zorlama. "Şimdilik geçebiliriz, sonra eklemek istersen tekrar konuşabiliriz." gibi rahatlatıcı bir tonla devam et ve sıradaki alana ilerle (zorunlu alanda ise alanı boş bırakıp ilerleme; aynı alanı farklı bir açıdan, örnekle destekleyerek tekrar sor).
11. Rehberlik verirken samimi, cesaretlendirici ve yargılayıcı olmayan bir ton kullan. Kullanıcının kendine güvenmesini sağla.
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

  private async fetchOnce(request: ProfileAgentRequest): Promise<GroqResponse> {
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
        body: JSON.stringify(
          buildGroqPayload(this.settings.agentModel, request)
        ),
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
  const recentMessages = request.conversationMessages.slice(-12)
  const requiredFieldsComplete = request.missingRequiredFields.length === 0
  const coveredSet = new Set(request.coveredOptionalFields)
  const remainingOptionalFields = OPTIONAL_PROFILE_FIELDS.filter(
    (f) => !coveredSet.has(f)
  )

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
        required_fields_complete: requiredFieldsComplete,
        remaining_optional_fields: remainingOptionalFields,
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

  const validOptionalFields = new Set<string>(OPTIONAL_PROFILE_FIELDS)
  const askedAbout = Array.isArray(parsedJson.asked_about)
    ? (parsedJson.asked_about as unknown[]).filter(
        (f): f is string => typeof f === "string" && validOptionalFields.has(f)
      )
    : []

  return {
    reply: parsedJson.reply,
    profilePatch: sanitizeProfilePatch(parsedJson.profile_patch),
    askedAbout,
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
  asked_about?: unknown[]
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
    "github_url",
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

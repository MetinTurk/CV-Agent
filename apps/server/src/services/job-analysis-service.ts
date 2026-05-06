// Module: Produces deterministic demo job analysis results for extension previews.
import type {
  AnalysisInsight,
  CreateJobAnalysisRequest,
  CreateJobAnalysisResponse,
  ExtractedJobPosting,
} from "../schemas/job-analysis"

const DEFAULT_STRENGTH_KEYWORDS = [
  "TypeScript",
  "React",
  "API",
  "otomasyon",
  "analiz",
]

function stableHash(value: string): string {
  let hash = 0

  for (const character of value) {
    hash = (hash << 5) - hash + character.charCodeAt(0)
    hash |= 0
  }

  return Math.abs(hash).toString(36).padStart(6, "0").slice(0, 6)
}

function collectMatchedKeywords(jobPosting: ExtractedJobPosting): string[] {
  const searchableText = [
    jobPosting.title,
    jobPosting.companyName,
    jobPosting.descriptionText,
    ...jobPosting.requirements,
    ...jobPosting.responsibilities,
  ]
    .filter((item): item is string => item !== null)
    .join(" ")
    .toLocaleLowerCase("tr")

  return DEFAULT_STRENGTH_KEYWORDS.filter((keyword) =>
    searchableText.includes(keyword.toLocaleLowerCase("tr"))
  )
}

function getCompatibilityScore(jobPosting: ExtractedJobPosting): number {
  const matchedKeywords = collectMatchedKeywords(jobPosting)
  const workplaceBonus =
    jobPosting.workplaceType === "remote" ||
    jobPosting.workplaceType === "hybrid"
      ? 4
      : 0
  const requirementBonus = Math.min(jobPosting.requirements.length * 2, 10)

  return Math.min(
    92,
    72 + matchedKeywords.length * 3 + workplaceBonus + requirementBonus
  )
}

function createStrengths(
  jobPosting: ExtractedJobPosting,
  matchedKeywords: string[]
): AnalysisInsight[] {
  const visibleKeywords =
    matchedKeywords.length > 0
      ? matchedKeywords
      : DEFAULT_STRENGTH_KEYWORDS.slice(0, 3)

  return [
    {
      title: "Teknik yetkinlik uyumu",
      detail:
        "İlan metni, aday profilindeki modern web ve API geliştirme odağıyla güçlü şekilde kesişiyor.",
      evidence: visibleKeywords,
    },
    {
      title: "Ürün akışı anlayışı",
      detail:
        "İş ilanındaki analiz, ölçümleme ve kullanıcı deneyimi beklentileri CV Agent profil akışıyla uyumlu.",
      evidence: jobPosting.responsibilities.slice(0, 2),
    },
  ]
}

function createImprovementAreas(
  jobPosting: ExtractedJobPosting
): AnalysisInsight[] {
  return [
    {
      title: "Ölçülebilir başarılar",
      detail:
        "CV'de proje çıktıları daha fazla sayı, oran ve kapsam bilgisiyle desteklenirse ATS etkisi artar.",
      evidence: ["Performans artışı", "Kullanıcı etkisi", "Teslim süresi"],
    },
    {
      title: "İlan diline yakın özet",
      detail:
        "Profesyonel özet bölümünde ilandaki anahtar kelimeler daha doğrudan kullanılmalı.",
      evidence: jobPosting.requirements.slice(0, 3),
    },
  ]
}

function createMissingRequirements(
  jobPosting: ExtractedJobPosting
): AnalysisInsight[] {
  const fallbackRequirement =
    jobPosting.requirements[0] ?? "Ekip içi teknik iletişim ve dokümantasyon"

  return [
    {
      title: "Kanıt seviyesi artırılmalı",
      detail:
        "Profilde bu beklentiye karşılık gelen deneyim var, ancak CV maddelerinde daha açık kanıtlanmalı.",
      evidence: [fallbackRequirement],
    },
  ]
}

export class JobAnalysisService {
  createDemoAnalysis(
    request: CreateJobAnalysisRequest
  ): CreateJobAnalysisResponse {
    const { jobPosting } = request
    const analysisId = `demo-${stableHash(
      `${jobPosting.sourceUrl}-${jobPosting.title ?? ""}-${jobPosting.companyName ?? ""}`
    )}`
    const matchedKeywords = collectMatchedKeywords(jobPosting)
    const compatibilityScore = getCompatibilityScore(jobPosting)
    const createdAt = new Date().toISOString()
    const title = jobPosting.title ?? "İş ilanı"
    const companyName = jobPosting.companyName ?? "Şirket"

    return {
      analysisId,
      status: "completed",
      redirectUrl: `/job-analysis?analysisId=${analysisId}`,
      summary: `${companyName} için ${title} ilanı demo modunda analiz edildi. Eşleşme skoru ${compatibilityScore}/100.`,
      detail: {
        id: analysisId,
        jobPosting,
        companyName: jobPosting.companyName,
        title: jobPosting.title,
        compatibilityScore,
        decision: compatibilityScore >= 82 ? "apply" : "consider",
        strengths: createStrengths(jobPosting, matchedKeywords),
        improvementAreas: createImprovementAreas(jobPosting),
        missingRequirements: createMissingRequirements(jobPosting),
        recommendations: [
          "CV özetini ilanın ilk üç teknik beklentisine göre yeniden yaz.",
          "Projeler bölümünde ölçülebilir sonuçları ve kullanılan teknolojileri öne çıkar.",
          "Başvuru öncesi ATS kontrolünde anahtar kelime yoğunluğunu tekrar doğrula.",
        ],
        createdAt,
      },
    }
  }
}

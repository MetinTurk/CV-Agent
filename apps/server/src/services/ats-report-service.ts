// Module: Produces a typed ATS compatibility report from a tailored CV and job description.
import type {
  AtsMatchLevel,
  AtsReportCreateRequest,
  AtsReportResponse,
} from "../schemas/ats-report"
import type { TailoredCv } from "../schemas/cv-generation"
import type { JobDescription } from "../schemas/job-analysis"

const MAX_REPORT_ITEMS = 6

export class AtsReportService {
  generate(request: AtsReportCreateRequest): AtsReportResponse {
    const jobKeywords = collectJobKeywords(request.job_description)
    const cvText = buildCvSearchText(request.tailored_cv)
    const matchedKeywords = jobKeywords.filter((keyword) =>
      cvText.includes(normalizeKeyword(keyword))
    )
    const missingKeywords = jobKeywords.filter(
      (keyword) => !matchedKeywords.includes(keyword)
    )
    const similarityScore = calculateSimilarityScore(
      matchedKeywords.length,
      jobKeywords.length,
      request.tailored_cv
    )

    return {
      similarity_score: similarityScore,
      match_level: toMatchLevel(similarityScore),
      strong_matches: buildStrongMatches(matchedKeywords),
      warnings: buildWarnings(missingKeywords, request.tailored_cv),
      recommendations: buildRecommendations(
        missingKeywords,
        request.job_description,
        request.tailored_cv
      ),
      created_at: new Date().toISOString(),
    }
  }
}

function collectJobKeywords(jobDescription: JobDescription): string[] {
  return uniqueStrings([
    ...jobDescription.skills,
    ...jobDescription.requirements.flatMap(splitRequirement),
  ]).slice(0, 30)
}

function splitRequirement(requirement: string): string[] {
  return requirement
    .split(/[,/;|]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
}

function buildCvSearchText(cv: TailoredCv): string {
  const values = [
    cv.title,
    cv.summary,
    cv.location ?? "",
    ...cv.skills,
    ...cv.certifications,
    ...cv.languages,
    ...cv.experiences.flatMap((experience) => [
      experience.role,
      experience.company,
      experience.period,
      ...experience.bullets,
    ]),
    ...cv.educations.flatMap((education) => [
      education.institution,
      education.degree,
      education.period,
    ]),
    ...cv.projects.flatMap((project) => [project.name, project.description]),
  ]

  return normalizeKeyword(values.join(" "))
}

function calculateSimilarityScore(
  matchedCount: number,
  keywordCount: number,
  cv: TailoredCv
): number {
  if (keywordCount === 0) {
    return cv.summary.length > 0 || cv.skills.length > 0 ? 60 : 35
  }

  const keywordCoverage = matchedCount / keywordCount
  const contentCompleteness = calculateContentCompleteness(cv)
  return clampScore(Math.round(keywordCoverage * 80 + contentCompleteness * 20))
}

function calculateContentCompleteness(cv: TailoredCv): number {
  const sections = [
    cv.summary.length > 0,
    cv.skills.length > 0,
    cv.experiences.length > 0,
    cv.projects.length > 0,
    cv.educations.length > 0,
  ]
  const completedSections = sections.filter(Boolean).length
  return completedSections / sections.length
}

function toMatchLevel(score: number): AtsMatchLevel {
  if (score >= 85) return "guclu"
  if (score >= 70) return "orta-guclu"
  if (score >= 50) return "orta"
  return "zayif"
}

function buildStrongMatches(matchedKeywords: string[]): string[] {
  if (matchedKeywords.length === 0) {
    return [
      "CV içinde ilanla doğrudan eşleşen güçlü anahtar kelime bulunamadı.",
    ]
  }

  return matchedKeywords
    .slice(0, MAX_REPORT_ITEMS)
    .map((keyword) => `${keyword} CV içinde görünür durumda.`)
}

function buildWarnings(missingKeywords: string[], cv: TailoredCv): string[] {
  const warnings = missingKeywords
    .slice(0, MAX_REPORT_ITEMS)
    .map((keyword) => `${keyword} CV içinde belirgin görünmüyor.`)

  if (cv.experiences.every((experience) => experience.bullets.length === 0)) {
    warnings.push(
      "Deneyim maddeleri ATS taraması için yeterince detaylı değil."
    )
  }

  if (cv.summary.length < 120) {
    warnings.push(
      "Profesyonel özet bölümü ilana özel anahtar kelimelerle güçlendirilebilir."
    )
  }

  return warnings.slice(0, MAX_REPORT_ITEMS)
}

function buildRecommendations(
  missingKeywords: string[],
  jobDescription: JobDescription,
  cv: TailoredCv
): string[] {
  const recommendations: string[] = []

  if (missingKeywords.length > 0) {
    recommendations.push(
      `İlanda öne çıkan ${missingKeywords.slice(0, 3).join(", ")} ifadelerini gerçek deneyiminiz varsa CV'ye ekleyin.`
    )
  }

  if (jobDescription.summary !== null && cv.summary.length > 0) {
    recommendations.push(
      "Profesyonel özeti ilan özetindeki rol beklentileriyle daha açık eşleştirin."
    )
  }

  if (cv.experiences.length > 0) {
    recommendations.push(
      "Deneyim maddelerinde ölçülebilir sonuç, teknoloji ve etki bilgisini aynı cümlede verin."
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "CV bölümlerini ilan başlığı, gereksinimler ve yetkinliklerle aynı terminolojiye yaklaştırın."
    )
  }

  return recommendations.slice(0, MAX_REPORT_ITEMS)
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const uniqueValues: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    const normalized = normalizeKeyword(trimmed)
    if (trimmed.length === 0 || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    uniqueValues.push(trimmed)
  }

  return uniqueValues
}

function normalizeKeyword(value: string): string {
  return value.toLocaleLowerCase("tr-TR").replace(/\s+/gu, " ").trim()
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value))
}

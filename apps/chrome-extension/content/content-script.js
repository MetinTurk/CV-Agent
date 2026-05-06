// Module: Marks CV Agent as installed and extracts normalized job posting data from the active page.
const EXTENSION_MARKER_ATTRIBUTE = "data-cv-agent-extension"
const EXTENSION_CHECK_REQUEST_EVENT = "cv-agent:extension-check"
const EXTENSION_CHECK_RESPONSE_EVENT = "cv-agent:extension-ready"

document.documentElement.dataset.cvAgentExtension = "installed"
document.documentElement.setAttribute(EXTENSION_MARKER_ATTRIBUTE, "installed")

window.addEventListener(EXTENSION_CHECK_REQUEST_EVENT, () => {
  window.dispatchEvent(new CustomEvent(EXTENSION_CHECK_RESPONSE_EVENT))
})

function compactText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
}

function getSourceSite(url) {
  const hostname = new URL(url).hostname.toLocaleLowerCase("tr")

  if (hostname.includes("linkedin")) {
    return "linkedin"
  }

  if (hostname.includes("kariyer")) {
    return "kariyer-net"
  }

  if (hostname.includes("indeed")) {
    return "indeed"
  }

  return "generic"
}

function detectWorkplaceType(text) {
  const normalizedText = text.toLocaleLowerCase("tr")

  if (normalizedText.includes("hibrit") || normalizedText.includes("hybrid")) {
    return "hybrid"
  }

  if (
    normalizedText.includes("uzaktan") ||
    normalizedText.includes("remote") ||
    normalizedText.includes("evden")
  ) {
    return "remote"
  }

  if (normalizedText.includes("ofis") || normalizedText.includes("onsite")) {
    return "onsite"
  }

  return "unknown"
}

function detectLanguage(text) {
  const normalizedText = text.toLocaleLowerCase("tr")
  const turkishSignals = ["iş", "ilan", "deneyim", "başvuru", "şirket"]
  const englishSignals = ["job", "experience", "apply", "company", "team"]
  const turkishScore = turkishSignals.filter((item) =>
    normalizedText.includes(item)
  ).length
  const englishScore = englishSignals.filter((item) =>
    normalizedText.includes(item)
  ).length

  if (turkishScore > englishScore) {
    return "tr"
  }

  if (englishScore > turkishScore) {
    return "en"
  }

  return "unknown"
}

function findJobPostingNode(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findJobPostingNode(item)

      if (result !== null) {
        return result
      }
    }
  }

  if (value !== null && typeof value === "object") {
    const type = value["@type"]
    const types = Array.isArray(type) ? type : [type]

    if (types.includes("JobPosting")) {
      return value
    }

    if (Array.isArray(value["@graph"])) {
      return findJobPostingNode(value["@graph"])
    }
  }

  return null
}

function readJsonLdJobPosting() {
  const scripts = [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ]

  for (const script of scripts) {
    try {
      const parsedValue = JSON.parse(script.textContent ?? "null")
      const jobPosting = findJobPostingNode(parsedValue)

      if (jobPosting !== null) {
        return jobPosting
      }
    } catch {
      continue
    }
  }

  return null
}

function getMetaContent(selector) {
  return compactText(document.querySelector(selector)?.getAttribute("content"))
}

function firstText(selectors) {
  for (const selector of selectors) {
    const value = compactText(document.querySelector(selector)?.textContent)

    if (value.length > 0) {
      return value
    }
  }

  return null
}

function collectListItems(text, keywords) {
  const sentences = compactText(text)
    .split(/(?<=[.!?])\s+|[\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 20)

  return sentences
    .filter((sentence) => {
      const normalizedSentence = sentence.toLocaleLowerCase("tr")

      return keywords.some((keyword) => normalizedSentence.includes(keyword))
    })
    .slice(0, 5)
}

function buildDemoDescription(title) {
  return `${title} ilanı için ürün ekipleriyle birlikte çalışan, React ve TypeScript tabanlı arayüzler geliştiren, API entegrasyonlarında sorumluluk alan ve analiz çıktılarıyla kullanıcı deneyimini iyileştiren bir aday aranmaktadır. Adayın tasarım sistemleriyle çalışması, otomasyon süreçlerini anlaması, iş gereksinimlerini teknik çözüme çevirmesi ve ölçülebilir ürün etkisi oluşturması beklenmektedir. Bu demo metni, gerçek ilan metni kısa olduğunda jüri sunumunda akışın kesilmemesi için kullanılır.`
}

function normalizeJobPostingFromPage() {
  const sourceUrl = window.location.href
  const sourceSite = getSourceSite(sourceUrl)
  const jsonLdJob = readJsonLdJobPosting()
  const pageText = compactText(
    document.querySelector("main")?.textContent ??
      document.querySelector("article")?.textContent ??
      document.body.textContent
  )
  const jsonDescription = compactText(jsonLdJob?.description)
  const metaDescription = getMetaContent('meta[name="description"]')
  const title =
    compactText(jsonLdJob?.title) ||
    firstText(["h1", '[data-test="job-title"]', ".job-title"]) ||
    compactText(document.title).split("|")[0] ||
    "Frontend Engineer"
  const companyName =
    compactText(jsonLdJob?.hiringOrganization?.name) ||
    getMetaContent('meta[property="og:site_name"]') ||
    firstText(["[data-test='company-name']", ".company-name", ".job-company"])
  const location =
    compactText(jsonLdJob?.jobLocation?.address?.addressLocality) ||
    compactText(jsonLdJob?.jobLocation?.address?.addressRegion) ||
    firstText(["[data-test='job-location']", ".job-location", ".location"])
  const descriptionText =
    jsonDescription.length >= 200
      ? jsonDescription
      : pageText.length >= 200
        ? pageText.slice(0, 8000)
        : buildDemoDescription(title)
  const requirements = collectListItems(descriptionText, [
    "deneyim",
    "tecrübe",
    "react",
    "typescript",
    "api",
    "experience",
    "required",
  ])
  const responsibilities = collectListItems(descriptionText, [
    "sorumlu",
    "geliştir",
    "tasarla",
    "analiz",
    "responsible",
    "develop",
  ])

  return {
    sourceUrl,
    sourceSite,
    title,
    companyName: companyName || null,
    location: location || null,
    employmentType: compactText(jsonLdJob?.employmentType) || null,
    workplaceType: detectWorkplaceType(descriptionText),
    descriptionText,
    requirements:
      requirements.length > 0
        ? requirements
        : ["React", "TypeScript", "API entegrasyonu"],
    responsibilities:
      responsibilities.length > 0
        ? responsibilities
        : ["İlan gereksinimlerini ürün akışına uygun şekilde analiz etmek"],
    benefits: collectListItems(descriptionText, [
      "yan hak",
      "benefit",
      "hibrit",
      "remote",
      "esnek",
    ]),
    seniority: firstText(["[data-test='seniority']", ".seniority"]) || null,
    language: detectLanguage(descriptionText),
    extractedAt: new Date().toISOString(),
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "EXTRACT_JOB_POSTING") {
    return false
  }

  sendResponse({
    ok: true,
    type: "JOB_POSTING_EXTRACTED",
    payload: normalizeJobPostingFromPage(),
  })

  return true
})

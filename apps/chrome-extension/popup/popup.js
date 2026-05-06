// Module: Drives the Career Co-pilot popup state and demo API integration.
const API_BASE_URL = "http://localhost:3000"
const WEB_APP_BASE_URL = "http://localhost:5173"
const EXTENSION_VERSION = "1.0.4"

const elements = {
  analyzeButton: document.querySelector("#analyze-button"),
  openAnalysisButton: document.querySelector("#open-analysis-button"),
  resetButton: document.querySelector("#reset-button"),
  statusCopy: document.querySelector("#status-copy"),
  jobPreview: document.querySelector("#job-preview"),
  jobTitle: document.querySelector("#job-title"),
  confidencePill: document.querySelector("#confidence-pill"),
  progressRow: document.querySelector("#progress-row"),
  progressText: document.querySelector("#progress-text"),
  resultPanel: document.querySelector("#result-panel"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  scoreValue: document.querySelector("#score-value"),
  actionRow: document.querySelector("#action-row"),
}

let latestRedirectUrl = null

function hasChromeTabsApi() {
  return typeof chrome !== "undefined" && chrome.tabs !== undefined
}

function setBusyState(label) {
  elements.analyzeButton.disabled = true
  elements.progressRow.hidden = false
  elements.progressText.textContent = label
  elements.resultPanel.hidden = true
  elements.actionRow.hidden = true
}

function resetPopup() {
  latestRedirectUrl = null
  elements.analyzeButton.disabled = false
  elements.analyzeButton.hidden = false
  elements.progressRow.hidden = true
  elements.resultPanel.hidden = true
  elements.actionRow.hidden = true
  elements.jobPreview.hidden = true
  elements.statusCopy.textContent =
    "Şu an görüntülediğiniz sayfadaki iş ilanı detaylarını, gereksinimleri ve nitelikleri yapay zeka ile otomatik çıkarın."
}

function getActiveTab() {
  if (!hasChromeTabsApi()) {
    return Promise.resolve({
      id: null,
      title: "Frontend Engineer - CloudScale Inc.",
      url: "https://www.kariyer.net/is-ilani/frontend-engineer",
    })
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] ?? null)
    })
  })
}

function extractJobPostingFromTab(tab) {
  if (!hasChromeTabsApi() || tab?.id === null || tab?.id === undefined) {
    return Promise.resolve(createDemoJobPosting(tab?.url, tab?.title))
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tab.id,
      { type: "EXTRACT_JOB_POSTING" },
      (response) => {
        if (chrome.runtime.lastError || response?.ok !== true) {
          resolve(createDemoJobPosting(tab.url, tab.title))
          return
        }

        resolve(response.payload)
      }
    )
  })
}

function createDemoJobPosting(url, title) {
  const resolvedTitle = title?.split("|")[0]?.trim() || "Frontend Engineer"

  return {
    sourceUrl: url || "https://www.kariyer.net/is-ilani/frontend-engineer",
    sourceSite: "kariyer-net",
    title: resolvedTitle,
    companyName: "CloudScale Inc.",
    location: "İstanbul",
    employmentType: "Tam zamanlı",
    workplaceType: "hybrid",
    descriptionText:
      "CloudScale Inc. ürün ekipleriyle birlikte çalışan, React ve TypeScript tabanlı kullanıcı arayüzleri geliştiren, API entegrasyonlarında sorumluluk alan ve analiz çıktılarıyla kullanıcı deneyimini iyileştiren bir Frontend Engineer arıyor. Adayın tasarım sistemleriyle çalışması, otomasyon süreçlerini anlaması, iş gereksinimlerini teknik çözüme çevirmesi ve ölçülebilir ürün etkisi oluşturması beklenmektedir.",
    requirements: ["React", "TypeScript", "API entegrasyonu"],
    responsibilities: [
      "İş ilanı analiz ekranlarını kullanıcı odaklı geliştirmek",
      "Backend API sözleşmeleriyle uyumlu arayüzler tasarlamak",
    ],
    benefits: ["Hibrit çalışma", "Teknik gelişim bütçesi"],
    seniority: "Mid-Senior",
    language: "tr",
    extractedAt: new Date().toISOString(),
  }
}

async function createRemoteAnalysis(jobPosting, tabId) {
  const response = await fetch(`${API_BASE_URL}/api/job-analyses`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jobPosting,
      source: {
        kind: "chrome-extension",
        extensionVersion: EXTENSION_VERSION,
        ...(typeof tabId === "number" ? { tabId } : {}),
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`API ${response.status}`)
  }

  return response.json()
}

function createLocalAnalysis(jobPosting) {
  return {
    analysisId: "demo-local",
    status: "completed",
    redirectUrl: "/job-analysis?analysisId=demo-local",
    summary:
      "API bağlantısı kurulamadı; jüri demosu için yerel analiz önizlemesi gösteriliyor.",
    detail: {
      title: jobPosting.title,
      companyName: jobPosting.companyName,
      compatibilityScore: 86,
    },
  }
}

function renderJobPreview(jobPosting) {
  elements.jobTitle.textContent = `${jobPosting.title ?? "İş ilanı"} · ${
    jobPosting.companyName ?? "Şirket"
  }`
  elements.confidencePill.textContent =
    jobPosting.sourceSite === "generic" ? "Demo" : "Hazır"
  elements.jobPreview.hidden = false
}

function resolveRedirectUrl(redirectUrl) {
  return new URL(redirectUrl, WEB_APP_BASE_URL).toString()
}

function renderSuccess(analysis) {
  latestRedirectUrl = resolveRedirectUrl(analysis.redirectUrl)
  elements.analyzeButton.hidden = true
  elements.progressRow.hidden = true
  elements.resultPanel.hidden = false
  elements.actionRow.hidden = false
  elements.scoreValue.textContent = String(
    analysis.detail?.compatibilityScore ?? 86
  )
  elements.resultTitle.textContent = "Analiz tamamlandı"
  elements.resultSummary.textContent = analysis.summary
  elements.statusCopy.textContent =
    "Analiz sonucu hazır. Web uygulamasındaki CV özelleştirme akışına geçebilirsiniz."
}

async function handleAnalyzeClick() {
  try {
    setBusyState("Sayfadan ilan bilgisi alınıyor...")
    const activeTab = await getActiveTab()
    const jobPosting = await extractJobPostingFromTab(activeTab)
    renderJobPreview(jobPosting)

    setBusyState("Demo analiz API'sine gönderiliyor...")

    let analysis

    try {
      analysis = await createRemoteAnalysis(jobPosting, activeTab?.id)
    } catch {
      analysis = createLocalAnalysis(jobPosting)
    }

    renderSuccess(analysis)
  } catch {
    elements.progressRow.hidden = true
    elements.analyzeButton.disabled = false
    elements.statusCopy.textContent =
      "İlan bilgisi alınamadı. Sayfayı yenileyip tekrar deneyin."
  }
}

function handleOpenAnalysisClick() {
  if (latestRedirectUrl === null) {
    return
  }

  if (hasChromeTabsApi()) {
    chrome.tabs.create({ url: latestRedirectUrl })
    return
  }

  window.open(latestRedirectUrl, "_blank", "noopener,noreferrer")
}

elements.analyzeButton.addEventListener("click", handleAnalyzeClick)
elements.openAnalysisButton.addEventListener("click", handleOpenAnalysisClick)
elements.resetButton.addEventListener("click", resetPopup)

resetPopup()

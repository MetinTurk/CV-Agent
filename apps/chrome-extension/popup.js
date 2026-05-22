// Popup orchestrator. Coordinates the 6-step flow:
// (1) load access token from chrome.storage,
// (2) collect job posting from the active tab via scripted DOM extractor,
// (3) enable "analyze" button when both job + token are present,
// (4) POST { jobPosting, source } to the server,
// (5) on success, open the analysis result page on the web app and close popup.
import { extractJobPosting } from "./content/job-extractor.js";
import {
  API_BASE_URL,
  WEB_APP_URL,
  TOKEN_STORAGE_KEY,
  EXTENSION_VERSION,
} from "./config.js";

const collectButton = document.querySelector("[data-collect-button]");
const collectLabel = document.querySelector("[data-collect-label]");
const analyzeButton = document.querySelector("[data-analyze-button]");
const analyzeLabel = document.querySelector("[data-analyze-label]");
const statusMessage = document.querySelector("[data-status-message]");
const signinHint = document.querySelector("[data-signin-hint]");
const signinLink = document.querySelector("[data-signin-link]");

const state = {
  jobPosting: null,
  tabId: null,
  token: null,
  busy: false,
};

function setStatus(text, tone = "neutral") {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.dataset.tone = tone;
}

function showSigninHint(show) {
  if (signinHint instanceof HTMLElement) {
    signinHint.hidden = !show;
  }
}

function refreshButtons() {
  if (collectButton instanceof HTMLButtonElement) {
    collectButton.disabled = state.busy;
  }
  if (analyzeButton instanceof HTMLButtonElement) {
    analyzeButton.disabled =
      state.busy || state.jobPosting === null || state.token === null;
  }
}

function setBusy(busy) {
  state.busy = busy;
  refreshButtons();
}

async function loadToken() {
  try {
    const stored = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
    state.token = stored?.[TOKEN_STORAGE_KEY] || null;
  } catch {
    state.token = null;
  }
  showSigninHint(state.token === null);
  refreshButtons();
}

async function attemptTokenRefreshFromOpenWebAppTabs() {
  if (state.token !== null) return;
  try {
    const tabs = await chrome.tabs.query({ url: `${WEB_APP_URL}/*` });
    await Promise.all(
      tabs.map(async (tab) => {
        if (tab.id == null) return;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content/web-bridge.js"],
          });
        } catch {
          // ignore — tab may be discarded or restricted
        }
      })
    );
  } catch {
    // ignore
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab ?? null;
}

function isRestrictedUrl(url) {
  if (!url) return true;
  return /^(chrome|edge|about|chrome-extension|brave|view-source|data):/i.test(url);
}

async function handleCollect() {
  if (state.busy) return;
  setBusy(true);
  setStatus("İş ilanı bilgileri toplanıyor...");

  try {
    const tab = await getActiveTab();
    if (!tab || tab.id == null) {
      throw new Error("Aktif sekme bulunamadı.");
    }
    if (isRestrictedUrl(tab.url)) {
      throw new Error("Lütfen önce bir iş ilanı sayfasına gidin.");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobPosting,
    });

    const result = results?.[0]?.result ?? null;
    if (!result) {
      throw new Error("Sayfadan iş ilanı bilgisi çıkarılamadı.");
    }
    if (
      typeof result.descriptionText !== "string" ||
      result.descriptionText.length < 200
    ) {
      throw new Error(
        "Bu sayfada yeterli iş ilanı içeriği bulunamadı (en az 200 karakter gerekli)."
      );
    }

    state.jobPosting = result;
    state.tabId = tab.id;

    if (collectButton instanceof HTMLElement) {
      collectButton.classList.add("is-complete");
      collectButton.setAttribute("aria-pressed", "true");
    }
    if (collectLabel) {
      collectLabel.textContent = "Bilgiler Toplandı";
    }

    const titlePart = result.title ? ` "${result.title}"` : "";
    setStatus(
      `İlan${titlePart} hazır. Şimdi analizi başlatabilirsiniz.`,
      "success"
    );

    if (
      analyzeButton instanceof HTMLButtonElement &&
      state.token !== null
    ) {
      analyzeButton.focus();
    }
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Bilgiler toplanamadı.",
      "error"
    );
  } finally {
    setBusy(false);
  }
}

async function handleAnalyze() {
  if (state.busy) return;
  if (state.jobPosting === null) {
    setStatus("Önce iş ilanı bilgilerini toplayın.", "error");
    return;
  }
  if (state.token === null) {
    setStatus("Devam etmek için web uygulamasında oturum açın.", "error");
    showSigninHint(true);
    return;
  }

  setBusy(true);
  if (analyzeLabel) analyzeLabel.textContent = "Analiz Ediliyor...";
  setStatus("Analiz ediliyor, bu birkaç saniye sürebilir...");

  try {
    const response = await fetch(`${API_BASE_URL}/job-analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        jobPosting: state.jobPosting,
        source: {
          kind: "chrome-extension",
          extensionVersion: EXTENSION_VERSION,
          ...(state.tabId != null ? { tabId: state.tabId } : {}),
        },
      }),
    });

    if (response.status === 401) {
      state.token = null;
      try {
        await chrome.storage.local.remove(TOKEN_STORAGE_KEY);
      } catch {
        // ignore
      }
      showSigninHint(true);
      throw new Error(
        "Oturumunuz dolmuş. Lütfen web uygulamasında tekrar oturum açın."
      );
    }

    if (!response.ok) {
      let message = "Analiz başarısız oldu.";
      try {
        const payload = await response.json();
        if (payload?.detail && typeof payload.detail === "string") {
          message = payload.detail;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const analysis = await response.json();
    setStatus("Analiz hazır. Sonuç sayfası açılıyor...", "success");

    const target = `${WEB_APP_URL}/job-analysis/${encodeURIComponent(analysis.id)}`;
    await chrome.tabs.create({ url: target });
    window.close();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Analiz sırasında bir hata oluştu.",
      "error"
    );
  } finally {
    if (analyzeLabel) analyzeLabel.textContent = "İş İlanını Analiz Et";
    setBusy(false);
  }
}

collectButton?.addEventListener("click", handleCollect);
analyzeButton?.addEventListener("click", handleAnalyze);

signinLink?.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: `${WEB_APP_URL}/auth` });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!(TOKEN_STORAGE_KEY in changes)) return;
  state.token = changes[TOKEN_STORAGE_KEY].newValue ?? null;
  showSigninHint(state.token === null);
  refreshButtons();
});

await loadToken();
if (state.token === null) {
  await attemptTokenRefreshFromOpenWebAppTabs();
  await loadToken();
}

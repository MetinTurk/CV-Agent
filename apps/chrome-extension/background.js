// MV3 service worker. Persists the access token from the web bridge into
// chrome.storage.local and re-injects the bridge into already-open web app
// tabs after install / browser startup.
const TOKEN_STORAGE_KEY = "accessToken";
const WEB_APP_ORIGIN_PATTERN = "http://localhost:5173/*";
const BRIDGE_FILE = "content/web-bridge.js";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "cv-agent:set-token") {
    return false;
  }

  const incomingToken =
    typeof message.token === "string" && message.token.length > 0
      ? message.token
      : null;

  const operation =
    incomingToken === null
      ? chrome.storage.local.remove(TOKEN_STORAGE_KEY)
      : chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: incomingToken });

  operation
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});

async function injectBridgeIntoOpenWebAppTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: WEB_APP_ORIGIN_PATTERN });
    await Promise.all(
      tabs.map(async (tab) => {
        if (tab.id == null) return;
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [BRIDGE_FILE],
          });
        } catch {
          // Tab may be discarded or restricted; ignore.
        }
      })
    );
  } catch {
    // ignore — host permission may not be granted yet
  }
}

chrome.runtime.onInstalled.addListener(() => {
  injectBridgeIntoOpenWebAppTabs();
});

chrome.runtime.onStartup.addListener(() => {
  injectBridgeIntoOpenWebAppTabs();
});

// Runs on the CV Agent web app origin. Marks the page as extension-ready,
// answers the web app's installation probe, and mirrors the access token from
// localStorage / sessionStorage into the extension's storage via the service
// worker.
(function () {
  const TOKEN_KEY = "cv-agent.access-token";
  const CHECK_REQUEST_EVENT = "cv-agent:extension-check";
  const CHECK_RESPONSE_EVENT = "cv-agent:extension-ready";
  const TOKEN_CHANGED_EVENT = "cv-agent:token-changed";

  if (window.__CV_AGENT_BRIDGE_READY__ === true) {
    return;
  }
  window.__CV_AGENT_BRIDGE_READY__ = true;

  document.documentElement.setAttribute("data-cv-agent-extension", "installed");

  window.addEventListener(CHECK_REQUEST_EVENT, () => {
    window.dispatchEvent(new CustomEvent(CHECK_RESPONSE_EVENT));
  });
  window.dispatchEvent(new CustomEvent(CHECK_RESPONSE_EVENT));

  function readToken() {
    try {
      return (
        window.localStorage.getItem(TOKEN_KEY) ||
        window.sessionStorage.getItem(TOKEN_KEY) ||
        null
      );
    } catch {
      return null;
    }
  }

  let lastSentToken = undefined;

  function syncToken() {
    const token = readToken();
    if (token === lastSentToken) {
      return;
    }
    lastSentToken = token;
    try {
      chrome.runtime.sendMessage({
        type: "cv-agent:set-token",
        token,
      });
    } catch {
      // Service worker may be inactive; next sync attempt will reach it.
    }
  }

  syncToken();

  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === TOKEN_KEY) {
      syncToken();
    }
  });

  // Same-tab writes do not fire the storage event, so the web app dispatches
  // this custom event after sign-in / sign-out to keep the bridge in sync.
  window.addEventListener(TOKEN_CHANGED_EVENT, syncToken);

  // Failsafe: re-check on tab focus in case state changed elsewhere.
  window.addEventListener("focus", syncToken);
})();

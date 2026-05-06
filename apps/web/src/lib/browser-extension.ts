// Module: Detects whether the browser extension is available on the current page.
declare global {
  interface Window {
    __CV_AGENT_EXTENSION_INSTALLED__?: boolean
  }
}

const EXTENSION_MARKER_ATTRIBUTE = "data-cv-agent-extension"
const EXTENSION_CHECK_REQUEST_EVENT = "cv-agent:extension-check"
const EXTENSION_CHECK_RESPONSE_EVENT = "cv-agent:extension-ready"
const EXTENSION_CHECK_TIMEOUT_MS = 300

function hasExtensionMarker(): boolean {
  return (
    window.__CV_AGENT_EXTENSION_INSTALLED__ === true ||
    document.documentElement.dataset.cvAgentExtension === "installed" ||
    document.documentElement.hasAttribute(EXTENSION_MARKER_ATTRIBUTE)
  )
}

export function checkBrowserExtensionInstalled(): Promise<boolean> {
  if (hasExtensionMarker()) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    let isSettled = false

    const finish = (isInstalled: boolean): void => {
      if (isSettled) {
        return
      }

      isSettled = true
      window.removeEventListener(EXTENSION_CHECK_RESPONSE_EVENT, handleReady)
      resolve(isInstalled)
    }

    const handleReady = (): void => {
      finish(true)
    }

    window.addEventListener(EXTENSION_CHECK_RESPONSE_EVENT, handleReady, {
      once: true,
    })
    window.dispatchEvent(new CustomEvent(EXTENSION_CHECK_REQUEST_EVENT))
    window.setTimeout(
      () => finish(hasExtensionMarker()),
      EXTENSION_CHECK_TIMEOUT_MS
    )
  })
}

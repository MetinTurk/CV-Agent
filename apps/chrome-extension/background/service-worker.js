// Module: Keeps the MV3 background boundary ready for extension lifecycle messages.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    cvAgentExtensionVersion: chrome.runtime.getManifest().version,
  })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "PING_CV_AGENT_EXTENSION") {
    return false
  }

  sendResponse({
    ok: true,
    type: "PONG_CV_AGENT_EXTENSION",
    payload: {
      version: chrome.runtime.getManifest().version,
    },
  })

  return true
})

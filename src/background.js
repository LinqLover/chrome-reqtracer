let requests = {}
let navigationStartTimes = {}
let settings = {
  resetOnReload: false
}


let currentTabId = null
chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId
  updateBadge()
})


updateBadge = () => {
  chrome.action.setBadgeText({
    text: requests[currentTabId]?.length.toString() ?? ""
  })
}

requestsChanged = () => {
  updateBadge()
  chrome.runtime.sendMessage({ type: 'updateRequests', requests: requests[currentTabId] ?? [] })
}


chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    navigationStartTimes[details.tabId] = details.timeStamp
  }
})

chrome.webNavigation.onCommitted.addListener((details) => {
  if (!settings.resetOnReload) return
  if (details.frameId === 0 && details.transitionType === "reload") {
    if (requests[currentTabId]) {
      requests[currentTabId] = requests[currentTabId].filter((request) => request.timeStamp > navigationStartTimes[currentTabId])
    }
    requestsChanged()
  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  delete requests[tabId]
  requestsChanged()
})


chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    (requests[currentTabId] ??= []).push(details)
    requestsChanged()
  },
  { urls: ['<all_urls>'] }
)


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getRequests') {
    sendResponse({ requests: requests[currentTabId] ?? [] })
  }
})


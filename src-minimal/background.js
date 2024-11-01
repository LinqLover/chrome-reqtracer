const requestCounts = {}
let currentTabId

const updateBadge = () => {
  chrome.action.setBadgeText({
    text: (requestCounts[currentTabId] ?? 0).toString()
  }).catch((err)  => console.log(err))
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    requestCounts[details.tabId] = (requestCounts[details.tabId] ?? 0) + 1
    updateBadge()
  },
{ urls: ['<all_urls>'] }
)

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentTabId = activeInfo.tabId
  updateBadge()
})

chrome.tabs.onRemoved.addListener((tabId) => {
  delete requestCounts[tabId]
})

'use strict'

class Extension {
  requests = {}
  navigationStartTimes = {}
  settings = {
    resetOnReload: false
  }

  _currentTabId = null

  updateBadge() {
    chrome.action.setBadgeText({
      text: this.requests[this._currentTabId]?.length.toString() ?? ""
    })
  }

  requestsChanged(tabId) {
    this.updateBadge()
    chrome.runtime.sendMessage({
      type: 'updateRequests',
      tabId: tabId,
      requests: this.requests[tabId] ?? []
    })
  }
  
  tabChanged() {
    this.updateBadge()
  }
  
  shouldHideRequest(details) {
    // Stub for future filtering of requests
    return false
  }
  
  startListeners() {
    this.startWebRequestsListener()
    this.startWebNavigationListeners()
    this.startTabListeners()
    this.startMessageListener()
  }

  startWebRequestsListener() {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (this.shouldHideRequest(details)) return
    
        details.uniqueId = crypto.randomUUID() // requestId is not unique in case of redirects
        details.relativeTime = details.timeStamp - this.navigationStartTimes[details.tabId]
        ;(this.requests[details.tabId] ??= []).push(details)
        this.requestsChanged(details.tabId)
      },
      { urls: ['<all_urls>'] }
    )
  }    

  startWebNavigationListeners() {
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0) {
        this.navigationStartTimes[details.tabId] = details.timeStamp
      }
    })
    
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (!this.settings.resetOnReload) return
    
      if (details.frameId === 0 && details.transitionType === "reload") {
        if (this.requests[details.tabId]) {
          this.requests[details.tabId] = this.requests[details.tabId].filter((request) =>
            request.timeStamp > this.navigationStartTimes[details.tabId])
        }
        this.requestsChanged(details.tabId)
      }
    })
  }   
  
  startTabListeners() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this._currentTabId = activeInfo.tabId
      this.tabChanged()
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
      delete this.requests[tabId]
      delete this.navigationStartTimes[tabId]
      this.requestsChanged(tabId)
    })    
  }

  startMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'clearRequests':
          this.requests[message.tabId] = []
          this.requestsChanged(message.tabId)
          break
        case 'getRequests':
          sendResponse({
            requests: this.requests[message.tabId] ?? [],
          })
          break
        default:
          console.error('Unknown message', message)
      }
    })
  }
}

try {
  const extension = new Extension()
  extension.startListeners()
  // debug support
  globalThis.extension = extension
} catch (error) {
  // debug support: keep the extension alive
  console.error(error)
  chrome.runtime.onStartup.addListener(() => {
  })
}

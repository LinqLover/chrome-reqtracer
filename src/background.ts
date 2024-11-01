'use strict'

import { BackgroundServices, broadcastMessageToPopups, ClearRequestsMessage, GetRequestsMessage, Request, startMessageServer, TabId } from './support'

class Extension {
  requests: { [key: TabId]: Request[] } = {}
  navigationStartTimes: { [key: TabId]: number } = {}
  settings = {
    resetOnReload: false
  }

  private _currentTabId: TabId | undefined

  async updateBadge() {
    await chrome.action.setBadgeText({
      text: this.requests[this._currentTabId!]?.length.toString() ?? ""
    })
  }

  requestsChanged(tabId: number) {
    this.updateBadge().catch(err => console.error(err))
    broadcastMessageToPopups({
      type: 'updateRequests',
      tabId: tabId,
      requests: this.requests[tabId] ?? [],
    })
  }

  tabChanged() {
    this.updateBadge().catch(err => console.error(err))
  }

  shouldHideRequest(request: chrome.webRequest.WebRequestDetails) {
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

        const request = {
          ...details,
          uniqueId: crypto.randomUUID(), // requestId is not unique in case of redirects
          relativeTime: details.timeStamp - this.navigationStartTimes[details.tabId],
        }
        ;(this.requests[details.tabId] ??= []).push(request)
        this.requestsChanged(request.tabId)
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
    startMessageServer(<BackgroundServices>{
      clearRequests: (message: ClearRequestsMessage) => {
        this.requests[message.tabId] = []
        this.requestsChanged(message.tabId)
      },
      getRequests: (message: GetRequestsMessage) => {
        return {
          requests: this.requests[message.tabId] ?? [],
        }
      },
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

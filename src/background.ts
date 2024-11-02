import { BackgroundServices, broadcastMessageToPopups, ClearRequestsMessage, GetRequestsMessage, Request, startMessageServer, TabId } from './support'

class Extension {
  requests: { [key: TabId]: Request[] } = {}
  tabCreationTimes: { [key: TabId]: number } = {}
  // To be later exposed in the popup or an options page
  settings = {
    /** If enabled, reloading a page will reset the requests for the current tab. */
    resetOnReload: false
  }

  private _currentTabId: TabId | undefined

  async updateBadge() {
    await chrome.action.setBadgeText({
      text: (this.requests[this._currentTabId!]?.length ?? 0).toString()
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
    this.startWebNavigationListener()
    this.startTabListeners()
    this.startMessageListener()
  }

  startWebRequestsListener() {
    chrome.webRequest.onCompleted.addListener(
      (details) => {
        if (this.shouldHideRequest(details)) return

        const request = {
          ...details,
          uniqueId: crypto.randomUUID(), // requestId is not unique in case of redirects
          relativeTime: details.timeStamp - (this.tabCreationTimes[details.tabId] ??= details.timeStamp)
        }
        ;(this.requests[details.tabId] ??= []).push(request)
        this.requestsChanged(request.tabId)
      },
      { urls: ['<all_urls>'] }
    )
  }

  startWebNavigationListener() {
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (!this.settings.resetOnReload) return

      if (details.frameId === 0 && details.transitionType === 'reload') {
        if (this.requests[details.tabId]) {
          this.requests[details.tabId] = this.requests[details.tabId].filter((request) =>
            request.timeStamp > this.tabCreationTimes[details.tabId])
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

    chrome.tabs.onCreated.addListener((tab) => {
      if (!tab.id) return
      this.tabCreationTimes[tab.id] = new Date().getTime()
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
      delete this.requests[tabId]
      delete this.tabCreationTimes[tabId]
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

/**
 * Background worker of the extension. Traces web requests, updates the extension badge, and communicates with popups.
 */

import { defaultSettings } from './settings'
import { BackgroundServices, broadcastMessageToPopups, ClearRequestsMessage, GetRequestsMessage, Request, startMessageServer, TabId } from './support'

class Extension {
  /** Tracked requests per tab. For maximum flexibility, we store the full objects from the API. */
  requests: { [key: TabId]: Request[] } = {}
  /** Creation times per tab. Used to display readable relative times in the popup. */
  tabCreationTimes: { [key: TabId]: number } = {}
  /** Times of last navigation per tab. Used for optional resetting requsts after reload (see settings.resetOnReload). */
  navigationStartTimes: { [key: TabId]: number } = {}
  // To be later exposed in the popup or an options page
  settings = {...defaultSettings}

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

  /** Stub for future filtering of requests. */
  shouldHideRequest(details: chrome.webRequest.WebRequestDetails) {
    return false
  }

  startListeners() {
    this.startWebRequestsListener()
    this.startTabListeners()
    this.startWebNavigationListeners()
    this.startMessageListener()
  }

  /** Tracking network requests. */
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

  /** Tracking of tab switching, creation, and removal to update the badge and tab-related data. */
  startTabListeners() {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this._currentTabId = activeInfo.tabId
      if (!this.settings.traceBackgroundTabs) {
        // Clear requests for inactive tabs
        this.requests = {
          [activeInfo.tabId]: this.requests[activeInfo.tabId]
        }
      }
      this.tabChanged()
    })

    chrome.tabs.onCreated.addListener((tab) => {
      if (!tab.id) return
      this.tabCreationTimes[tab.id] = new Date().getTime()
    })

    chrome.tabs.onRemoved.addListener((tabId) => {
      delete this.requests[tabId]
      delete this.tabCreationTimes[tabId]
      delete this.navigationStartTimes[tabId]
      this.requestsChanged(tabId)
    })
  }

  /** Tracking navigation operations on tabs (only for optonal resetOnReload). */
  startWebNavigationListeners() {
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0) {
        this.navigationStartTimes[details.tabId] = details.timeStamp
      }
    })

    chrome.webNavigation.onCommitted.addListener((details) => {
      if (!this.settings.resetOnReload) return

      if (details.frameId === 0 && details.transitionType === 'reload') {
        if (this.requests[details.tabId]) {
          this.requests[details.tabId] = this.requests[details.tabId].filter((request) =>
            request.timeStamp > this.navigationStartTimes[details.tabId])
        }
        this.requestsChanged(details.tabId)
      }
    })
  }

  /** Handlings requests by popups to access tracked requests. */
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
  // an empty listener will prevent the extension from being unloaded
  chrome.runtime.onStartup.addListener(() => {
  })
}

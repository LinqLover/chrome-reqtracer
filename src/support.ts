/** Type definitions and utility functions for communication between the background script and popups. */

// @ts-ignore crypto.randomUUID is supported in modern Chrome versions
import { UUID } from 'crypto'

/** A traced web request. */
export type Request = chrome.webRequest.WebRequestDetails & {
  /** Note that the regular WebRequestDetails.id is not unique if the request was sent multiple times (e.g., for forwarding.) */
  uniqueId: UUID
  /** Time in milliseconds since the creation of the tab. */
  relativeTime: number
}

export type TabId = chrome.webRequest.WebRequestDetails['tabId']


/** Base interface for message services that can be used to communicate between the background worker and popups. */
interface MessageService {
  [key: string]: (message: any) => any;
}

/** Base declaration of methods for sending a message function to a service. */
type SendMessageFunction<TServices extends MessageService> =
  <TType extends keyof TServices, TReturn extends ReturnType<TServices[TType]>>(
    message: Parameters<TServices[TType]>[0],
    callback?: (response: TReturn extends void ? never : TReturn) => void
  ) => void


/** Message service of the background worker. */
export interface BackgroundServices extends MessageService {
  /** Clears all requests for the specified tab. */
  clearRequests: (message: ClearRequestsMessage) => void
  /** Retrieves all requests for the specified tab. */
  getRequests: (message: GetRequestsMessage) => {
    requests: Request[]
  }
}

export type ClearRequestsMessage = {
  type: 'clearRequests'
  tabId: TabId
}

export type GetRequestsMessage = {
  type: 'getRequests'
  tabId: TabId
}

export type GetRequestsResponse = {
  requests: Request[]
}


/** Message service of popups. */
export interface BroadcastServices extends MessageService {
  /** Triggers update of all requests for the specified tab. */
  updateRequests: (message: UpdateRequestsMessage) => void
}

export type UpdateRequestsMessage = {
  type: 'updateRequests'
  tabId: TabId
  requests: Request[]
}


/** Sends a message to the background worker. */
export const sendMessageToBackground: SendMessageFunction<BackgroundServices> = chrome.runtime.sendMessage
/** Sends a message to all open popups. */
export const broadcastMessageToPopups: SendMessageFunction<BroadcastServices> = chrome.runtime.sendMessage

/**
 * Starts a message server for communication between background worker and popups.
 * @param service The service with methods to expose.
 * @returns A cleanup function for stopping the message server.
 */
export const startMessageServer = (service: MessageService) => {
  const listener = (message: any, _sender: any, sendResponse: (response: any) => (void)) => {
    const method = service[message.type]
    if (method) {
      const response = method(message)
      if (response !== undefined) {
        sendResponse(response)
      }
    } else {
      console.error("Unknown message", message)
    }
  }
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}

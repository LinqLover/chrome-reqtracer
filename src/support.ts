import { UUID } from 'crypto'

export type Request = chrome.webRequest.WebRequestDetails & {
  uniqueId: UUID
  relativeTime: number
}

export type TabId = chrome.webRequest.WebRequestDetails['tabId']


interface MessageServices {
  [key: string]: (message: any) => any;
}

type SendMessageFunction<TServices extends MessageServices> =
  <TType extends keyof TServices, TReturn extends ReturnType<TServices[TType]>>(
    message: Parameters<TServices[TType]>[0],
    callback?: (response: TReturn extends void ? never : TReturn) => void
  ) => void


export interface BackgroundServices extends MessageServices {
  clearRequests: (message: ClearRequestsMessage) => void
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


export interface BroadcastServices extends MessageServices {
  updateRequests: (message: UpdateRequestsMessage) => void
}

export type UpdateRequestsMessage = {
  type: 'updateRequests'
  tabId: TabId
  requests: Request[]
}


export const sendMessageToBackground: SendMessageFunction<BackgroundServices> = chrome.runtime.sendMessage
export const broadcastMessageToPopups: SendMessageFunction<BroadcastServices> = chrome.runtime.sendMessage

export const startMessageServer = (services: MessageServices) => {
  const listener = (message: any, _sender: any, sendResponse: (response: any) => void) => {
    const service = services[message.type]
    if (service) {
      const response = service(message)
      if (response !== undefined) {
        sendResponse(response)
      }
    } else {
      console.error('Unknown message', message)
    }
  }
  chrome.runtime.onMessage.addListener(listener)
  return () => chrome.runtime.onMessage.removeListener(listener)
}

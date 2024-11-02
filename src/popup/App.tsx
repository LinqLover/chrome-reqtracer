import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { FaBroom } from 'react-icons/fa'
import { sendMessageToBackground, TabId } from '../support.ts'
import { RequestList } from './RequestList.tsx'

/** The main component of the popup. */
export function App() {
  const [tabId, setTabId] = useState<TabId>()
  // debug support
  ;(globalThis.extension ??= { }).tabId = tabId

  useEffect(() => {
    const url = new URL(window.location.href)

    // for testing (see ExtensionIcon.popUp())
    const tabId = url.searchParams.get('tabId')
    if (tabId) {
      setTabId(parseInt(tabId))
      return
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setTabId(tabs[0].id)
    })
  }, [])

  const clearRequests = () => {
    if (tabId === undefined) return
    sendMessageToBackground({ type: 'clearRequests', tabId })
  }

  return <div>
    <div className="p-3">
      <h1 className="h4">Chrome ReqTracer</h1>
      <Button
        id="clear-requests-button"
        onClick={clearRequests}
        style={{ position: 'absolute', right: '10px', top: '10px', padding: '0.25rem 0.5rem' }}
        title="Clear all requests"
      >
        <FaBroom />
      </Button>
    </div>
    <RequestList tabId={tabId} />
  </div>
}

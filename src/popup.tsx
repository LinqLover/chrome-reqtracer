import { GetRowIdParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { createRoot } from 'react-dom/client'
import { FaBroom } from 'react-icons/fa'
import { BroadcastServices, GetRequestsResponse, Request, sendMessageToBackground, startMessageServer, TabId } from './support.ts'
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
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

type RequestListProps = {
  tabId: TabId | undefined
}

const RequestList: FC<RequestListProps> = ({ tabId }): JSX.Element => {
  const [requests, setRequests] = useState<Request[]>([])
  // for debugging support
  ;(globalThis.extension ??= { }).requests = requests

  useEffect(() => {
    if (tabId === undefined) return
    const cleanUpMessageServer = startMessageServer({
      updateRequests: (message) => {
        if (message.tabId === tabId) {
          setRequests(message.requests)
        }
      },
    } as BroadcastServices)
    sendMessageToBackground<'getRequests', GetRequestsResponse>({ type: 'getRequests', tabId }, (response) => {
      setRequests(response.requests)
    })
    return cleanUpMessageServer
  }, [tabId])

  const getRowId = (data: GetRowIdParams<Request>) => data.data.uniqueId

  return <div className='p-3'>
    <div className="ag-theme-quartz" style={{ width: '700px', height: '500px' }} >
      <AgGridReact
        columnDefs={[
          {
            headerName: 'Time',
            field: 'relativeTime',
            valueFormatter: (params) => (params.value / 1000).toFixed(3) + 's',
            filter: 'agNumberColumnFilter',
          },
          {
            headerName: 'Method',
            field: 'method',
            /*filter: 'agSetColumnFilter',
            filterParams: { values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },*/
            // not available in free version
            filter: 'agTextColumnFilter',
            floatingFilter: true,
          },
          {
            headerName: 'URL',
            field: 'url',
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            flex: 1,
          },
        ]}
        rowData={requests}
        getRowId={getRowId}
        animateRows={false}
        domLayout='normal'
        autoSizeStrategy={{
          type: 'fitCellContents',
        }}
      />
    </div>
  </div>
}

const root = createRoot(document.getElementById('app')!)
root.render(<App />)

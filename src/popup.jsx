import { AgGridReact } from 'ag-grid-react'
import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Button } from 'react-bootstrap'
import { FaBroom } from 'react-icons/fa'
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  const [tabId, setTabId] = useState(null)
  // debug support
  ;(window.extension ??= { }).tabId = tabId

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
    chrome.runtime.sendMessage({
      type: 'clearRequests',
      tabId: tabId
    })
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

function RequestList({ tabId }) { 
  const [requests, setRequests] = useState([])
  // for debugging support
  ;(window.extension ??= { }).requests = requests

  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === 'updateRequests' && message.tabId === tabId) {
        setRequests(message.requests);
      }
    }
    chrome.runtime.onMessage.addListener(messageListener);
    chrome.runtime.sendMessage({ type: 'getRequests', tabId }, (response) => {
      setRequests(response.requests)
    })
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [tabId])

  const getRowId = (data) => data.data.uniqueId

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
        style={{ height: '100%' }}
      />
    </div>
  </div>
}

render(<App />, document.getElementById('app'))

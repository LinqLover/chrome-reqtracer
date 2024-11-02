import { GetRowIdParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useEffect, useState } from 'react'
import { BroadcastServices, GetRequestsResponse, Request, sendMessageToBackground, startMessageServer, TabId } from '../support.ts'
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

export type RequestListProps = {
  tabId: TabId | undefined
}

/** A list of requests in the popup. */
export const RequestList: FC<RequestListProps> = ({ tabId }): JSX.Element => {
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

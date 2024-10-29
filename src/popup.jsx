import { render } from 'preact'
import { useState, useEffect } from 'preact/hooks'

function App() {
  return (
    <div>
      <h1>Chrome ReqTracer!</h1>
      <RequestList />
    </div>
  )
}

function RequestList() { 
  const [requests, setRequests] = useState([])

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'updateRequests') {
        setRequests(message.requests)
      }
    })
    chrome.runtime.sendMessage({ type: 'getRequests' }, (response) => {
      setRequests(response.requests)
    })
  }, [])

  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Method</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {requests.map(request => <RequestRow key={request.requestId} request={request} />)}
      </tbody>
    </table>
  )
}

function RequestRow({ request }) {
  const timeStamp = new Date(request.timeStamp).toLocaleTimeString()

  return (
    <tr key={request.requestId}>
      <td>{timeStamp}</td>
      <td>{request.method}</td>
      <td>{request.url}</td>
    </tr>
  )
}

render(<App />, document.getElementById('app'))

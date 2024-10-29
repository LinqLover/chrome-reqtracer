import { h, render } from 'preact'
import { useState, useEffect } from 'preact/hooks';

function App() {
  return h('div', null, 
    h('h1', null, 'Chrome ReqTracer'),
    RequestList(),
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
  })

  return h('table', null,
    h('thead', null, 
      h('tr', null, 
        h('th', null, 'Time'),
        h('th', null, 'Method'),
        h('th', null, 'URL'),
      )
    ),
    h('tbody', null, 
      requests.map(request => RequestRow(request))
    )
  )
}

function RequestRow(request) {
  const timeStamp = new Date(request.timeStamp).toLocaleTimeString()

  return h('tr',
    { key: request.requestId },
    h('td', null, timeStamp),
    h('td', null, request.method),
    h('td', null, request.url),
  )
}

render(h(App), document.getElementById('app'))

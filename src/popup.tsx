import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import { App } from './popup/App.tsx'

const root = createRoot(document.getElementById('app')!)
root.render(<App />)

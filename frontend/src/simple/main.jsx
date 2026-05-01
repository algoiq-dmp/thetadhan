import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadSavedTheme } from './themes'
import { setupAutoBackup } from './utils/backup'

// Apply saved theme before first render
loadSavedTheme()

// Setup auto-backup on exit
setupAutoBackup()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

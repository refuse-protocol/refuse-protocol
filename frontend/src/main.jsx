import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'
import { logger } from './utils/logger.js'

// Only log in development
if (import.meta.env.DEV) {
  logger.info('main.jsx loaded successfully')
}

// Add error handling for React mounting
try {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    if (import.meta.env.DEV) {
      logger.info('Root element found, creating React root...')
    }
    const root = ReactDOM.createRoot(rootElement)
    if (import.meta.env.DEV) {
      logger.info('React root created, rendering App...')
    }
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    if (import.meta.env.DEV) {
      logger.info('React app rendered successfully')
    }
  } else {
    logger.error('Root element not found!')
    // Fallback: create the root element if it doesn't exist
    const body = document.body
    const rootDiv = document.createElement('div')
    rootDiv.id = 'root'
    body.insertBefore(rootDiv, body.firstChild)

    const root = ReactDOM.createRoot(rootDiv)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
} catch (error) {
  logger.error('Error mounting React app', { error: error.message }, error)
  // Ultimate fallback
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; border: 2px solid #fcc; color: #c33; margin: 20px;">
      <h1>Error Loading Application</h1>
      <p>There was an error starting the React application:</p>
      <pre style="background: #fff; padding: 10px; border: 1px solid #ccc; margin: 10px 0;">${error.message}</pre>
      <p>Please check the browser console for more details.</p>
    </div>
  `
}

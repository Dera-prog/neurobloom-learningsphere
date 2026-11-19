import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppStoreProvider } from './store/store'
import { ToastProvider } from './components/toast'
import { AuthProvider } from './lib/auth'
import { ErrorBoundary } from './components/error-boundary'
import { initMonitoring } from './lib/monitoring'
import './index.css'

initMonitoring()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppStoreProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AppStoreProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)

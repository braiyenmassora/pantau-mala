import { queryClient } from '@/data/query-client'
import { AccessGate } from '@/auth/access-gate'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { registerAppWorker } from '@/pwa/updates'
import { AppUpdateNotice } from '@/pwa/update-notice'

if (
  import.meta.env.PROD &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    void registerAppWorker()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AccessGate>
        <App />
        <AppUpdateNotice />
      </AccessGate>
    </QueryClientProvider>
  </StrictMode>,
)

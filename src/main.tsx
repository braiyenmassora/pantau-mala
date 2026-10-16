import { queryClient } from '@/data/query-client'
import { AccessGate } from '@/auth/access-gate'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

if (
  import.meta.env.PROD &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AccessGate>
        <App />
      </AccessGate>
    </QueryClientProvider>
  </StrictMode>,
)

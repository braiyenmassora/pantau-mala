import { queryClient } from '@/data/query-client'
import { AccessGate } from '@/auth/access-gate'
import { AppErrorBoundary } from '@/components/common/app-error-boundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/** Latin only — bobot Sans 400/500/600, Mono 500/600; font-display: swap di CSS fontsource. */
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <AccessGate>
          <App />
        </AccessGate>
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)

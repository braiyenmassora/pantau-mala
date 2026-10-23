import { queryClient } from '@/data/query-client'
import { AccessGate } from '@/auth/access-gate'
import { AppErrorBoundary } from '@/components/common/app-error-boundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/** Self-host WOFF2 + font-display: optional (lihat styles/fonts.css). */
import './styles/fonts.css'
import './index.css'
import { getLocale } from '@/copy'
import { startTelemetry } from '@/lib/telemetry'
import App from './App.tsx'

document.documentElement.lang = getLocale()
startTelemetry()

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

import { Component, type ErrorInfo, type ReactNode } from 'react'

import { copy } from '@/copy/id'
import { reportTelemetryError } from '@/lib/telemetry'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/** Boundary aplikasi — fallback sederhana, tanpa komponen UI yang mungkin ikut crash. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
    reportTelemetryError('runtime_error')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="bg-surface text-ink flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg leading-7 font-semibold">{copy.empty.appCrash.title}</h1>
        <p className="text-ink-2 max-w-sm text-sm leading-5">
          {copy.empty.appCrash.description}
        </p>
        <button
          type="button"
          className="bg-brand text-surface rounded-ctl min-h-11 px-4 text-sm font-medium"
          onClick={() => {
            window.location.reload()
          }}
        >
          {copy.empty.appCrash.action}
        </button>
      </div>
    )
  }
}

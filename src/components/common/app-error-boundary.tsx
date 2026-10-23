import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/** Last-resort recovery: a bad UI render must not leave a blank disaster map. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="bg-map-bg text-ink flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="bg-surface rounded-panel border-line w-full max-w-sm border p-5 shadow-sm">
          <h1 className="text-lg font-semibold">Tampilan belum dapat dimuat</h1>
          <p className="text-ink-2 mt-2 text-sm leading-5">
            Coba muat ulang. Data dan laporan yang tersimpan tidak berubah.
          </p>
          <button
            type="button"
            className="bg-brand text-surface rounded-ctl mt-4 min-h-11 px-4 text-sm font-semibold active:scale-[0.96]"
            onClick={() => window.location.reload()}
          >
            Muat ulang
          </button>
        </div>
      </main>
    )
  }
}

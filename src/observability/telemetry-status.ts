import { create } from 'zustand'

export type TelemetryStatus =
  | 'idle'
  | 'privacy'
  | 'unsupported'
  | 'queued'
  | 'sending'
  | 'accepted'
  | 'retrying'
  | 'unavailable'
  | 'rejected'

export const useTelemetryStatus = create<{ status: TelemetryStatus }>(() => ({
  status: 'idle',
}))

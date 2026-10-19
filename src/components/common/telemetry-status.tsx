import { copy } from '@/copy/id'
import { isPrivacyMode, useTelemetryStatus } from '@/lib/telemetry'

/** Status pengiriman diagnostik — gagal tidak memblokir peta. */
export function TelemetryStatus() {
  const status = useTelemetryStatus()
  const privacy = isPrivacyMode()
  const label = copy.telemetry.labels[status]

  return (
    <p
      className="text-ink-3 text-xs leading-4"
      data-testid="telemetry-status"
      title={privacy ? copy.telemetry.privacyNote : undefined}
    >
      {label}
    </p>
  )
}

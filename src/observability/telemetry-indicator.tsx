import { focusRing } from '@/components/common/focus-ring'
import { useSession } from '@/auth/session'
import { useTelemetryStatus, type TelemetryStatus } from './telemetry-status'

const labels: Record<TelemetryStatus, string> = {
  idle: 'Menunggu akses client',
  privacy: 'Tidak diukur · preferensi privasi',
  unsupported: 'Tidak diukur · browser belum mendukung',
  queued: 'Menunggu pengiriman',
  sending: 'Mengirim secara async',
  accepted: 'Batch diterima collector',
  retrying: 'Pengiriman tertunda · akan mencoba lagi',
  unavailable: 'Pengiriman belum tersedia',
  rejected: 'Pengiriman ditolak · periksa integrasi',
}

export function TelemetryIndicator() {
  const status = useTelemetryStatus((state) => state.status)
  const mode = useSession((state) => state.accessMode)
  if (mode !== 'client') return null
  return (
    <details className="text-ink-3 mt-1 text-xs leading-4">
      <summary className={`rounded-ctl w-fit cursor-pointer ${focusRing}`}>
        Pengukuran kunjungan: {labels[status]}
      </summary>
      <p className="mt-1">
        {status === 'privacy'
          ? 'DNT/GPC aktif: tidak mengirim event dan tidak membuat ID sesi. Ini bukan error browser.'
          : 'Pengukuran bersifat best-effort. Pemblokir atau gangguan jaringan dapat mengurangi cakupan. HTTP 202 berarti masuk antrean, bukan bukti data sudah tersimpan.'}{' '}
        Akses peta tidak bergantung pada telemetry.
      </p>
    </details>
  )
}

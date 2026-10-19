import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegionHotspotReports } from '@/data/hotspot-reports'
import { formatRelativeAge } from '@/lib/format'

const sightingLabel = {
  asap: 'Melihat asap',
  api_terlihat: 'Melihat api',
  tidak_yakin: 'Belum yakin',
  sudah_padam: 'Sudah padam',
} as const

export function CitizenReports({ regionCode }: { regionCode: string }) {
  const reports = useRegionHotspotReports(regionCode)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan warga</CardTitle>
        <p className="text-ink-2 text-xs leading-5">
          Pengamatan warga, bukan verifikasi resmi.
        </p>
      </CardHeader>
      <CardContent>
        {reports.isLoading ? <p className="text-ink-2 text-sm">Memuat laporan…</p> : null}
        {reports.isError ? (
          <p className="text-ink-2 text-sm">Laporan warga belum dapat dimuat.</p>
        ) : null}
        {reports.data?.length === 0 ? (
          <p className="text-ink-2 text-sm">Belum ada laporan warga untuk wilayah ini.</p>
        ) : null}
        {reports.data?.length ? (
          <ul className="divide-line divide-y">
            {reports.data.slice(0, 3).map((report) => (
              <li key={report.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <MessageSquare className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-ink truncate text-sm font-semibold">{report.author_name}</p>
                      <time className="text-ink-2 shrink-0 text-xs" dateTime={report.created_at}>
                        {formatRelativeAge(report.created_at)}
                      </time>
                    </div>
                    <p className="text-ink-2 text-xs">{sightingLabel[report.sighting]}</p>
                    {report.description ? <p className="text-ink mt-1 text-sm leading-5">{report.description}</p> : null}
                  </div>
                  <img src={report.photo_url} alt="" className="size-14 shrink-0 rounded-ctl object-cover" loading="lazy" />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

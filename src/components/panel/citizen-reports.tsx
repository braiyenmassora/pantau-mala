import { MessageSquare } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/common/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import {
  useCreateHotspotReport,
  useRegionHotspotReports,
  type HotspotSighting,
} from '@/data/hotspot-reports'
import { useHotspots } from '@/data/queries'
import { formatRelativeAge } from '@/lib/format'

const sightingLabel = {
  asap: 'Melihat asap',
  api_terlihat: 'Melihat api',
  tidak_yakin: 'Belum yakin',
  sudah_padam: 'Sudah padam',
} as const

export function CitizenReports({ regionCode }: { regionCode: string }) {
  const reports = useRegionHotspotReports(regionCode)
  const hotspots = useHotspots()
  const create = useCreateHotspotReport()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [sighting, setSighting] = useState<HotspotSighting>('asap')
  const target = hotspots.data?.features
    .filter((feature) => feature.properties.region_code === regionCode)
    .sort(
      (left, right) =>
        Date.parse(right.properties.time) - Date.parse(left.properties.time),
    )[0]
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!photo || !target) return
    const [lon, lat] = target.geometry.coordinates
    create.mutate(
      {
        lat,
        lon,
        region_code: regionCode,
        hotspot_time: target.properties.time,
        sighting,
        author_name: name,
        description: description || undefined,
        file: photo,
      },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setPhoto(null)
          setOpen(false)
        },
      },
    )
  }

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
                  <MessageSquare
                    className="text-brand mt-1 size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-ink truncate text-sm font-semibold">
                        {report.author_name}
                      </p>
                      <time
                        className="text-ink-2 shrink-0 text-xs"
                        dateTime={report.created_at}
                      >
                        {formatRelativeAge(report.created_at)}
                      </time>
                    </div>
                    <p className="text-ink-2 text-xs">{sightingLabel[report.sighting]}</p>
                    {report.description ? (
                      <p className="text-ink mt-1 text-sm leading-5">
                        {report.description}
                      </p>
                    ) : null}
                  </div>
                  <img
                    src={report.photo_url}
                    alt=""
                    className="rounded-ctl size-14 shrink-0 object-cover"
                    loading="lazy"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {!target && !hotspots.isLoading ? (
          <p className="text-ink-2 mt-4 text-xs">
            Belum ada titik panas aktif yang dapat dilaporkan di wilayah ini.
          </p>
        ) : null}
        <button
          type="button"
          disabled={!target}
          onClick={() => setOpen((value) => !value)}
          className="text-brand mt-4 text-sm font-semibold underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {open ? 'Tutup formulir' : 'Kirim laporan'}
        </button>
        {open ? (
          <form onSubmit={submit} className="border-line mt-3 space-y-3 border-t pt-4">
            <p className="text-ink-2 text-xs">
              Unggah JPEG, PNG, atau WebP maksimal 2 MiB.
            </p>
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.detail.reportNamePlaceholder}
              className="border-line rounded-ctl w-full border px-3 py-2 text-sm"
            />
            <select
              value={sighting}
              onChange={(e) => setSighting(e.target.value as HotspotSighting)}
              className="border-line rounded-ctl w-full border px-3 py-2 text-sm"
            >
              {Object.entries(sightingLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.detail.reportDescriptionPlaceholder}
              className="border-line rounded-ctl w-full border px-3 py-2 text-sm"
            />
            <input
              required
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="text-ink-2 w-full text-xs"
            />
            {create.isError ? (
              <p className="text-risk-high text-sm">
                Laporan belum dapat dikirim. Coba lagi.
              </p>
            ) : null}
            {create.isSuccess ? (
              <p className="text-risk-low text-sm">Laporan terkirim.</p>
            ) : null}
            <Button
              type="submit"
              size="md"
              loading={create.isPending}
              disabled={create.isPending || !photo || photo.size > 2 * 1024 * 1024}
              className="w-full"
            >
              {create.isPending ? 'Mengirim…' : 'Kirim laporan'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { copy } from '@/copy/id'
import { useNasaEonet } from '@/data/queries'
import { formatNumber } from '@/lib/format'
import { focusRing } from '@/components/common/focus-ring'

export function NasaEonetCard() {
  const [open, setOpen] = useState(false)
  const eonet = useNasaEonet('open', 20, open)
  const events = eonet.data?.data.events ?? []

  return (
    <Card role="region" aria-label={copy.extra.contextLabel}>
      <CardHeader>
        <CardTitle>{copy.extra.contextTitle}</CardTitle>
        <p className="text-ink-2 text-xs leading-5">{copy.extra.contextStatus}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-ink-2 text-xs leading-5">{copy.extra.contextDescription}</p>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`border-line text-ink rounded-ctl hover:bg-surface-muted min-h-9 border px-3 text-xs font-medium ${focusRing}`}
          aria-expanded={open}
        >
          {open ? copy.extra.contextHide : copy.extra.contextShow}
        </button>

        {open && eonet.isFetching ? (
          <p className="text-ink-2 text-xs leading-5">{copy.extra.contextLoading}</p>
        ) : null}

        {open && eonet.isError ? (
          <div className="space-y-2">
            <p className="text-ink-2 text-xs leading-5">{copy.extra.contextUnavailable}</p>
            <button
              type="button"
              onClick={() => void eonet.refetch()}
              className={`text-brand rounded-ctl min-h-9 px-2 text-xs font-medium ${focusRing}`}
            >
              {copy.common.retry}
            </button>
          </div>
        ) : null}

        {open && eonet.data ? (
          <div className="space-y-2">
            <p className="text-ink-3 text-xs leading-5">{copy.extra.contextCount(formatNumber(events.length))}</p>
            {events.length === 0 ? (
              <p className="text-ink-2 text-xs leading-5">{copy.extra.contextEmpty}</p>
            ) : (
              <ul className="divide-line border-line divide-y border-t text-xs">
                {events.map((event) => (
                  <li key={event.id} className="py-2">
                    <p className="text-ink font-medium leading-5">{event.judul}</p>
                    <p className="text-ink-3 leading-4">{event.kategori.join(', ') || 'Umum'}</p>
                    {event.link ? (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`text-brand hover:underline ${focusRing}`}
                      >
                        Sumber primer
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

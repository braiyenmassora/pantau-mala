import { Share2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/common'
import { getCopy } from '@/copy'
import { buildWilayahPath } from '@/lib/wilayah-path'

type ShareWilayahButtonProps = {
  name: string
  code: string
}

function openWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** Bagikan detail wilayah. Web Share API, fallback WhatsApp. */
export function ShareWilayahButton({ name, code }: ShareWilayahButtonProps) {
  const [hint, setHint] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    const path = buildWilayahPath(name, code)
    if (!path) return
    const pageUrl = `${window.location.origin}${path}`
    const body = getCopy().share.text(name)
    const message = `${body}\n${pageUrl}`

    setBusy(true)
    setHint(null)

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: getCopy().meta.wilayahTitle(name),
          text: body,
          url: pageUrl,
        })
        setBusy(false)
        return
      } catch (err) {
        // Batalkan share: diam saja, bukan error.
        if (err instanceof DOMException && err.name === 'AbortError') {
          setBusy(false)
          return
        }
      }
    }

    openWhatsApp(message)
    setHint(getCopy().share.whatsappFallback)
    setBusy(false)
    window.setTimeout(() => setHint(null), 2500)
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="soft"
        size="sm"
        className="h-11 min-h-11 px-4 text-sm leading-5 font-medium"
        loading={busy}
        onClick={() => {
          void handleShare()
        }}
        aria-label={getCopy().share.button}
      >
        <Share2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {busy ? getCopy().share.buttonBusy : getCopy().share.button}
      </Button>
      {hint ? (
        <p role="status" className="text-ink-2 text-xs leading-4">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

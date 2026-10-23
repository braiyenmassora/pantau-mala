import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

export function ShareRegionButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    const text = `Pantau kondisi titik panas di ${name} melalui pantaumala.`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Pantau ${name}`, text, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(
        'text-ink-2 hover:bg-surface-muted hover:text-ink flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-[0.96]',
        focusRing,
      )}
      aria-label={copied ? 'Tautan disalin' : `Bagikan ${name}`}
      title={copied ? 'Tautan disalin' : 'Bagikan wilayah'}
    >
      {copied ? <Check className="text-brand size-4" strokeWidth={2} aria-hidden /> : <Share2 className="size-4" strokeWidth={1.8} aria-hidden />}
    </button>
  )
}

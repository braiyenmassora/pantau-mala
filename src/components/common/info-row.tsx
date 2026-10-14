import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type InfoRowProps = {
  icon: ReactNode
  label: string
  value: ReactNode
  className?: string
}

const GUTTER = 'w-6 shrink-0'

/** Baris info Maps-like: ikon gutter 24px, teks rata kiri seragam. */
export function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex min-h-10 items-start gap-3 py-2', className)}>
      <span className={cn(GUTTER, 'text-ink-2 mt-0.5 flex justify-center')} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink-2 text-xs font-medium">{label}</p>
        <p className="text-ink mt-0.5 text-base">{value}</p>
      </div>
    </div>
  )
}

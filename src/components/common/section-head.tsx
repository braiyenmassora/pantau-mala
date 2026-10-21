import type { ReactNode } from 'react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Header section kartu seragam — pola SectionHead Pola Mantap (BE),
 * gaya mengikuti Card FE (judul label 12/16, deskripsi quiet).
 */
export function SectionHead({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <CardHeader>
      <div className="min-w-0 space-y-1">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
  )
}

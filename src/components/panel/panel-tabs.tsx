import type { ReactNode } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { cn } from '@/lib/utils'

export type PanelTabItem = {
  id: string
  label: string
  panel: ReactNode
}

type PanelTabsProps = {
  tabs: PanelTabItem[]
  value: string
  onChange: (id: string) => void
}

/** Tab teks + garis bawah aksen brand — tinggi seragam. */
export function PanelTabs({ tabs, value, onChange }: PanelTabsProps) {
  return (
    <div>
      <div role="tablist" className="border-line flex gap-4 border-b">
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              className={cn(
                'text-ink-2 relative -mb-px h-10 shrink-0 text-sm font-medium',
                'transition-colors duration-150',
                focusRing,
                'rounded-ctl',
                active && 'text-ink',
              )}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {active ? (
                <span
                  className="bg-brand absolute right-0 bottom-0 left-0 h-0.5 rounded-full"
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) =>
        tab.id === value ? (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            className="pt-4"
          >
            {tab.panel}
          </div>
        ) : null,
      )}
    </div>
  )
}

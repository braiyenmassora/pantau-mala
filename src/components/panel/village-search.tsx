import { Search, X } from 'lucide-react'
import { useId, useState } from 'react'

import { focusRing } from '@/components/common/focus-ring'
import { ProgressBar } from '@/components/common/progress-bar'
import { copy } from '@/copy/id'
import type { Village } from '@/data/extended-contract'
import { useSearchVillages } from '@/data/queries'
import { cn } from '@/lib/utils'

export function VillageSearch({
  value,
  onChange,
}: {
  value: Village | null
  onChange: (village: Village | null) => void
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const villages = useSearchVillages(query)
  const options = villages.data?.data ?? []
  const searching = query.trim().length >= 2

  return (
    <div className="relative space-y-2">
      <label htmlFor={id} className="text-ink text-xs font-semibold">
        Desa atau kelurahan
      </label>
      <div className="border-line bg-surface rounded-ctl flex h-11 items-center gap-2 border px-3">
        <Search className="text-ink-3 size-4 shrink-0" aria-hidden />
        <input
          id={id}
          value={query || value?.nama || ''}
          placeholder={copy.weather.searchPlaceholder}
          autoComplete="off"
          className="text-ink placeholder:text-ink-3 min-w-0 flex-1 bg-transparent text-sm outline-none"
          onChange={(event) => {
            setQuery(event.target.value)
            if (value) onChange(null)
          }}
        />
        {query || value ? (
          <button
            type="button"
            aria-label={copy.weather.clearSearch}
            className={cn(
              'text-ink-2 hover:text-ink rounded-ctl flex size-8 items-center justify-center',
              focusRing,
            )}
            onClick={() => {
              setQuery('')
              onChange(null)
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {villages.isSearching ? <ProgressBar /> : null}
      {searching && !value ? (
        <div className="border-line bg-surface soft-scroll rounded-ctl max-h-48 overflow-y-auto border p-1 shadow-sm">
          {villages.isError ? (
            <p role="alert" className="text-ink-2 px-2 py-3 text-xs">
              Pencarian desa belum tersedia.
            </p>
          ) : options.length ? (
            options.map((village) => (
              <button
                key={village.kode}
                type="button"
                className={cn(
                  'hover:bg-surface-muted rounded-ctl block min-h-11 w-full px-2 py-2 text-left',
                  focusRing,
                )}
                onClick={() => {
                  onChange(village)
                  setQuery('')
                }}
              >
                <span className="text-ink block text-xs font-semibold">
                  {village.nama}
                </span>
                <span className="text-ink-2 mt-1 block text-xs leading-4">
                  {village.kecamatan}, {village.kabupaten}, {village.provinsi}
                </span>
              </button>
            ))
          ) : !villages.isSearching ? (
            <p className="text-ink-2 px-2 py-3 text-xs">Desa tidak ditemukan.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

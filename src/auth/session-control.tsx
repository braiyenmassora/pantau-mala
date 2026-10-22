import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { IconButton, SearchableSelect } from '@/components/common'
import { getCopy } from '@/copy'
import { logout, sessionRequest, switchClient, useSession } from './session'

export function SessionControl() {
  const accessMode = useSession((s) => s.accessMode)
  const principal = useSession((s) => s.principal)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const generation = useSession((s) => s.generation)
  const clients = useQuery({
    queryKey: ['access-clients', principal?.client_id, generation],
    queryFn: async () =>
      z
        .object({
          data: z.array(
            z.object({
              id: z.string().uuid(),
              slug: z.string(),
              name: z.string(),
              enabled: z.boolean(),
            }),
          ),
        })
        .parse(await sessionRequest('/auth/clients', 'GET'))
        .data.filter((c) => c.enabled),
    staleTime: 300000,
    enabled: accessMode === 'account',
  })
  if (accessMode === 'client') return null
  return (
    <div className="border-line flex flex-wrap items-center gap-2 border-t pt-2 text-xs leading-4">
      <span className="text-ink-2 min-w-0 flex-1 break-words">
        {principal?.username} · {principal?.client_slug}
      </span>
      {clients.data && clients.data.length > 1 && (
        <div className="w-full">
          <label htmlFor="workspace" className="mb-1 block text-xs leading-4">
            {getCopy().auth.workspace}
          </label>
          <SearchableSelect
            id="workspace"
            value={principal?.client_slug ?? ''}
            disabled={busy}
            options={clients.data.map((c) => ({
              value: c.slug,
              label: c.name || c.slug,
            }))}
            onChange={(val) => {
              setBusy(true)
              setError('')
              void switchClient(val)
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : getCopy().auth.workspaceSwitchFail,
                  ),
                )
                .finally(() => setBusy(false))
            }}
            searchPlaceholder={getCopy().auth.workspaceSearch}
            emptyText={getCopy().auth.workspaceEmpty}
            ariaLabel={getCopy().auth.workspace}
          />
        </div>
      )}
      {clients.isError && (
        <p role="alert" className="w-full text-xs leading-4">
          {getCopy().auth.workspaceListFail}
        </p>
      )}
      <IconButton
        aria-label={getCopy().auth.logout}
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setError('')
          void logout()
            .catch((err) =>
              setError(err instanceof Error ? err.message : getCopy().auth.logoutFail),
            )
            .finally(() => setBusy(false))
        }}
      >
        <LogOut className="size-4" strokeWidth={2} aria-hidden />
      </IconButton>
      {error && (
        <p role="alert" className="w-full text-xs leading-4">
          {error}
        </p>
      )}
    </div>
  )
}

/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Clock, CloudOff, Filter, MapPinOff, SearchX, ShieldCheck } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EmptyState } from '@/components/common/empty-state'
import { copy } from '@/copy/id'

describe('EmptyState', () => {
  afterEach(() => cleanup())

  it('no hotspots 24h', () => {
    render(
      <EmptyState
        icon={ShieldCheck}
        title={copy.empty.noHotspots.title}
        description={copy.empty.noHotspots.description('Indonesia')}
      />,
    )
    expect(screen.getByText(copy.empty.noHotspots.title)).toBeTruthy()
    expect(screen.getByText(copy.empty.noHotspots.description('Indonesia'))).toBeTruthy()
  })

  it('filter empty with clear action', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={Filter}
        title={copy.empty.noRegionsFilter.title}
        description={copy.empty.noRegionsFilter.description('Sedang', 'Jambi')}
        action={{ label: copy.empty.noRegionsFilter.action, onClick }}
      />,
    )
    expect(screen.getByText(copy.empty.noRegionsFilter.title)).toBeTruthy()
    await userEvent.click(
      screen.getByRole('button', { name: copy.empty.noRegionsFilter.action }),
    )
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('search miss', () => {
    render(
      <EmptyState
        icon={SearchX}
        title={copy.empty.searchMiss.title}
        description={copy.empty.searchMiss.description}
      />,
    )
    expect(screen.getByText(copy.empty.searchMiss.title)).toBeTruthy()
  })

  it('no hotspots in region', () => {
    render(
      <EmptyState
        icon={ShieldCheck}
        title={copy.empty.noHotspotsInRegion.title}
        description={copy.empty.noHotspotsInRegion.description('Merauke')}
      />,
    )
    expect(screen.getByText(copy.empty.noHotspotsInRegion.title)).toBeTruthy()
  })

  it('load fail with retry', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={CloudOff}
        title={copy.empty.loadFail.title}
        description={copy.empty.loadFail.description}
        action={{ label: copy.empty.loadFail.action, onClick }}
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: copy.empty.loadFail.action }),
    )
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('data late', () => {
    render(
      <EmptyState
        icon={Clock}
        title={copy.empty.dataLate.title}
        description={copy.empty.dataLate.description(
          '09 Okt 2026, 14:05 WIB',
          copy.source.firms,
        )}
      />,
    )
    expect(screen.getByText(copy.empty.dataLate.title)).toBeTruthy()
    expect(
      screen.getByText(
        copy.empty.dataLate.description('09 Okt 2026, 14:05 WIB', copy.source.firms),
      ),
    ).toBeTruthy()
  })

  it('location denied', () => {
    render(
      <EmptyState
        icon={MapPinOff}
        title={copy.empty.locationDenied.title}
        description={copy.empty.locationDenied.description}
      />,
    )
    expect(screen.getByText(copy.empty.locationDenied.title)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('location error with retry', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={MapPinOff}
        title={copy.empty.locationError.title}
        description={copy.empty.locationError.description}
        action={{ label: copy.empty.locationError.action, onClick }}
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: copy.empty.locationError.action }),
    )
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('action variant is bordered surface CTA', () => {
    const { container } = render(
      <EmptyState
        variant="action"
        icon={MapPinOff}
        title={copy.location.riskTitle}
        description={copy.location.riskSubtitle}
      />,
    )
    const section = container.querySelector('section')
    expect(section?.className).toContain('border')
    expect(section?.className).toContain('bg-surface')
  })

  it('bare variant has no section chrome', () => {
    const { container } = render(
      <EmptyState
        variant="bare"
        icon={MapPinOff}
        titleId="prompt-title"
        title={copy.location.promptTitle}
        description={copy.location.promptBody}
      />,
    )
    expect(container.querySelector('section')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
  })
})

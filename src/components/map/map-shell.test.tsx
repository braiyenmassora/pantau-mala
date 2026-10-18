/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LayerErrorBoundary, MapShell } from '@/components/map/map-shell'
import { copy } from '@/copy/id'
import { isBasemapStyleError, webGlSupported } from '@/lib/map-support'
import { useUiStore } from '@/store/ui'

const mapOn = vi.fn()
const mapOff = vi.fn()
let regionLayersShouldThrow = false

vi.mock('@/components/ui/map', () => ({
  Map: ({ children, blank }: { children: React.ReactNode; blank?: boolean }) => (
    <div data-testid="map-root" data-blank={blank ? '1' : '0'}>
      {children}
    </div>
  ),
  useMap: () => ({
    map: { on: mapOn, off: mapOff },
    isLoaded: true,
  }),
}))

vi.mock('@/components/map/indonesia-map-framing', () => ({
  IndonesiaMapFraming: ({ onReady }: { onReady?: () => void }) => {
    onReady?.()
    return null
  },
}))

vi.mock('@/data/queries', () => ({
  useRegionCatalog: () => ({ data: { provinces: [], regencies: [] } }),
}))

vi.mock('@/components/map/region-layers', () => ({
  RegionLayers: () => {
    if (regionLayersShouldThrow) throw new Error('pin crash')
    return <div data-testid="layer-regions" />
  },
}))

vi.mock('@/components/map/selected-hotspots-layer', () => ({
  SelectedHotspotsLayer: () => null,
}))

vi.mock('@/components/map/hotspot-heatmap-layer', () => ({
  HotspotHeatmapLayer: () => null,
}))

vi.mock('@/components/map/province-focus', () => ({
  ProvinceFocus: () => null,
}))

vi.mock('@/components/map/province-choropleth-layer', () => ({
  ProvinceChoroplethLayer: () => null,
}))

vi.mock('@/components/map/province-labels-layer', () => ({
  ProvinceLabelsLayer: () => null,
}))

vi.mock('@/components/map/province-pins-layer', () => ({
  ProvincePinsLayer: () => null,
}))

vi.mock('@/components/map/user-location-layer', () => ({
  UserLocationLayer: () => <div data-testid="layer-user" />,
}))

describe('isBasemapStyleError', () => {
  it('ignores tile/source errors', () => {
    expect(
      isBasemapStyleError({
        sourceId: 'carto',
        error: new Error('Failed to fetch tile'),
      }),
    ).toBe(false)
  })

  it('flags style load failures without sourceId', () => {
    expect(
      isBasemapStyleError({
        error: new Error('Failed to fetch style'),
      }),
    ).toBe(true)
    expect(
      isBasemapStyleError({
        error: new Error('AJAXError: 404'),
      }),
    ).toBe(true)
  })
})

describe('webGlSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    cleanup()
  })

  it('returns false when canvas contexts are unavailable', () => {
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => null,
      }),
    })
    expect(webGlSupported()).toBe(false)
  })
})

describe('LayerErrorBoundary', () => {
  afterEach(() => cleanup())

  it('hides the broken layer and keeps siblings', () => {
    const onError = vi.fn()
    function Boom(): React.ReactNode {
      throw new Error('layer boom')
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <div>
        <LayerErrorBoundary name="Boom" onError={onError}>
          <Boom />
        </LayerErrorBoundary>
        <div data-testid="sibling">ok</div>
      </div>,
    )

    expect(screen.getByTestId('sibling').textContent).toBe('ok')
    expect(onError).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('MapShell failure modes', () => {
  const mapRef = { current: null }

  beforeEach(() => {
    regionLayersShouldThrow = false
    mapOn.mockReset()
    mapOff.mockReset()
    useUiStore.setState({ panelOpen: true })
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({}),
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows WebGL EmptyState when WebGL is missing', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => null,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext

    render(<MapShell mapRef={mapRef} panelOpen regions={[]} />)

    expect(screen.getByTestId('map-webgl-fail')).toBeTruthy()
    expect(screen.getByText(copy.empty.mapFail.title)).toBeTruthy()
    expect(screen.getByText(copy.empty.mapFail.description)).toBeTruthy()
    expect(screen.queryByTestId('map-root')).toBeNull()
  })

  it('keeps the map and shows basemap banner on style URL error', async () => {
    const user = userEvent.setup()
    render(<MapShell mapRef={mapRef} panelOpen regions={[]} />)

    expect(screen.getByTestId('map-root')).toBeTruthy()
    const handler = mapOn.mock.calls.find((c) => c[0] === 'error')?.[1] as
      ((e: { error: Error }) => void) | undefined
    expect(handler).toBeTypeOf('function')
    handler!({ error: new Error('Failed to fetch style.json') })

    expect(await screen.findByTestId('map-basemap-banner')).toBeTruthy()
    expect(screen.getByText(copy.empty.basemapFail.title)).toBeTruthy()
    expect(screen.getByTestId('map-root').getAttribute('data-blank')).toBe('1')
    expect(screen.queryByTestId('map-webgl-fail')).toBeNull()

    await user.click(screen.getByRole('button', { name: copy.empty.basemapFail.action }))
    expect(screen.getByTestId('map-root').getAttribute('data-blank')).toBe('0')
  })

  it('shows partial banner when a layer throws; map stays up', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    regionLayersShouldThrow = true

    render(<MapShell mapRef={mapRef} panelOpen regions={[]} />)

    expect(await screen.findByTestId('map-partial-banner')).toBeTruthy()
    expect(screen.getByText(copy.empty.mapPartial.title)).toBeTruthy()
    expect(screen.getByTestId('map-root')).toBeTruthy()
    expect(screen.queryByTestId('map-webgl-fail')).toBeNull()
    expect(screen.queryByTestId('layer-regions')).toBeNull()
    expect(screen.getByTestId('layer-user')).toBeTruthy()

    spy.mockRestore()
  })
})

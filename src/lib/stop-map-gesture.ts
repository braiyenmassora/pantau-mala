/** Keep MapLibre from receiving wheel/pointer gestures meant for UI overlays. */
export function stopMapGesture(e: { stopPropagation: () => void }) {
  e.stopPropagation()
}

export const mapOverlayGestureProps = {
  onWheel: stopMapGesture,
  onPointerDown: stopMapGesture,
  onTouchStart: stopMapGesture,
  onDoubleClick: stopMapGesture,
} as const

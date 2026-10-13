/** Original SVG lettering and symbol shared with the Go console. */
export function Brand({ compact = false }: { compact?: boolean } = {}) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/brand-symbol.svg"
        alt=""
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        className={compact ? 'size-7 shrink-0' : 'size-9 shrink-0'}
      />
      <img
        src="/brand-wordmark.svg"
        alt="pantau mala"
        width={compact ? 134 : 170}
        height={compact ? 24 : 30}
        className={compact ? 'h-6 w-auto' : 'h-7 w-auto'}
      />
    </span>
  )
}

import type { IndexThreshold } from '../../lib/indexThresholds'

interface Props {
  threshold: IndexThreshold
}

export function IndexTooltip({ threshold }: Props) {
  const formatBound = (v: number): string => {
    if (v === Number.NEGATIVE_INFINITY) return '−∞'
    if (v === Number.POSITIVE_INFINITY) return '+∞'
    return v.toString()
  }
  const unitSuffix = threshold.unit ? ` ${threshold.unit}` : ''
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-3 rounded-lg bg-bg-card border border-border-bright opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl text-left">
      <div className="text-sm font-bold text-text-primary mb-1">{threshold.displayName}</div>
      {threshold.description && (
        <p className="text-[11px] text-text-secondary leading-relaxed mb-2">{threshold.description}</p>
      )}
      {threshold.formula && (
        <div className="text-[11px] font-mono text-text-secondary mb-1">
          <span className="text-text-muted">Formula:</span> {threshold.formula}
        </div>
      )}
      <div className="text-[11px] text-text-secondary mb-2">
        <span className="text-text-muted">Normal range:</span> {threshold.normalRange[0]}–{threshold.normalRange[1]}{unitSuffix}
      </div>
      <div className="text-[11px] text-text-secondary mb-2">
        <div className="text-text-muted mb-1">Interpretation:</div>
        <ul className="space-y-0.5 pl-1">
          {threshold.levels.map((level, i) => (
            <li key={i}>
              <span className="text-text-muted">{formatBound(level.min)}–{formatBound(level.max)}:</span>{' '}
              <span>{level.label}</span>
            </li>
          ))}
        </ul>
      </div>
      {threshold.reference && (
        <div className="text-[10px] text-text-muted italic border-t border-border-bright pt-2 mt-2">
          {threshold.reference}
        </div>
      )}
    </div>
  )
}

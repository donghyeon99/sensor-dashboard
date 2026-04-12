import { Clock } from 'lucide-react'
import { useEegStore } from '../../stores/slices/eegStore'
import {
  eegIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
  getThresholdDotClass,
  type IndexThreshold,
} from '../../lib/thresholds/indexThresholds'
import { IndexTooltip } from './IndexTooltip'

const indices: IndexThreshold[] = [
  eegIndexThresholds.relaxationIndex,
  eegIndexThresholds.emotionalStability,
  eegIndexThresholds.focusIndex,
  eegIndexThresholds.stressIndex,
  eegIndexThresholds.totalPower,
  eegIndexThresholds.cognitiveLoad,
  eegIndexThresholds.hemisphericBalance,
]

export function IndexCards() {
  const eegAnalysis = useEegStore((s) => s.analysis)

  const valueFor = (key: string): number | undefined => {
    if (!eegAnalysis) return undefined
    switch (key) {
      case 'focusIndex': return eegAnalysis.focusIndex
      case 'relaxationIndex': return eegAnalysis.relaxationIndex
      case 'stressIndex': return eegAnalysis.stressIndex
      case 'emotionalStability': return eegAnalysis.emotionalStability
      case 'hemisphericBalance': return eegAnalysis.hemisphericBalance
      case 'cognitiveLoad': return eegAnalysis.cognitiveLoad
      case 'totalPower': return eegAnalysis.totalPower
      default: return undefined
    }
  }

  const renderCard = (threshold: IndexThreshold) => {
    const value = valueFor(threshold.key)
    const hasValue = typeof value === 'number' && Number.isFinite(value)
    const level = hasValue ? classifyIndex(value!, threshold) : null
    const colorClass = level ? getThresholdTextClass(level.color) : 'text-metric-muted'
    const dotClass = level ? getThresholdDotClass(level.color) : 'bg-gray-500'
    return (
      <div
        key={threshold.key}
        className="group relative bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
            <span className="text-sm font-medium text-metric-text">{threshold.displayName}</span>
          </div>
          {!hasValue && <Clock className="w-3 h-3 text-metric-muted" aria-hidden="true" />}
        </div>
        <div className="text-2xl font-bold text-metric-value mb-1">
          {hasValue ? value!.toFixed(2) : '--'}
          {threshold.unit && <span className="text-sm text-metric-muted ml-1">{threshold.unit}</span>}
        </div>
        <div className={`text-xs font-medium mb-1 ${colorClass}`}>{level?.label ?? 'No data'}</div>
        <IndexTooltip threshold={threshold} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.slice(0, 4).map(renderCard)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {indices.slice(4).map(renderCard)}
      </div>
    </div>
  )
}

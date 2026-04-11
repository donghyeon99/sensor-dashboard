import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'
import {
  eegIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
  type IndexThreshold,
} from '../../lib/indexThresholds'
import { IndexTooltip } from './IndexTooltip'

interface IndexDef {
  threshold: IndexThreshold
  dotColor: string
  basis: string
}

const indices: IndexDef[] = [
  { threshold: eegIndexThresholds.relaxationIndex, dotColor: 'bg-red-500', basis: 'α / (α + β)' },
  { threshold: eegIndexThresholds.emotionalStability, dotColor: 'bg-pink-500', basis: '(α + θ) / γ' },
  { threshold: eegIndexThresholds.focusIndex, dotColor: 'bg-yellow-500', basis: 'β / (α + θ)' },
  { threshold: eegIndexThresholds.stressIndex, dotColor: 'bg-orange-500', basis: '(β + γ) / (α + θ)' },
  { threshold: eegIndexThresholds.totalPower, dotColor: 'bg-green-500', basis: 'Σ band powers' },
  { threshold: eegIndexThresholds.cognitiveLoad, dotColor: 'bg-blue-500', basis: 'θ / α' },
  { threshold: eegIndexThresholds.hemisphericBalance, dotColor: 'bg-purple-500', basis: '(αL − αR) / (αL + αR)' },
]

function IndexCard({ idx, value }: { idx: IndexDef; value: number | undefined }) {
  const hasValue = value !== undefined && value !== null && !Number.isNaN(value)
  const level = hasValue ? classifyIndex(value as number, idx.threshold) : null
  const colorClass = level ? getThresholdTextClass(level.color) : 'text-text-muted'
  return (
    <div className="group relative bg-bg-elevated border border-border rounded-xl p-4 hover:bg-bg-hover transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${idx.dotColor}`} />
          <span className="text-sm font-semibold text-text-primary">{idx.threshold.displayName}</span>
        </div>
        <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 bg-bg-base rounded">{idx.basis}</span>
      </div>
      <div className="text-3xl font-extrabold text-text-primary mb-1 font-mono tracking-tight">
        {hasValue ? (value as number).toFixed(2) : '--'}
        {idx.threshold.unit && <span className="text-sm text-text-muted ml-1 font-normal">{idx.threshold.unit}</span>}
      </div>
      <div className={`text-xs font-semibold mb-2 ${colorClass}`}>{level ? level.label : 'No data'}</div>
      {idx.threshold.description && (
        <div className="text-[11px] text-text-muted leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
          {idx.threshold.description}
        </div>
      )}
      <IndexTooltip threshold={idx.threshold} />
    </div>
  )
}

export function IndexCards() {
  const eegAnalysis = useSensorDataStore((s) => s.eegAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !eegAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🧠</div>
        <div className="text-sm text-text-secondary">
          {connected ? 'Waiting for analysis index data...' : 'Press the Connect button to connect'}
        </div>
      </div>
    )
  }

  const valueFor = (key: string): number | undefined => {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.slice(0, 4).map((idx) => (
          <IndexCard key={idx.threshold.key} idx={idx} value={valueFor(idx.threshold.key)} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {indices.slice(4).map((idx) => (
          <IndexCard key={idx.threshold.key} idx={idx} value={valueFor(idx.threshold.key)} />
        ))}
      </div>
    </div>
  )
}

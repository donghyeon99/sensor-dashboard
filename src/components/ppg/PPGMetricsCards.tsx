import { usePpgStore } from '../../stores/slices/ppgStore'
import {
  ppgIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
  getThresholdDotClass,
  type IndexThreshold,
} from '../../lib/thresholds/indexThresholds'
import { Clock } from 'lucide-react'
import { IndexTooltip } from '../eeg/IndexTooltip'

interface MetricCardProps {
  threshold: IndexThreshold
  value: number | null | undefined
  decimals?: number
  requirePositive?: boolean
}

function MetricCard({ threshold, value, decimals = 1, requirePositive }: MetricCardProps) {
  const valid =
    value !== undefined &&
    value !== null &&
    !Number.isNaN(value) &&
    (!requirePositive || value > 0)
  const level = valid ? classifyIndex(value as number, threshold) : null
  const colorClass = level ? getThresholdTextClass(level.color) : 'text-metric-muted'
  const dotClass = level ? getThresholdDotClass(level.color) : 'bg-gray-500'

  return (
    <div className={`group relative bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors ${valid ? 'opacity-100' : 'opacity-60'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
          <span className="text-sm font-medium text-metric-text">{threshold.displayName}</span>
        </div>
        <Clock className="w-3 h-3 text-metric-muted" aria-hidden="true" />
      </div>
      <div className="text-2xl font-bold text-metric-value mb-1">
        {valid ? (value as number).toFixed(decimals) : '--'}
        {threshold.unit && <span className="text-sm text-metric-muted ml-1">{threshold.unit}</span>}
      </div>
      <div className={`text-xs font-medium mb-1 ${colorClass}`}>
        {level ? level.label : 'No data'}
      </div>
      <IndexTooltip threshold={threshold} />
    </div>
  )
}

export function PPGMetricsCards() {
  const analysis = usePpgStore((s) => s.analysis)
  const a = analysis

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard threshold={ppgIndexThresholds.bpm} value={a?.bpm} decimals={0} requirePositive />
        <MetricCard threshold={ppgIndexThresholds.spo2} value={a?.spo2} />
        <MetricCard threshold={ppgIndexThresholds.hrMax} value={a?.hrMax} decimals={0} />
        <MetricCard threshold={ppgIndexThresholds.hrMin} value={a?.hrMin} decimals={0} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard threshold={ppgIndexThresholds.ppgStressIndex} value={a?.stressIndex} decimals={2} />
        <MetricCard threshold={ppgIndexThresholds.rmssd} value={a?.rmssd} />
        <MetricCard threshold={ppgIndexThresholds.sdnn} value={a?.sdnn} />
        <MetricCard threshold={ppgIndexThresholds.sdsd} value={a?.sdsd} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard threshold={ppgIndexThresholds.lfPower} value={a?.lfPower} decimals={1} />
        <MetricCard threshold={ppgIndexThresholds.hfPower} value={a?.hfPower} decimals={1} />
        <MetricCard threshold={ppgIndexThresholds.lfHfRatio} value={a?.lfHfRatio} decimals={2} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard threshold={ppgIndexThresholds.avnn} value={a?.avnn} decimals={1} />
        <MetricCard threshold={ppgIndexThresholds.pnn50} value={a?.pnn50} />
        <MetricCard threshold={ppgIndexThresholds.pnn20} value={a?.pnn20} />
      </div>
    </div>
  )
}

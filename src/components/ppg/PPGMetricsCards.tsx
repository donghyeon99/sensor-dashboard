import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'
import {
  ppgIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
  type IndexThreshold,
} from '../../lib/indexThresholds'
import { IndexTooltip } from '../eeg/IndexTooltip'

const isValid = (v: number | null | undefined): v is number =>
  v !== undefined && v !== null && !Number.isNaN(v)

interface MetricCardProps {
  threshold: IndexThreshold
  value: number | null | undefined
  decimals?: number
  dotColor: string
  emoji?: string
  emojiAnimation?: string
}

function MetricCard({ threshold, value, decimals = 1, dotColor, emoji, emojiAnimation }: MetricCardProps) {
  const valid = isValid(value) && (threshold.key !== 'bpm' || value > 0)
  const level = valid ? classifyIndex(value as number, threshold) : null
  const colorClass = level ? getThresholdTextClass(level.color) : 'text-text-muted'
  const display = valid ? (value as number).toFixed(decimals) : '—'
  return (
    <div className="group relative bg-bg-base rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold text-text-secondary">{threshold.displayName}</span>
      </div>
      <div className="text-xl font-bold text-text-primary font-mono flex items-baseline gap-1">
        {emoji && (
          <span
            className="text-base inline-block origin-center"
            style={{ animation: emojiAnimation }}
          >
            {emoji}
          </span>
        )}
        <span>{display}</span>
        {threshold.unit && <span className="text-[10px] text-text-muted font-normal">{threshold.unit}</span>}
      </div>
      <div className={`text-[11px] font-medium mt-1 ${colorClass}`}>{level ? level.label : '—'}</div>
      <IndexTooltip threshold={threshold} />
    </div>
  )
}

export function PPGMetricsCards() {
  const ppgAnalysis = useSensorDataStore((s) => s.ppgAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !ppgAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">❤️</div>
        <div className="text-sm text-text-secondary">
          {connected ? 'Waiting for data...' : 'Please connect your device'}
        </div>
      </div>
    )
  }

  const beatDuration = isValid(ppgAnalysis.bpm) && ppgAnalysis.bpm > 0 ? `${60 / ppgAnalysis.bpm}s` : '1s'
  const heartbeatAnimation = isValid(ppgAnalysis.bpm) && ppgAnalysis.bpm > 0
    ? `heartbeat ${beatDuration} ease-in-out infinite`
    : 'none'

  return (
    <div className="space-y-4">
      {/* Row 1: BPM, SpO2, HR Max, HR Min */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          threshold={ppgIndexThresholds.bpm}
          value={ppgAnalysis.bpm}
          decimals={0}
          dotColor="bg-red-500"
          emoji="❤️"
          emojiAnimation={heartbeatAnimation}
        />
        <MetricCard threshold={ppgIndexThresholds.spo2} value={ppgAnalysis.spo2} dotColor="bg-teal-500" />
        <MetricCard threshold={ppgIndexThresholds.hrMax} value={ppgAnalysis.hrMax} dotColor="bg-green-500" />
        <MetricCard threshold={ppgIndexThresholds.hrMin} value={ppgAnalysis.hrMin} dotColor="bg-green-500" />
      </div>

      {/* HRV Section */}
      <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-text-primary">HRV (Heart Rate Variability)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple/10 text-purple border border-purple/20 font-mono">심박변이도</span>
        </div>
        <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
          심박 사이 간격의 변동성. 높을수록 자율신경계가 유연하고 건강한 상태를 의미합니다.
        </p>

        {/* Row 2: Stress, RMSSD, SDNN, SDSD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <MetricCard threshold={ppgIndexThresholds.ppgStressIndex} value={ppgAnalysis.stressIndex} decimals={2} dotColor="bg-blue-500" />
          <MetricCard threshold={ppgIndexThresholds.rmssd} value={ppgAnalysis.rmssd} dotColor="bg-blue-500" />
          <MetricCard threshold={ppgIndexThresholds.sdnn} value={ppgAnalysis.sdnn} dotColor="bg-blue-500" />
          <MetricCard threshold={ppgIndexThresholds.sdsd} value={ppgAnalysis.sdsd} dotColor="bg-blue-500" />
        </div>

        {/* Row 3: LF, HF, LF/HF */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <MetricCard threshold={ppgIndexThresholds.lfPower} value={ppgAnalysis.lfPower} decimals={1} dotColor="bg-red-500" />
          <MetricCard threshold={ppgIndexThresholds.hfPower} value={ppgAnalysis.hfPower} decimals={1} dotColor="bg-blue-500" />
          <MetricCard threshold={ppgIndexThresholds.lfHfRatio} value={ppgAnalysis.lfHfRatio} decimals={2} dotColor="bg-red-500" />
        </div>

        {/* Row 4: AVNN, PNN50, PNN20 */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard threshold={ppgIndexThresholds.avnn} value={ppgAnalysis.avnn} decimals={1} dotColor="bg-red-500" />
          <MetricCard threshold={ppgIndexThresholds.pnn50} value={ppgAnalysis.pnn50} dotColor="bg-blue-500" />
          <MetricCard threshold={ppgIndexThresholds.pnn20} value={ppgAnalysis.pnn20} dotColor="bg-green-500" />
        </div>
      </div>
    </div>
  )
}

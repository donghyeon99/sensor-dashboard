import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'
import {
  ppgIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
} from '../../lib/indexThresholds'
import { IndexTooltip } from '../eeg/IndexTooltip'

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

  const isValid = (v: number | null | undefined): v is number =>
    v !== undefined && v !== null && !isNaN(v)

  const bpm = ppgAnalysis.bpm
  const spo2 = ppgAnalysis.spo2

  const bpmLevel = isValid(bpm) && bpm > 0 ? classifyIndex(bpm, ppgIndexThresholds.bpm) : null
  const bpmColor = bpmLevel ? getThresholdTextClass(bpmLevel.color) : 'text-text-muted'

  const spo2Level = isValid(spo2) ? classifyIndex(spo2, ppgIndexThresholds.spo2) : null
  const spo2Color = spo2Level ? getThresholdTextClass(spo2Level.color) : 'text-text-muted'

  const sdnnLevel = isValid(ppgAnalysis.sdnn) ? classifyIndex(ppgAnalysis.sdnn, ppgIndexThresholds.sdnn) : null
  const sdnnColor = sdnnLevel ? getThresholdTextClass(sdnnLevel.color) : 'text-text-muted'

  const rmssdLevel = isValid(ppgAnalysis.rmssd) ? classifyIndex(ppgAnalysis.rmssd, ppgIndexThresholds.rmssd) : null
  const rmssdColor = rmssdLevel ? getThresholdTextClass(rmssdLevel.color) : 'text-text-muted'

  const lfHfLevel = isValid(ppgAnalysis.lfHfRatio) ? classifyIndex(ppgAnalysis.lfHfRatio, ppgIndexThresholds.lfHfRatio) : null
  const lfHfColor = lfHfLevel ? getThresholdTextClass(lfHfLevel.color) : 'text-text-muted'

  const beatDuration = isValid(bpm) && bpm > 0 ? `${60 / bpm}s` : '1s'

  return (
    <div className="space-y-4">
      {/* BPM + SpO2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="group relative bg-bg-elevated border border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span
              className="text-3xl inline-block origin-center"
              style={{ animation: isValid(bpm) && bpm > 0 ? `heartbeat ${beatDuration} ease-in-out infinite` : 'none' }}
            >
              ❤️
            </span>
            <span className="text-5xl font-extrabold font-mono text-text-primary tracking-tighter">
              {isValid(bpm) && bpm > 0 ? Math.round(bpm) : '—'}
            </span>
          </div>
          <div className="text-sm font-semibold tracking-wider uppercase text-text-secondary">
            {ppgIndexThresholds.bpm.displayName} ({ppgIndexThresholds.bpm.unit})
          </div>
          <div className={`text-xs font-medium mt-2 ${bpmColor}`}>{bpmLevel ? bpmLevel.label : '—'}</div>
          <IndexTooltip threshold={ppgIndexThresholds.bpm} />
        </div>

        <div className="group relative bg-bg-elevated border border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">🫁</span>
            <span className="text-5xl font-extrabold font-mono text-teal tracking-tighter">
              {isValid(spo2) ? spo2.toFixed(1) : '—'}
            </span>
          </div>
          <div className="text-sm font-semibold tracking-wider uppercase text-text-secondary">
            {ppgIndexThresholds.spo2.displayName} {ppgIndexThresholds.spo2.unit}
          </div>
          <div className={`text-xs font-medium mt-2 ${spo2Color}`}>{spo2Level ? spo2Level.label : '—'}</div>
          <IndexTooltip threshold={ppgIndexThresholds.spo2} />
        </div>
      </div>

      {/* HRV Metrics */}
      <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-text-primary">HRV (Heart Rate Variability)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple/10 text-purple border border-purple/20 font-mono">Heart Rate Variability</span>
        </div>
        <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
          A measure of the variability between heartbeats. Higher HRV indicates a more flexible and healthier autonomic nervous system.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="group relative bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-text-secondary">{ppgIndexThresholds.sdnn.displayName}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {isValid(ppgAnalysis.sdnn) ? ppgAnalysis.sdnn.toFixed(1) : '—'}
              <span className="text-xs text-text-muted ml-1 font-normal">{ppgIndexThresholds.sdnn.unit}</span>
            </div>
            <div className={`text-[11px] font-medium mt-1 ${sdnnColor}`}>{sdnnLevel ? sdnnLevel.label : '—'}</div>
            <IndexTooltip threshold={ppgIndexThresholds.sdnn} />
          </div>

          <div className="group relative bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-xs font-semibold text-text-secondary">{ppgIndexThresholds.rmssd.displayName}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {isValid(ppgAnalysis.rmssd) ? ppgAnalysis.rmssd.toFixed(1) : '—'}
              <span className="text-xs text-text-muted ml-1 font-normal">{ppgIndexThresholds.rmssd.unit}</span>
            </div>
            <div className={`text-[11px] font-medium mt-1 ${rmssdColor}`}>{rmssdLevel ? rmssdLevel.label : '—'}</div>
            <IndexTooltip threshold={ppgIndexThresholds.rmssd} />
          </div>

          <div className="group relative bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs font-semibold text-text-secondary">{ppgIndexThresholds.lfHfRatio.displayName}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {isValid(ppgAnalysis.lfHfRatio) ? ppgAnalysis.lfHfRatio.toFixed(2) : '—'}
            </div>
            <div className={`text-[11px] font-medium mt-1 ${lfHfColor}`}>{lfHfLevel ? lfHfLevel.label : '—'}</div>
            <IndexTooltip threshold={ppgIndexThresholds.lfHfRatio} />
          </div>
        </div>
      </div>
    </div>
  )
}

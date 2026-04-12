import { useMemo } from 'react'
import { useAccStore } from '../../stores/slices/accStore'
import { useConnectionStore } from '../../stores/connectionStore'
import {
  accIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
  getThresholdDotClass,
} from '../../lib/thresholds/indexThresholds'
import { IndexTooltip } from '../eeg/IndexTooltip'

export function MotionCards() {
  const accX = useAccStore((s) => s.x)
  const accY = useAccStore((s) => s.y)
  const accZ = useAccStore((s) => s.z)
  const accMagnitude = useAccStore((s) => s.magnitude)
  const accAnalysis = useAccStore((s) => s.analysis)
  const connected = useConnectionStore((s) => s.connected)

  const metrics = useMemo(() => {
    if (accMagnitude.length === 0 && !accAnalysis) return null
    const lastX = accX[accX.length - 1]?.value ?? 0
    const lastY = accY[accY.length - 1]?.value ?? 0
    const lastZ = accZ[accZ.length - 1]?.value ?? 0
    const lastMag = accMagnitude[accMagnitude.length - 1]?.value ?? 0

    return {
      lastX, lastY, lastZ, lastMag,
      activityState: accAnalysis?.activityState ?? 'unknown',
      intensity: accAnalysis?.intensity,
      stability: accAnalysis?.stability,
      avgMovement: accAnalysis?.avgMovement ?? 0,
    }
  }, [accX, accY, accZ, accMagnitude, accAnalysis])

  if (!connected || !metrics) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📐</div>
        <div className="text-sm text-metric-text">
          {connected ? 'Waiting for motion data...' : 'Press the Connect button to connect'}
        </div>
      </div>
    )
  }

  const stabilityLevel = metrics.stability != null ? classifyIndex(metrics.stability, accIndexThresholds.stability) : null
  const stabilityColor = stabilityLevel ? getThresholdTextClass(stabilityLevel.color) : 'text-metric-muted'
  const stabilityDot = stabilityLevel ? getThresholdDotClass(stabilityLevel.color) : 'bg-gray-500'

  const intensityLevel = metrics.intensity != null ? classifyIndex(metrics.intensity, accIndexThresholds.intensity) : null
  const intensityColor = intensityLevel ? getThresholdTextClass(intensityLevel.color) : 'text-metric-muted'
  const intensityDot = intensityLevel ? getThresholdDotClass(intensityLevel.color) : 'bg-gray-500'

  const rawCards = [
    { label: 'X-axis', value: metrics.lastX.toFixed(3), unit: 'g', color: 'bg-red-500' },
    { label: 'Y-axis', value: metrics.lastY.toFixed(3), unit: 'g', color: 'bg-green-500' },
    { label: 'Z-axis', value: metrics.lastZ.toFixed(3), unit: 'g', color: 'bg-blue-500' },
    { label: 'Magnitude', value: metrics.lastMag.toFixed(3), unit: 'g', color: 'bg-yellow-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {rawCards.map((card) => (
        <div key={card.label} className="bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${card.color}`} />
            <span className="text-sm font-medium text-metric-text">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-metric-value font-mono">
            {card.value}
            <span className="text-sm text-metric-muted ml-1">{card.unit}</span>
          </div>
        </div>
      ))}

      <div className="bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${metrics.activityState === 'stationary' ? 'bg-teal' : 'bg-coral'}`} />
          <span className="text-sm font-medium text-metric-text">Activity State</span>
        </div>
        <div className="text-2xl font-bold text-metric-value font-mono">
          {metrics.activityState}
        </div>
      </div>

      <div className="group relative bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${stabilityDot}`} />
          <span className="text-sm font-medium text-metric-text">{accIndexThresholds.stability.displayName}</span>
        </div>
        <div className="text-2xl font-bold text-metric-value font-mono">
          {metrics.stability != null ? metrics.stability.toFixed(0) : '--'}
          <span className="text-sm text-metric-muted ml-1">{accIndexThresholds.stability.unit}</span>
        </div>
        <div className={`text-xs font-medium mt-1 ${stabilityColor}`}>{stabilityLevel ? stabilityLevel.label : 'No data'}</div>
        <IndexTooltip threshold={accIndexThresholds.stability} />
      </div>

      <div className="group relative bg-metric-bg border border-metric-border rounded-lg p-4 hover:bg-metric-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${intensityDot}`} />
          <span className="text-sm font-medium text-metric-text">{accIndexThresholds.intensity.displayName}</span>
        </div>
        <div className="text-2xl font-bold text-metric-value font-mono">
          {metrics.intensity != null ? metrics.intensity.toFixed(0) : '--'}
          <span className="text-sm text-metric-muted ml-1">{accIndexThresholds.intensity.unit}</span>
        </div>
        <div className={`text-xs font-medium mt-1 ${intensityColor}`}>{intensityLevel ? intensityLevel.label : 'No data'}</div>
        <IndexTooltip threshold={accIndexThresholds.intensity} />
      </div>
    </div>
  )
}

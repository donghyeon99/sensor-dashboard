import { useMemo } from 'react'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'
import {
  accIndexThresholds,
  classifyIndex,
  getThresholdTextClass,
} from '../../lib/indexThresholds'
import { IndexTooltip } from '../eeg/IndexTooltip'

export function MotionCards() {
  const accX = useSensorDataStore((s) => s.accX)
  const accY = useSensorDataStore((s) => s.accY)
  const accZ = useSensorDataStore((s) => s.accZ)
  const accMagnitude = useSensorDataStore((s) => s.accMagnitude)
  const accAnalysis = useSensorDataStore((s) => s.accAnalysis)
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
        <div className="text-sm text-text-secondary">
          {connected ? 'Waiting for motion data...' : 'Press the Connect button to connect'}
        </div>
      </div>
    )
  }

  const stabilityLevel = metrics.stability != null ? classifyIndex(metrics.stability, accIndexThresholds.stability) : null
  const stabilityColor = stabilityLevel ? getThresholdTextClass(stabilityLevel.color) : 'text-text-muted'

  const intensityLevel = metrics.intensity != null ? classifyIndex(metrics.intensity, accIndexThresholds.intensity) : null
  const intensityColor = intensityLevel ? getThresholdTextClass(intensityLevel.color) : 'text-text-muted'

  const rawCards = [
    { label: 'X-axis', value: metrics.lastX.toFixed(3), unit: 'g', color: 'bg-red-500' },
    { label: 'Y-axis', value: metrics.lastY.toFixed(3), unit: 'g', color: 'bg-green-500' },
    { label: 'Z-axis', value: metrics.lastZ.toFixed(3), unit: 'g', color: 'bg-blue-500' },
    { label: 'Magnitude', value: metrics.lastMag.toFixed(3), unit: 'g', color: 'bg-yellow-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {rawCards.map((card) => (
        <div key={card.label} className="bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${card.color}`} />
            <span className="text-sm font-medium text-text-secondary">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-text-primary font-mono">
            {card.value}
            <span className="text-sm text-text-muted ml-1">{card.unit}</span>
          </div>
        </div>
      ))}

      <div className="bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${metrics.activityState === 'stationary' ? 'bg-teal' : 'bg-coral'}`} />
          <span className="text-sm font-medium text-text-secondary">Activity State</span>
        </div>
        <div className="text-2xl font-bold text-text-primary font-mono">
          {metrics.activityState}
        </div>
      </div>

      <div className="group relative bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm font-medium text-text-secondary">{accIndexThresholds.stability.displayName}</span>
        </div>
        <div className="text-2xl font-bold text-text-primary font-mono">
          {metrics.stability != null ? metrics.stability.toFixed(0) : '--'}
          <span className="text-sm text-text-muted ml-1">{accIndexThresholds.stability.unit}</span>
        </div>
        <div className={`text-xs font-medium mt-1 ${stabilityColor}`}>{stabilityLevel ? stabilityLevel.label : 'No data'}</div>
        <IndexTooltip threshold={accIndexThresholds.stability} />
      </div>

      <div className="group relative bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm font-medium text-text-secondary">{accIndexThresholds.intensity.displayName}</span>
        </div>
        <div className="text-2xl font-bold text-text-primary font-mono">
          {metrics.intensity != null ? metrics.intensity.toFixed(0) : '--'}
          <span className="text-sm text-text-muted ml-1">{accIndexThresholds.intensity.unit}</span>
        </div>
        <div className={`text-xs font-medium mt-1 ${intensityColor}`}>{intensityLevel ? intensityLevel.label : 'No data'}</div>
        <IndexTooltip threshold={accIndexThresholds.intensity} />
      </div>
    </div>
  )
}

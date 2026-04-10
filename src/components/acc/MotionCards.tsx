import { useMemo } from 'react'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

export function MotionCards() {
  const accX = useSensorDataStore((s) => s.accX)
  const accY = useSensorDataStore((s) => s.accY)
  const accZ = useSensorDataStore((s) => s.accZ)
  const accMagnitude = useSensorDataStore((s) => s.accMagnitude)
  const connected = useConnectionStore((s) => s.connected)

  const metrics = useMemo(() => {
    if (accMagnitude.length === 0) return null
    const lastX = accX[accX.length - 1]?.value ?? 0
    const lastY = accY[accY.length - 1]?.value ?? 0
    const lastZ = accZ[accZ.length - 1]?.value ?? 0
    const lastMag = accMagnitude[accMagnitude.length - 1]?.value ?? 0

    // Simple motion detection: if recent magnitude variance is high
    const recentMag = accMagnitude.slice(-25) // last 1 second
    const avgMag = recentMag.reduce((s, p) => s + p.value, 0) / recentMag.length
    const variance = recentMag.reduce((s, p) => s + (p.value - avgMag) ** 2, 0) / recentMag.length
    const isMoving = variance > 0.01

    return { lastX, lastY, lastZ, lastMag, isMoving, variance }
  }, [accX, accY, accZ, accMagnitude])

  if (!connected || !metrics) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📐</div>
        <div className="text-sm text-text-secondary">데이터 대기 중...</div>
      </div>
    )
  }

  const cards = [
    { label: 'X축', value: metrics.lastX.toFixed(3), unit: 'g', color: 'bg-red-500' },
    { label: 'Y축', value: metrics.lastY.toFixed(3), unit: 'g', color: 'bg-green-500' },
    { label: 'Z축', value: metrics.lastZ.toFixed(3), unit: 'g', color: 'bg-blue-500' },
    { label: 'Magnitude', value: metrics.lastMag.toFixed(3), unit: 'g', color: 'bg-yellow-500' },
    {
      label: '움직임 상태',
      value: metrics.isMoving ? 'Moving' : 'Still',
      unit: '',
      color: metrics.isMoving ? 'bg-coral' : 'bg-teal',
    },
    { label: '움직임 분산', value: metrics.variance.toFixed(4), unit: '', color: 'bg-purple-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((card) => (
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
    </div>
  )
}

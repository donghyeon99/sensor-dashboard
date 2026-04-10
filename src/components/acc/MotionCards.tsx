import { useMemo } from 'react'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

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
      intensity: accAnalysis?.intensity ?? 0,
      stability: accAnalysis?.stability ?? 0,
      avgMovement: accAnalysis?.avgMovement ?? 0,
    }
  }, [accX, accY, accZ, accMagnitude, accAnalysis])

  if (!connected || !metrics) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📐</div>
        <div className="text-sm text-text-secondary">
          {connected ? '모션 데이터 수신 대기 중...' : 'Connect 버튼을 눌러 연결해주세요'}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'X축', value: metrics.lastX.toFixed(3), unit: 'g', color: 'bg-red-500' },
    { label: 'Y축', value: metrics.lastY.toFixed(3), unit: 'g', color: 'bg-green-500' },
    { label: 'Z축', value: metrics.lastZ.toFixed(3), unit: 'g', color: 'bg-blue-500' },
    { label: 'Magnitude', value: metrics.lastMag.toFixed(3), unit: 'g', color: 'bg-yellow-500' },
    {
      label: '활동 상태',
      value: metrics.activityState,
      unit: '',
      color: metrics.activityState === 'stationary' ? 'bg-teal' : 'bg-coral',
    },
    { label: '안정도', value: `${metrics.stability}`, unit: '%', color: 'bg-purple-500' },
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

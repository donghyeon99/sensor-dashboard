import { AccRawChart } from './AccRawChart'
import { AccMagnitudeChart } from './AccMagnitudeChart'
import { MotionCards } from './MotionCards'

export function ACCVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">📐 ACC 가속도 분석</h2>
        <p className="text-text-secondary text-sm">헤드셋의 움직임과 자세를 실시간 모니터링합니다.</p>
      </div>

      {/* 3-axis raw */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">3축 가속도 (X / Y / Z)</h3>
        <p className="text-xs text-text-secondary mb-4">X, Y, Z 축 가속도 실시간 파형</p>
        <AccRawChart />
      </div>

      {/* Magnitude */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">합성 가속도 (Magnitude)</h3>
        <p className="text-xs text-text-secondary mb-4">√(x² + y² + z²) 움직임 강도 추이</p>
        <AccMagnitudeChart />
      </div>

      {/* Motion cards */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">📐 움직임 지표</h3>
        <p className="text-xs text-text-secondary mb-4">실시간 가속도 요약</p>
        <MotionCards />
      </div>
    </div>
  )
}

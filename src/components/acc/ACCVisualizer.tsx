import { AccRawChart } from './AccRawChart'
import { AccMagnitudeChart } from './AccMagnitudeChart'
import { MotionCards } from './MotionCards'

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-yellow/10 text-yellow text-[10px] font-mono border border-yellow/20">
      {text}
    </span>
  )
}

export function ACCVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-3">📐 ACC 가속도 분석</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          가속도계(Accelerometer)는 헤드셋의 움직임과 기울기를 측정합니다.
          <strong className="text-red-400"> X축</strong>(좌우),
          <strong className="text-green-400"> Y축</strong>(앞뒤),
          <strong className="text-blue-400"> Z축</strong>(상하) 3방향의 가속도를 g 단위로 측정합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="3축 (X, Y, Z)" />
          <InfoBadge text="25Hz 샘플링" />
          <InfoBadge text="단위: g (중력가속도)" />
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">3축 가속도 파형</h3>
        <p className="text-xs text-text-muted mb-4">
          정지 상태에서 Z축 ≈ -1g (중력), X/Y ≈ 0. 머리를 움직이면 각 축의 값이 변합니다
        </p>
        <AccRawChart />
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">합성 가속도 (Magnitude)</h3>
        <p className="text-xs text-text-muted mb-4">
          √(x² + y² + z²) — 모든 방향의 움직임을 하나의 값으로 합산. 정지 시 약 1g, 움직이면 변동
        </p>
        <AccMagnitudeChart />
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">📐 움직임 분석</h3>
        <p className="text-xs text-text-muted mb-4">
          실시간 가속도 요약 및 활동 상태(정지/움직임) 분석 결과
        </p>
        <MotionCards />
      </div>
    </div>
  )
}

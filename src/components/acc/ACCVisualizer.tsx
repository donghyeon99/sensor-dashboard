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
        <h2 className="text-xl font-bold text-text-primary mb-3">📐 ACC Acceleration Analysis</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          The accelerometer measures the movement and tilt of the headset.
          <strong className="text-red-400"> X-axis</strong> (left/right),
          <strong className="text-green-400"> Y-axis</strong> (front/back),
          <strong className="text-blue-400"> Z-axis</strong> (up/down) — acceleration is measured along all three axes in units of g.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="3-axis (X, Y, Z)" />
          <InfoBadge text="25Hz sampling" />
          <InfoBadge text="Unit: g (gravitational acceleration)" />
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">3-Axis Acceleration Waveform</h3>
        <p className="text-xs text-text-muted mb-4">
          When stationary, Z-axis ≈ -1g (gravity), X/Y ≈ 0. Each axis value changes as you move your head
        </p>
        <AccRawChart />
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">Magnitude</h3>
        <p className="text-xs text-text-muted mb-4">
          √(x² + y² + z²) — combines movement from all directions into a single value. About 1g at rest, varies with movement
        </p>
        <AccMagnitudeChart />
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">📐 Movement Analysis</h3>
        <p className="text-xs text-text-muted mb-4">
          Real-time acceleration summary and activity state (stationary/moving) analysis
        </p>
        <MotionCards />
      </div>
    </div>
  )
}

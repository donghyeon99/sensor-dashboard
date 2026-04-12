import { AccRawChart } from './AccRawChart'
import { AccMagnitudeChart } from './AccMagnitudeChart'
import { MotionCards } from './MotionCards'
import { InfoBadge } from '../ui/InfoBadge'

export function ACCVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-metric-value mb-3">📐 ACC Acceleration Analysis</h2>
        <p className="text-metric-text text-sm leading-relaxed mb-3">
          The accelerometer measures the movement and tilt of the headset.
          <strong className="text-red-400"> X-axis</strong> (left/right),
          <strong className="text-green-400"> Y-axis</strong> (front/back),
          <strong className="text-blue-400"> Z-axis</strong> (up/down) — acceleration is measured along all three axes in units of g.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge color="yellow" text="3-axis (X, Y, Z)" />
          <InfoBadge color="yellow" text="25Hz sampling" />
          <InfoBadge color="yellow" text="Unit: g (gravitational acceleration)" />
        </div>
      </div>

      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-metric-value mb-4">3-Axis Acceleration Waveform</h3>
        <div className="text-sm text-metric-text mb-4">
          When stationary, Z-axis ≈ -1g (gravity), X/Y ≈ 0. Each axis value changes as you move your head
        </div>
        <AccRawChart />
      </div>

      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-metric-value mb-4">Magnitude</h3>
        <div className="text-sm text-metric-text mb-4">
          √(x² + y² + z²) — combines movement from all directions into a single value. About 1g at rest, varies with movement
        </div>
        <AccMagnitudeChart />
      </div>

      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-metric-value mb-4">📐 Movement Analysis</h3>
        <div className="text-sm text-metric-text mb-4">
          Real-time acceleration summary and activity state (stationary/moving) analysis
        </div>
        <MotionCards />
      </div>
    </div>
  )
}

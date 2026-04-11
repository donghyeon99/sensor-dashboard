import { PPGRawChart } from './PPGRawChart'
import { BpmChart } from './BpmChart'
import { SpO2Chart } from './SpO2Chart'
import { PPGMetricsCards } from './PPGMetricsCards'

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-coral/10 text-coral text-[10px] font-mono border border-coral/20">
      {text}
    </span>
  )
}

export function PPGVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-3">❤️ PPG Pulse Analysis</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          PPG (photoplethysmography) uses light to measure changes in blood flow.
          LinkBand measures heart rate and oxygen saturation using two light sources on the forehead: <strong className="text-purple">IR (infrared)</strong> and <strong className="text-coral">Red</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="2 light sources (IR, Red)" />
          <InfoBadge text="50Hz sampling" />
          <InfoBadge text="BPM + SpO2 + HRV" />
        </div>
      </div>

      {/* PPG Raw */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">PPG Raw Signal</h3>
        <p className="text-xs text-text-muted mb-4">
          IR (infrared) — detects deep vascular blood flow | Red — detects surface blood flow. Oxygen saturation is computed from the ratio of the two signals
        </p>
        <PPGRawChart />
      </div>

      {/* BPM | SpO2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">💓 Heart Rate (BPM) Trend</h3>
          <p className="text-xs text-text-muted mb-4">
            BPM = Beats Per Minute. Normal range: 60~100 BPM
          </p>
          <BpmChart />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🫁 Oxygen Saturation (SpO2) Trend</h3>
          <p className="text-xs text-text-muted mb-4">
            SpO2 = blood oxygen concentration (%). Normal: 95% or higher. Below 95% indicates low oxygen
          </p>
          <SpO2Chart />
        </div>
      </div>

      {/* Metrics + HRV */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">❤️ Cardiovascular Metrics</h3>
        <p className="text-xs text-text-muted mb-4">
          Real-time heart rate, oxygen saturation, and HRV (heart rate variability) summary.
          HRV is the variability between heartbeats — higher values indicate a healthier autonomic nervous system
        </p>
        <PPGMetricsCards />
      </div>
    </div>
  )
}

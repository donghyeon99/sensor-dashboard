import { PPGFilteredChart } from './PPGFilteredChart'
import { PPGSQIChart } from './PPGSQIChart'
import { PPGLeadOffBanner } from './PPGLeadOffBanner'
import { PPGMetricsCards } from './PPGMetricsCards'

export function PPGVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-metric-value mb-2">💓 PPG Pulse Analysis</h2>
        <p className="text-metric-text">Real-time photoplethysmography signal processing and heart-rate variability visualization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">🔧 Filtered PPG Signal</h3>
          <div className="text-sm text-metric-text mb-4">
            Red/IR LED signals passed through a 0.5-5.0Hz bandpass filter to isolate the heart-beat pattern (DC removed).
          </div>
          <div className="w-full h-80">
            <PPGLeadOffBanner context="ppg-filter" className="mb-2" />
            <PPGFilteredChart />
          </div>
        </div>
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">📈 PPG Signal Quality Index (SQI)</h3>
          <div className="text-sm text-metric-text mb-4">Signal quality and electrode contact monitoring.</div>
          <div className="w-full h-80">
            <PPGLeadOffBanner context="ppg-sqi" className="mb-3" />
            <PPGSQIChart channel="ch1" />
          </div>
        </div>
      </div>

      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-metric-value mb-4">💓 Heart Rate Variability Metrics</h3>
        <div className="text-sm text-metric-text mb-4">Real-time PPG analysis — heart rate, HRV, stress, and 11 more indices</div>
        <div className="w-full space-y-6">
          <PPGLeadOffBanner context="ppg-hrv" size="md" className="mb-4" />
          <PPGMetricsCards />
        </div>
      </div>
    </div>
  )
}

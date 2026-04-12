import { RawDataChart } from './RawDataChart'
import { SignalQualityChart } from './SignalQualityChart'
import { PowerSpectrumChart } from './PowerSpectrumChart'
import { BandPowerCards } from './BandPowerCards'
import { IndexCards } from './IndexCards'
import { LeadOffBanner } from './LeadOffBanner'

export function EEGVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-metric-value mb-2">🧠 EEG Brain Wave Analysis</h2>
        <p className="text-metric-text">Real-time EEG signal processing and analysis visualization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">🔧 Ch1 Filtered EEG Signal (FP1)</h3>
          <div className="text-sm text-metric-text mb-4">Channel 1 (FP1) signal processing — 60Hz notch + 1-45Hz bandpass filter applied</div>
          <div className="w-full h-80">
            <LeadOffBanner only="ch1" className="mb-2" />
            <RawDataChart channel="ch1" />
          </div>
        </div>
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">🔧 Ch2 Filtered EEG Signal (FP2)</h3>
          <div className="text-sm text-metric-text mb-4">Channel 2 (FP2) signal processing — 60Hz notch + 1-45Hz bandpass filter applied</div>
          <div className="w-full h-80">
            <LeadOffBanner only="ch2" className="mb-2" />
            <RawDataChart channel="ch2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">📈 Ch1 Signal Quality Index (SQI)</h3>
          <div className="text-sm text-metric-text mb-4">Channel 1 (FP1) electrode contact and signal quality monitoring</div>
          <div className="w-full h-80">
            <SignalQualityChart channel="ch1" />
          </div>
        </div>
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">📈 Ch2 Signal Quality Index (SQI)</h3>
          <div className="text-sm text-metric-text mb-4">Channel 2 (FP2) electrode contact and signal quality monitoring</div>
          <div className="w-full h-80">
            <SignalQualityChart channel="ch2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">🌈 Power Spectrum (1-45Hz)</h3>
          <div className="text-sm text-metric-text mb-4">Ch1, Ch2 frequency-domain EEG signal analysis</div>
          <div className="w-full">
            <LeadOffBanner context="spectrum" className="mb-3" />
            <PowerSpectrumChart />
            <div className="mt-2 text-xs text-metric-muted text-center">Real-time power spectrum analysis • DFT</div>
            <div className="mt-2 flex justify-center space-x-4 text-xs">
              <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div><span className="text-metric-text">FP1 (Ch1)</span></div>
              <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div><span className="text-metric-text">FP2 (Ch2)</span></div>
            </div>
          </div>
        </div>
        <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-metric-value mb-4">🎯 Frequency Band Power</h3>
          <div className="text-sm text-metric-text mb-4">Real-time band-level power from Power Spectrum — Delta, Theta, Alpha, Beta, Gamma</div>
          <div className="w-full space-y-6">
            <LeadOffBanner context="band" size="md" className="mb-3" />
            <BandPowerCards />
          </div>
        </div>
      </div>

      <div className="bg-section-bg border border-section-border rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-metric-value mb-4">🧠 EEG Analysis Indices</h3>
        <div className="text-sm text-metric-text mb-4">Real-time EEG analysis — focus, relaxation, stress, and 4 more indices</div>
        <div className="w-full space-y-6">
          <LeadOffBanner context="index" size="md" className="mb-4" />
          <IndexCards />
        </div>
      </div>
    </div>
  )
}

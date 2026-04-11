import { RawDataChart } from './RawDataChart'
import { SignalQualityChart } from './SignalQualityChart'
import { PowerSpectrumChart } from './PowerSpectrumChart'
import { BandPowerCards } from './BandPowerCards'
import { IndexCards } from './IndexCards'
import { LeadOffBanner } from './LeadOffBanner'

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-teal/10 text-teal text-[10px] font-mono border border-teal/20">
      {text}
    </span>
  )
}

export function EEGVisualizer() {
  return (
    <div className="space-y-6">
      <LeadOffBanner />
      {/* Title + 설명 */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-3">🧠 EEG Brain Wave Analysis</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          EEG (electroencephalography) measures the brain's electrical activity.
          LinkBand records EEG using two electrodes on the forehead: <strong className="text-teal">FP1 (left)</strong> and <strong className="text-yellow">FP2 (right)</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="2 channels (FP1, FP2)" />
          <InfoBadge text="250Hz sampling" />
          <InfoBadge text="Frequency range: 1-45Hz" />
        </div>
      </div>

      {/* Ch1 Raw | Ch2 Raw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch1 Raw Signal (FP1)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">Real-time voltage waveform from the left forehead electrode (unit: μV)</p>
          <RawDataChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch2 Raw Signal (FP2)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">Real-time voltage waveform from the right forehead electrode (unit: μV)</p>
          <RawDataChart channel="ch2" />
        </div>
      </div>

      {/* SQI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch1 Signal Quality (SQI)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">
            SQI = Signal Quality Index. Indicates how well the electrode is contacting the skin. Closer to 100% is better
          </p>
          <SignalQualityChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch2 Signal Quality (SQI)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">
            SQI = Signal Quality Index. Indicates how well the electrode is contacting the skin. Closer to 100% is better
          </p>
          <SignalQualityChart channel="ch2" />
        </div>
      </div>

      {/* Power Spectrum | Band Power */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🌈 Power Spectrum</h3>
          <p className="text-xs text-text-muted mb-4">
            EEG decomposed by frequency. Shows which frequencies have the strongest activity (1~45Hz)
          </p>
          <PowerSpectrumChart />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🎯 Frequency Band Power</h3>
          <p className="text-xs text-text-muted mb-4">
            EEG split into 5 bands (Delta~Gamma). Compare Ch1 (left brain) and Ch2 (right brain)
          </p>
          <BandPowerCards />
        </div>
      </div>

      {/* EEG Index Cards */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">🧠 EEG Analysis Indices</h3>
        <p className="text-xs text-text-muted mb-4">
          State indicators computed from combinations of EEG frequencies. Each index's color reflects the current state
        </p>
        <IndexCards />
      </div>
    </div>
  )
}

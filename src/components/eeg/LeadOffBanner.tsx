import { useSensorDataStore } from '../../stores/sensorDataStore'

export function LeadOffBanner() {
  const rawLeadOff = useSensorDataStore((s) => s.eegRawLeadOff)
  const eegAnalysis = useSensorDataStore((s) => s.eegAnalysis)

  const ch1Off = rawLeadOff.ch1 || eegAnalysis?.ch1LeadOff === true
  const ch2Off = rawLeadOff.ch2 || eegAnalysis?.ch2LeadOff === true

  if (!ch1Off && !ch2Off) return null

  return (
    <div className="w-full rounded-2xl border border-coral/30 bg-coral/10 p-4 flex items-start gap-3">
      <div className="text-2xl leading-none shrink-0">⚠️</div>
      <div className="flex-1 min-w-0">
        <div className="text-coral text-base font-bold mb-1">Sensor Contact Issue</div>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          The LinkBand headband is not properly contacting your forehead. The displayed EEG values are not reliable.
        </p>
        <div className="text-xs font-mono text-coral">
          Channels: Ch1 {ch1Off ? '❌' : '✅'} · Ch2 {ch2Off ? '❌' : '✅'}
        </div>
      </div>
    </div>
  )
}

// Design Ref: §3.4 D6 — 4-level signal quality based on leadOff + SQI average
import { useConnectionStore } from '../stores/connectionStore'
import { useEegStore } from '../stores/slices/eegStore'

export type SignalQuality = 'excellent' | 'good' | 'warning' | 'bad'

export function useSignalQuality(): SignalQuality | null {
  const connected = useConnectionStore((s) => s.connected)
  const sqCh1 = useEegStore((s) => s.sqCh1)
  const leadOff = useEegStore((s) => s.rawLeadOff)
  const eegAnalysis = useEegStore((s) => s.analysis)

  if (!connected) return null

  const ch1Off = leadOff.ch1 || eegAnalysis?.ch1LeadOff === true
  const ch2Off = leadOff.ch2 || eegAnalysis?.ch2LeadOff === true
  if (ch1Off || ch2Off) return 'bad'

  const recent = sqCh1.slice(-50)
  if (recent.length === 0) return null

  const avg = recent.reduce((a, b) => a + b.value, 0) / recent.length
  if (avg >= 80) return 'excellent'
  if (avg >= 60) return 'good'
  return 'warning'
}

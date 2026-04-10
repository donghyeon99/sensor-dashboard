import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

export function PPGMetricsCards() {
  const ppgAnalysis = useSensorDataStore((s) => s.ppgAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !ppgAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">❤️</div>
        <div className="text-sm text-text-secondary">데이터 대기 중...</div>
      </div>
    )
  }

  const bpm = ppgAnalysis.bpm
  const spo2 = ppgAnalysis.spo2

  const bpmStatus = bpm < 60 ? { color: 'text-yellow-400', msg: 'Below Normal' }
    : bpm > 100 ? { color: 'text-red-400', msg: 'Elevated' }
    : { color: 'text-green-400', msg: 'Normal' }

  const spo2Status = spo2 == null ? { color: 'text-text-muted', msg: '측정 불가' }
    : spo2 < 95 ? { color: 'text-red-400', msg: '저산소' }
    : { color: 'text-green-400', msg: 'Normal' }

  const beatDuration = bpm > 0 ? `${60 / bpm}s` : '1s'

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* BPM Card */}
      <div className="bg-bg-elevated border border-border rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className="text-3xl inline-block origin-center"
            style={{ animation: bpm > 0 ? `heartbeat ${beatDuration} ease-in-out infinite` : 'none' }}
          >
            ❤️
          </span>
          <span className="text-5xl font-extrabold font-mono text-text-primary tracking-tighter">
            {bpm > 0 ? Math.round(bpm) : '--'}
          </span>
        </div>
        <div className="text-sm font-semibold tracking-wider uppercase text-text-secondary">BPM</div>
        <div className={`text-xs font-medium mt-2 ${bpmStatus.color}`}>{bpmStatus.msg}</div>
      </div>

      {/* SpO2 Card */}
      <div className="bg-bg-elevated border border-border rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl">🫁</span>
          <span className="text-5xl font-extrabold font-mono text-teal tracking-tighter">
            {spo2 != null ? spo2.toFixed(1) : '--'}
          </span>
        </div>
        <div className="text-sm font-semibold tracking-wider uppercase text-text-secondary">SpO2 %</div>
        <div className={`text-xs font-medium mt-2 ${spo2Status.color}`}>{spo2Status.msg}</div>
      </div>
    </div>
  )
}

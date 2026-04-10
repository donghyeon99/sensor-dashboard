import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

export function PPGMetricsCards() {
  const ppgAnalysis = useSensorDataStore((s) => s.ppgAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !ppgAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">❤️</div>
        <div className="text-sm text-text-secondary">
          {connected ? '데이터 수신 대기 중...' : '디바이스를 연결해주세요'}
        </div>
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
    <div className="space-y-4">
      {/* BPM + SpO2 */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* HRV Metrics */}
      <div className="rounded-xl border border-border bg-bg-elevated/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-text-primary">HRV (심박변이도)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple/10 text-purple border border-purple/20 font-mono">Heart Rate Variability</span>
        </div>
        <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
          심박 간격의 변동성을 나타내는 지표입니다. HRV가 높을수록 자율신경계가 유연하고 건강한 상태입니다.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-text-secondary">SDNN</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {ppgAnalysis.sdnn != null ? ppgAnalysis.sdnn.toFixed(1) : '--'}
              <span className="text-xs text-text-muted ml-1 font-normal">ms</span>
            </div>
            <div className="text-[10px] text-text-muted mt-1">심박 간격의 표준편차</div>
          </div>

          <div className="bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-xs font-semibold text-text-secondary">RMSSD</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {ppgAnalysis.rmssd != null ? ppgAnalysis.rmssd.toFixed(1) : '--'}
              <span className="text-xs text-text-muted ml-1 font-normal">ms</span>
            </div>
            <div className="text-[10px] text-text-muted mt-1">연속 심박 간격 변이</div>
          </div>

          <div className="bg-bg-base rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs font-semibold text-text-secondary">Stress</span>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono">
              {ppgAnalysis.stressIndex != null ? ppgAnalysis.stressIndex.toFixed(2) : '--'}
            </div>
            <div className="text-[10px] text-text-muted mt-1">PPG 기반 스트레스</div>
          </div>
        </div>
      </div>
    </div>
  )
}

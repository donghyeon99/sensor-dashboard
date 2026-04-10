import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

interface IndexDef {
  label: string
  key: keyof NonNullable<ReturnType<typeof useSensorDataStore.getState>['eegAnalysis']>
  unit: string
  color: string
  getStatus: (v: number) => { color: string; message: string }
}

const indices: IndexDef[] = [
  {
    label: '이완및긴장도', key: 'relaxationIndex', unit: '', color: 'bg-green-500',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '긴장 상태' } : v > 0.7 ? { color: 'text-blue-400', message: '깊은 이완' } : { color: 'text-green-400', message: '정상 범위' },
  },
  {
    label: '정서안정성', key: 'emotionalBalance', unit: '', color: 'bg-pink-500',
    getStatus: (v) => v < 0.35 ? { color: 'text-yellow-400', message: '정서 불안정' } : v > 0.65 ? { color: 'text-blue-400', message: '정서 안정' } : { color: 'text-green-400', message: '균형 상태' },
  },
  {
    label: '집중력', key: 'attention', unit: '', color: 'bg-blue-500',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '주의력 결핍' } : v > 0.7 ? { color: 'text-red-400', message: '높은 집중' } : { color: 'text-green-400', message: '정상 범위' },
  },
  {
    label: '스트레스', key: 'stressIndex', unit: '', color: 'bg-red-500',
    getStatus: (v) => v < 0.3 ? { color: 'text-green-400', message: '낮은 스트레스' } : v > 0.7 ? { color: 'text-red-400', message: '높은 스트레스' } : { color: 'text-yellow-400', message: '보통' },
  },
  {
    label: '신경활동성', key: 'totalPower', unit: 'dB', color: 'bg-purple-500',
    getStatus: (v) => v > 50 ? { color: 'text-red-400', message: '과도한 활동' } : v < 10 ? { color: 'text-yellow-400', message: '억제된 활동' } : { color: 'text-green-400', message: '정상 범위' },
  },
  {
    label: '인지 부하', key: 'cognitiveLoad', unit: '', color: 'bg-yellow-500',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '낮은 참여도' } : v > 0.7 ? { color: 'text-red-400', message: '과부하' } : { color: 'text-green-400', message: '최적 부하' },
  },
  {
    label: '명상 수준', key: 'meditationLevel', unit: '', color: 'bg-cyan-500',
    getStatus: (v) => v < 0.3 ? { color: 'text-text-muted', message: '비명상' } : v > 0.7 ? { color: 'text-purple-400', message: '깊은 명상' } : { color: 'text-green-400', message: '가벼운 이완' },
  },
]

export function IndexCards() {
  const eegAnalysis = useSensorDataStore((s) => s.eegAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !eegAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🧠</div>
        <div className="text-sm text-text-secondary">데이터 대기 중...</div>
        <div className="text-xs text-text-muted mt-1">연결 후 뇌파 분석 지수를 확인할 수 있습니다</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top row: 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.slice(0, 4).map((idx) => {
          const value = eegAnalysis[idx.key] as number
          const status = idx.getStatus(value)
          return (
            <div key={idx.key} className="bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${idx.color}`} />
                <span className="text-sm font-medium text-text-secondary">{idx.label}</span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1 font-mono">
                {value.toFixed(2)}
                <span className="text-sm text-text-muted ml-1">{idx.unit}</span>
              </div>
              <div className={`text-xs font-medium ${status.color}`}>{status.message}</div>
            </div>
          )
        })}
      </div>
      {/* Bottom row: 3 cards */}
      <div className="grid grid-cols-3 gap-3">
        {indices.slice(4).map((idx) => {
          const value = eegAnalysis[idx.key] as number
          const status = idx.getStatus(value)
          return (
            <div key={idx.key} className="bg-bg-elevated border border-border rounded-lg p-4 hover:bg-bg-hover transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${idx.color}`} />
                <span className="text-sm font-medium text-text-secondary">{idx.label}</span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1 font-mono">
                {value.toFixed(2)}
                <span className="text-sm text-text-muted ml-1">{idx.unit}</span>
              </div>
              <div className={`text-xs font-medium ${status.color}`}>{status.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

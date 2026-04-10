import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

interface IndexDef {
  label: string
  key: keyof NonNullable<ReturnType<typeof useSensorDataStore.getState>['eegAnalysis']>
  unit: string
  color: string
  desc: string
  basis: string
  getStatus: (v: number) => { color: string; message: string }
}

const indices: IndexDef[] = [
  {
    label: '이완/긴장도', key: 'relaxationIndex', unit: '', color: 'bg-green-500',
    desc: '알파파(8-13Hz) 기반 — 눈을 감고 편안할 때 올라감',
    basis: 'Alpha 파워 비율',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '긴장 상태' } : v > 0.7 ? { color: 'text-blue-400', message: '깊은 이완' } : { color: 'text-green-400', message: '정상' },
  },
  {
    label: '정서 안정성', key: 'emotionalBalance', unit: '', color: 'bg-pink-500',
    desc: '좌/우 뇌 활성 비대칭 — 0.5가 균형 상태',
    basis: 'FP1/FP2 비대칭',
    getStatus: (v) => v < 0.35 ? { color: 'text-yellow-400', message: '불안정' } : v > 0.65 ? { color: 'text-blue-400', message: '안정' } : { color: 'text-green-400', message: '균형' },
  },
  {
    label: '집중력', key: 'attention', unit: '', color: 'bg-blue-500',
    desc: '베타파(13-30Hz) 기반 — 공부나 문제 풀 때 올라감',
    basis: 'Beta 파워 비율',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '주의력 낮음' } : v > 0.7 ? { color: 'text-blue-400', message: '높은 집중' } : { color: 'text-green-400', message: '정상' },
  },
  {
    label: '스트레스', key: 'stressIndex', unit: '', color: 'bg-red-500',
    desc: '고베타파(20-30Hz) 기반 — 긴장/불안 시 올라감',
    basis: 'High-Beta 우세',
    getStatus: (v) => v < 0.3 ? { color: 'text-green-400', message: '낮음' } : v > 0.7 ? { color: 'text-red-400', message: '높음' } : { color: 'text-yellow-400', message: '보통' },
  },
  {
    label: '신경 활동성', key: 'totalPower', unit: 'dB', color: 'bg-purple-500',
    desc: '전체 뇌파 세기의 합 — 뇌의 전반적 활성도',
    basis: '전 대역 합산',
    getStatus: (v) => v > 50 ? { color: 'text-red-400', message: '과활성' } : v < 10 ? { color: 'text-yellow-400', message: '저활성' } : { color: 'text-green-400', message: '정상' },
  },
  {
    label: '인지 부하', key: 'cognitiveLoad', unit: '', color: 'bg-yellow-500',
    desc: '세타/알파 비율 — 어려운 과제를 수행할 때 올라감',
    basis: 'Theta/Alpha 비율',
    getStatus: (v) => v < 0.3 ? { color: 'text-yellow-400', message: '낮은 참여' } : v > 0.7 ? { color: 'text-red-400', message: '과부하' } : { color: 'text-green-400', message: '최적' },
  },
  {
    label: '명상 수준', key: 'meditationLevel', unit: '', color: 'bg-cyan-500',
    desc: '세타+알파파 기반 — 명상/깊은 이완 시 올라감',
    basis: 'Theta + Alpha',
    getStatus: (v) => v < 0.3 ? { color: 'text-text-muted', message: '비명상' } : v > 0.7 ? { color: 'text-purple-400', message: '깊은 명상' } : { color: 'text-green-400', message: '가벼운 이완' },
  },
]

function IndexCard({ idx, value }: { idx: IndexDef; value: number }) {
  const status = idx.getStatus(value)
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 hover:bg-bg-hover transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${idx.color}`} />
          <span className="text-sm font-semibold text-text-primary">{idx.label}</span>
        </div>
        <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 bg-bg-base rounded">{idx.basis}</span>
      </div>
      <div className="text-3xl font-extrabold text-text-primary mb-1 font-mono tracking-tight">
        {value.toFixed(2)}
        {idx.unit && <span className="text-sm text-text-muted ml-1 font-normal">{idx.unit}</span>}
      </div>
      <div className={`text-xs font-semibold mb-2 ${status.color}`}>{status.message}</div>
      <div className="text-[11px] text-text-muted leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
        {idx.desc}
      </div>
    </div>
  )
}

export function IndexCards() {
  const eegAnalysis = useSensorDataStore((s) => s.eegAnalysis)
  const connected = useConnectionStore((s) => s.connected)

  if (!connected || !eegAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🧠</div>
        <div className="text-sm text-text-secondary">
          {connected ? '분석 지수 데이터 수신 대기 중...' : 'Connect 버튼을 눌러 연결해주세요'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.slice(0, 4).map((idx) => (
          <IndexCard key={idx.key} idx={idx} value={eegAnalysis[idx.key] as number} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {indices.slice(4).map((idx) => (
          <IndexCard key={idx.key} idx={idx} value={eegAnalysis[idx.key] as number} />
        ))}
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

const BANDS = [
  { key: 'delta', name: '델타파', range: '1-4Hz', color: 'bg-amber-600', min: 1, max: 4, desc: '깊은 수면' },
  { key: 'theta', name: '세타파', range: '4-8Hz', color: 'bg-orange-500', min: 4, max: 8, desc: '졸음/명상' },
  { key: 'alpha', name: '알파파', range: '8-13Hz', color: 'bg-green-500', min: 8, max: 13, desc: '이완/안정' },
  { key: 'beta', name: '베타파', range: '13-30Hz', color: 'bg-blue-500', min: 13, max: 30, desc: '집중/사고' },
  { key: 'gamma', name: '감마파', range: '30-45Hz', color: 'bg-purple-500', min: 30, max: 45, desc: '고도 인지' },
]

function computeBandPower(data: { value: number }[], sampleRate: number, fMin: number, fMax: number): { ch: number } {
  if (data.length < 64) return { ch: 0 }
  const N = Math.min(256, data.length)
  const samples = data.slice(-N).map((p) => p.value)
  let power = 0, count = 0
  for (let freq = fMin; freq <= fMax; freq++) {
    let realSum = 0, imagSum = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * freq * n) / sampleRate
      realSum += samples[n] * Math.cos(angle)
      imagSum -= samples[n] * Math.sin(angle)
    }
    const mag = Math.sqrt(realSum * realSum + imagSum * imagSum) / N
    power += mag > 0 ? 20 * Math.log10(mag + 1) : 0
    count++
  }
  return { ch: count > 0 ? power / count : 0 }
}

export function BandPowerCards() {
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const connected = useConnectionStore((s) => s.connected)

  const bandData = useMemo(() => {
    if (fp1.length < 64) return null
    const results = BANDS.map((band) => {
      const ch1 = computeBandPower(fp1, 250, band.min, band.max)
      const ch2 = computeBandPower(fp2, 250, band.min, band.max)
      return { ...band, ch1: ch1.ch, ch2: ch2.ch, combined: (ch1.ch + ch2.ch) / 2 }
    })
    const maxPower = Math.max(...results.map((r) => Math.max(r.ch1, r.ch2)), 1)
    return results.map((r) => ({
      ...r,
      normalizedCh1: (r.ch1 / maxPower) * 100,
      normalizedCh2: (r.ch2 / maxPower) * 100,
      normalizedCombined: (r.combined / maxPower) * 100,
    }))
  }, [fp1, fp2])

  if (!connected || !bandData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🧠</div>
        <div className="text-sm text-text-secondary">
          {connected ? '밴드 파워 데이터 수신 대기 중...' : 'Connect 버튼을 눌러 연결해주세요'}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {bandData.map((band) => (
        <div key={band.key} className="bg-bg-elevated/50 border border-border rounded-xl p-3 hover:bg-bg-elevated/70 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-2.5 h-2.5 rounded-full ${band.color}`} />
            <span className="text-[10px] text-text-muted">dB</span>
          </div>

          {/* Combined power bar */}
          <div className="mb-2">
            <div className="text-[10px] text-text-muted mb-1">전체</div>
            <div className="h-8 bg-bg-base rounded relative overflow-hidden">
              <div className={`absolute bottom-0 left-0 right-0 ${band.color} opacity-80 rounded transition-all duration-300`} style={{ height: `${band.normalizedCombined}%` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white drop-shadow-lg">{band.combined.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Per-channel bars */}
          <div className="space-y-1 mb-2">
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-blue-300">Ch1</span>
                <span className="text-[10px] text-text-muted">{band.ch1.toFixed(1)}</span>
              </div>
              <div className="h-5 bg-bg-base rounded-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-80 rounded-sm transition-all duration-300" style={{ height: `${band.normalizedCh1}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-red-300">Ch2</span>
                <span className="text-[10px] text-text-muted">{band.ch2.toFixed(1)}</span>
              </div>
              <div className="h-5 bg-bg-base rounded-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 opacity-80 rounded-sm transition-all duration-300" style={{ height: `${band.normalizedCh2}%` }} />
              </div>
            </div>
          </div>

          <div className="text-sm font-semibold text-text-primary">{band.name}</div>
          <div className="text-[10px] text-text-muted">{band.range} · {band.desc}</div>
          <div className="text-[10px] text-cyan-300 mt-1">좌우 차이: {Math.abs(band.ch1 - band.ch2).toFixed(1)} dB</div>
        </div>
      ))}
    </div>
  )
}

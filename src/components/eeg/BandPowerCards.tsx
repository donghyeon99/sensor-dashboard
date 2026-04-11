import { useMemo } from 'react'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'
import { computeEegPower, EEG_BANDS } from '../../lib/eegPower'

const BAND_META: Record<typeof EEG_BANDS[number]['key'], { name: string; range: string; color: string; desc: string }> = {
  delta: { name: 'Delta', range: '1-4Hz', color: 'bg-amber-600', desc: 'Deep sleep' },
  theta: { name: 'Theta', range: '4-8Hz', color: 'bg-orange-500', desc: 'Drowsy/meditation' },
  alpha: { name: 'Alpha', range: '8-13Hz', color: 'bg-green-500', desc: 'Relaxed/calm' },
  beta: { name: 'Beta', range: '13-30Hz', color: 'bg-blue-500', desc: 'Focused/thinking' },
  gamma: { name: 'Gamma', range: '30-45Hz', color: 'bg-purple-500', desc: 'High cognition' },
}

export function BandPowerCards() {
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const connected = useConnectionStore((s) => s.connected)

  const bandData = useMemo(() => {
    const computed = computeEegPower(fp1, fp2, 250)
    if (!computed) return null
    const results = EEG_BANDS.map((band) => {
      const b = computed.bands[band.key]
      const meta = BAND_META[band.key]
      return {
        key: band.key,
        ...meta,
        ch1: b.ch1Db,
        ch2: b.ch2Db,
        combined: (b.ch1Db + b.ch2Db) / 2,
      }
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
          {connected ? 'Waiting for band power data...' : 'Press the Connect button to connect'}
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
            <div className="text-[10px] text-text-muted mb-1">Total</div>
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
          <div className="text-[10px] text-cyan-300 mt-1">L/R diff: {Math.abs(band.ch1 - band.ch2).toFixed(1)} dB</div>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useEegStore } from '../../stores/slices/eegStore'
import { useConnectionStore } from '../../stores/connectionStore'
import { computeEegPower, EEG_BANDS } from '../../lib/dsp/spectrum'

const BAND_META: Record<typeof EEG_BANDS[number]['key'], { name: string; range: string; color: string; desc: string }> = {
  delta: { name: 'Delta', range: '1-4Hz', color: 'bg-amber-600', desc: 'Deep sleep' },
  theta: { name: 'Theta', range: '4-8Hz', color: 'bg-orange-500', desc: 'Drowsy/meditation' },
  alpha: { name: 'Alpha', range: '8-13Hz', color: 'bg-green-500', desc: 'Relaxed/calm' },
  beta: { name: 'Beta', range: '13-30Hz', color: 'bg-blue-500', desc: 'Focused/thinking' },
  gamma: { name: 'Gamma', range: '30-45Hz', color: 'bg-purple-500', desc: 'High cognition' }, // matches linkband UI gamma cap

}

// Throttle Morlet recompute — it's ~1M+ ops per call and would burn the main thread
// if run on every SSE packet (≥10Hz). 300ms matches a comfortable visual update rate.
const BAND_RECOMPUTE_MS = 300

type BandRow = {
  key: typeof EEG_BANDS[number]['key']
  name: string
  range: string
  color: string
  desc: string
  ch1: number
  ch2: number
  combined: number
  normalizedCh1: number
  normalizedCh2: number
  normalizedCombined: number
}

export function BandPowerCards() {
  const connected = useConnectionStore((s) => s.connected)
  const [bandData, setBandData] = useState<BandRow[] | null>(null)
  const lastComputeRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const now = performance.now()
      if (now - lastComputeRef.current >= BAND_RECOMPUTE_MS) {
        lastComputeRef.current = now
        const { fp1Raw, fp2Raw } = useEegStore.getState()
        const computed = computeEegPower(fp1Raw, fp2Raw, 250)
        if (computed) {
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
          setBandData(
            results.map((r) => ({
              ...r,
              normalizedCh1: (r.ch1 / maxPower) * 100,
              normalizedCh2: (r.ch2 / maxPower) * 100,
              normalizedCombined: (r.combined / maxPower) * 100,
            })),
          )
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!connected || !bandData) {
    return (
      <div className="text-center text-metric-muted text-sm py-8">
        {connected ? 'Waiting for band power data...' : 'Press the Connect button to connect'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {bandData.map((band) => (
          <div
            key={band.key}
            className="bg-metric-bg/50 border border-metric-border rounded-lg p-3 hover:bg-metric-hover/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${band.color}`} />
              <span className="text-[10px] text-metric-muted">dB</span>
            </div>

            <div className="mb-2">
              <div className="text-[10px] text-metric-muted mb-1">Total</div>
              <div className="h-8 bg-metric-border rounded-md relative overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 right-0 ${band.color} opacity-80 rounded-md transition-all duration-300`}
                  style={{ height: `${band.normalizedCombined}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white drop-shadow-lg">{band.combined.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-2">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-blue-300">Ch1</span>
                  <span className="text-[10px] text-metric-muted">{band.ch1.toFixed(1)}</span>
                </div>
                <div className="h-6 bg-metric-border rounded-sm relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-80 rounded-sm transition-all duration-300"
                    style={{ height: `${band.normalizedCh1}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-red-300">Ch2</span>
                  <span className="text-[10px] text-metric-muted">{band.ch2.toFixed(1)}</span>
                </div>
                <div className="h-6 bg-metric-border rounded-sm relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-red-500 opacity-80 rounded-sm transition-all duration-300"
                    style={{ height: `${band.normalizedCh2}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-sm font-semibold text-metric-value">{band.name}</div>
            <div className="text-[10px] text-metric-muted">{band.range} · {band.desc}</div>
            <div className="text-[10px] text-cyan-300 mt-1">L/R diff: {Math.abs(band.ch1 - band.ch2).toFixed(1)} dB</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-metric-muted text-center mt-2">Real-time frequency band analysis from Power Spectrum</div>
    </div>
  )
}

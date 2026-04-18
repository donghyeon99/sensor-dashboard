import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildSpectrumOption } from '../../lib/charts/optionBuilders'
import { computeSpectrum } from '../../lib/dsp/spectrum'
import { useEegStore } from '../../stores/slices/eegStore'

// Throttle DFT recompute and apply EMA across frames so the spectrum line
// transitions smoothly instead of bouncing on every sample update.
const RECOMPUTE_MS = 250
const EMA_ALPHA = 0.25 // lower = smoother (0.25 → ~75% prior, 25% new)

type Spectrum = [number, number][]

function emaSpectrum(prev: Spectrum | null, next: Spectrum, alpha: number): Spectrum {
  if (!prev || prev.length !== next.length) return next
  const out: Spectrum = new Array(next.length)
  for (let i = 0; i < next.length; i++) {
    const prevDb = prev[i][1]
    const nextDb = next[i][1]
    out[i] = [next[i][0], prevDb + alpha * (nextDb - prevDb)]
  }
  return out
}

export function PowerSpectrumChart() {
  const [smoothed, setSmoothed] = useState<{ ch1: Spectrum; ch2: Spectrum; hasData: boolean }>({
    ch1: [],
    ch2: [],
    hasData: false,
  })
  const lastComputeRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const ch1Ref = useRef<Spectrum | null>(null)
  const ch2Ref = useRef<Spectrum | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const now = performance.now()
      if (now - lastComputeRef.current >= RECOMPUTE_MS) {
        lastComputeRef.current = now
        const { fp1, fp2 } = useEegStore.getState()
        const ch1Raw = computeSpectrum(
          fp1.map((p) => p.value),
          250,
          1,
          45,
          'spectrum_ch1',
        )
        const ch2Raw = computeSpectrum(
          fp2.map((p) => p.value),
          250,
          1,
          45,
          'spectrum_ch2',
        )
        if (ch1Raw.length > 0) {
          ch1Ref.current = emaSpectrum(ch1Ref.current, ch1Raw, EMA_ALPHA)
          ch2Ref.current = emaSpectrum(ch2Ref.current, ch2Raw, EMA_ALPHA)
          setSmoothed({ ch1: ch1Ref.current, ch2: ch2Ref.current ?? [], hasData: true })
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

  const option = useMemo(
    () =>
      buildSpectrumOption({
        series: [
          { name: 'FP1 (Ch1)', color: '#3b82f6', area: true },
          { name: 'FP2 (Ch2)', color: '#ef4444', area: true },
        ],
        tooltipFormatter: (params: any) => {
          let result = `${params[0]?.value?.[0]?.toFixed(1)} Hz<br/>`
          params.forEach((p: any) => {
            result += `${p.seriesName}: ${p.value[1].toFixed(2)} dB<br/>`
          })
          return result
        },
      }),
    [],
  )

  return (
    <div className="relative">
      <BaseChart
        option={option}
        className="w-full h-72"
        updater={(chart) => {
          if (!smoothed.hasData) return
          chart.setOption({
            series: [{ data: smoothed.ch1 }, { data: smoothed.ch2 }],
          })
        }}
        deps={[smoothed]}
      />
    </div>
  )
}

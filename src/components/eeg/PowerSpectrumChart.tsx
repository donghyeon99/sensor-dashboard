import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildSpectrumOption } from '../../lib/charts/optionBuilders'
import { computeSpectrum } from '../../lib/dsp/spectrum'
import { useEegStore } from '../../stores/slices/eegStore'

export function PowerSpectrumChart() {
  const fp1 = useEegStore((s) => s.fp1)
  const fp2 = useEegStore((s) => s.fp2)

  const spectrum = useMemo(() => {
    const ch1 = computeSpectrum(fp1.map((p) => p.value), 250)
    const ch2 = computeSpectrum(fp2.map((p) => p.value), 250)
    return { ch1, ch2, hasData: ch1.length > 0 }
  }, [fp1, fp2])

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
          if (!spectrum.hasData) return
          chart.setOption({
            series: [{ data: spectrum.ch1 }, { data: spectrum.ch2 }],
          })
        }}
        deps={[spectrum]}
      />
    </div>
  )
}

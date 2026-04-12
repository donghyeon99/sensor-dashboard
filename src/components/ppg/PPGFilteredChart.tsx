import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildMultiLineOption } from '../../lib/charts/optionBuilders'
import { usePpgStore } from '../../stores/slices/ppgStore'

export function PPGFilteredChart() {
  const irFiltered = usePpgStore((s) => s.irFiltered)
  const redFiltered = usePpgStore((s) => s.redFiltered)

  const series = useMemo(
    () => ({
      ir: irFiltered.map((p, i) => [i, p.value]),
      red: redFiltered.map((p, i) => [i, p.value]),
      maxLen: Math.max(irFiltered.length, redFiltered.length, 1),
    }),
    [irFiltered, redFiltered],
  )

  const option = useMemo(
    () =>
      buildMultiLineOption({
        series: [
          { name: 'IR', color: '#a855f7' },
          { name: 'Red', color: '#ef4444' },
        ],
        yName: 'Filtered',
        yNameGap: 50,
        tooltipFormatter: (params: any) => {
          const idx = params[0]?.value?.[0]
          let result = `Sample #${idx}<br/>`
          params.forEach((p: any) => {
            result += `${p.seriesName} channel: ${p.value[1].toFixed(2)}<br/>`
          })
          result += `<br/><span style="color: #10b981;">0.5-5.0Hz bandpass filtered</span>`
          return result
        },
      }),
    [],
  )

  return (
    <div className="w-full h-full">
      <BaseChart
        option={option}
        updater={(chart) => {
          chart.setOption({
            xAxis: { min: 0, max: series.maxLen - 1 },
            series: [{ data: series.ir }, { data: series.red }],
          })
        }}
        deps={[series]}
      />
    </div>
  )
}

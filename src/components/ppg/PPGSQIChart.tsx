import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildRealtimeLineOption } from '../../lib/charts/optionBuilders'
import { usePpgStore } from '../../stores/slices/ppgStore'

export function PPGSQIChart() {
  const sqi = usePpgStore((s) => s.sqi)

  const chartData = useMemo(
    () => sqi.overallSQI.map((p, i) => [i, p.value]),
    [sqi.overallSQI],
  )

  const option = useMemo(
    () =>
      buildRealtimeLineOption({
        color: '#10b981',
        yName: '%',
        yMin: 0,
        yMax: 100,
        yNameGap: 35,
        area: true,
        tooltipFormatter: (params: any) => `PPG SQI: ${params[0]?.value?.[1]?.toFixed(1)}%`,
      }),
    [],
  )

  return (
    <div className="w-full h-full">
      <BaseChart
        option={option}
        updater={(chart) => {
          chart.setOption({
            xAxis: { min: 0, max: Math.max(chartData.length - 1, 1) },
            series: [{ data: chartData }],
          })
        }}
        deps={[chartData]}
      />
    </div>
  )
}

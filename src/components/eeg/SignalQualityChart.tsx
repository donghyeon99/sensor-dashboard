import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildRealtimeLineOption } from '../../lib/charts/optionBuilders'
import { useEegStore } from '../../stores/slices/eegStore'

interface Props {
  channel: 'ch1' | 'ch2'
}

export function SignalQualityChart({ channel }: Props) {
  const sqData = useEegStore((s) => (channel === 'ch1' ? s.sqCh1 : s.sqCh2))
  const color = channel === 'ch1' ? '#3b82f6' : '#ef4444'

  const chartData = useMemo(() => sqData.map((p, i) => [i, p.value]), [sqData])

  const option = useMemo(
    () =>
      buildRealtimeLineOption({
        color,
        yName: '%',
        yMin: 0,
        yMax: 100,
        yNameGap: 35,
        area: true,
        tooltipFormatter: (params: any) =>
          `SQI: ${params[0]?.value?.[1]?.toFixed(1)}%`,
      }),
    [color],
  )

  return (
    <div className="relative w-full h-full">
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

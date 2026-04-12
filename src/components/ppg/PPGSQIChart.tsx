import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildRealtimeLineOption } from '../../lib/charts/optionBuilders'
import { useEegStore } from '../../stores/slices/eegStore'

interface Props {
  channel: 'ch1' | 'ch2'
}

export function PPGSQIChart({ channel }: Props) {
  const sqCh1 = useEegStore((s) => s.sqCh1)
  const sqCh2 = useEegStore((s) => s.sqCh2)
  const data = channel === 'ch1' ? sqCh1 : sqCh2
  const color = channel === 'ch1' ? '#10b981' : '#f59e0b'

  const chartData = useMemo(() => data.map((p, i) => [i, p.value]), [data])

  const option = useMemo(
    () =>
      buildRealtimeLineOption({
        color,
        yName: '%',
        yMin: 0,
        yMax: 100,
        yNameGap: 35,
        area: true,
        tooltipFormatter: (params: any) => `SQI: ${params[0]?.value?.[1]?.toFixed(1)}%`,
      }),
    [color],
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

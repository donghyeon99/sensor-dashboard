import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildRealtimeLineOption } from '../../lib/charts/optionBuilders'
import { useEegStore } from '../../stores/slices/eegStore'

interface Props {
  channel: 'ch1' | 'ch2'
}

export function RawDataChart({ channel }: Props) {
  // Subscribe ONLY to the channel this chart renders — avoids cross-channel re-renders.
  const data = useEegStore((s) => (channel === 'ch1' ? s.fp1 : s.fp2))
  const color = channel === 'ch1' ? '#3b82f6' : '#ef4444'
  const label = channel === 'ch1' ? 'FP1 (Ch1)' : 'FP2 (Ch2)'

  const chartData = useMemo(() => data.map((p, i) => [i, p.value]), [data])

  const option = useMemo(
    () =>
      buildRealtimeLineOption({
        color,
        yName: 'μV',
        yMin: -150,
        yMax: 150,
        yInterval: 50,
        yNameGap: 50,
        sampling: 'lttb',
        tooltipFormatter: (params: any) =>
          `${label}: ${params[0]?.value?.[1]?.toFixed(2)} μV`,
      }),
    [color, label],
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

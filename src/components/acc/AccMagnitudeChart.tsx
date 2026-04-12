import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildRealtimeLineOption } from '../../lib/charts/optionBuilders'
import { useAccStore } from '../../stores/slices/accStore'
import { EmptyState } from '../layout/EmptyState'

export function AccMagnitudeChart() {
  const magnitude = useAccStore((s) => s.magnitude)

  const chartData = useMemo(() => magnitude.map((p, i) => [i, p.value]), [magnitude])

  const option = useMemo(
    () =>
      buildRealtimeLineOption({
        color: '#facc15',
        yName: 'g',
        area: true,
        smooth: true,
        tooltipFormatter: (params: any) => `${params[0]?.value?.[1]?.toFixed(3)} g`,
      }),
    [],
  )

  return (
    <div className="relative w-full h-64">
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
      {magnitude.length === 0 && <EmptyState icon="📐" label="Magnitude" />}
    </div>
  )
}

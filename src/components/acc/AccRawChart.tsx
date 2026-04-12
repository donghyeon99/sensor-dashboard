import { useMemo } from 'react'
import { BaseChart } from '../../lib/charts/BaseChart'
import { buildMultiLineOption } from '../../lib/charts/optionBuilders'
import { useAccStore } from '../../stores/slices/accStore'
import { EmptyState } from '../layout/EmptyState'

export function AccRawChart() {
  const accX = useAccStore((s) => s.x)
  const accY = useAccStore((s) => s.y)
  const accZ = useAccStore((s) => s.z)

  const series = useMemo(
    () => ({
      x: accX.map((p, i) => [i, p.value]),
      y: accY.map((p, i) => [i, p.value]),
      z: accZ.map((p, i) => [i, p.value]),
      maxLen: Math.max(accX.length, accY.length, accZ.length, 1),
    }),
    [accX, accY, accZ],
  )

  const option = useMemo(
    () =>
      buildMultiLineOption({
        series: [
          { name: 'X', color: '#ef4444' },
          { name: 'Y', color: '#4ade80' },
          { name: 'Z', color: '#3b82f6' },
        ],
        yName: 'g',
      }),
    [],
  )

  return (
    <div className="relative w-full h-64">
      <BaseChart
        option={option}
        updater={(chart) => {
          chart.setOption({
            xAxis: { min: 0, max: series.maxLen - 1 },
            series: [{ data: series.x }, { data: series.y }, { data: series.z }],
          })
        }}
        deps={[series]}
      />
      {accX.length === 0 && <EmptyState icon="📐" label="ACC" />}
    </div>
  )
}

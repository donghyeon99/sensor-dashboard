// Design Ref: §3.4 D4 — standardizes echarts lifecycle across all chart components
import { useEffect, useRef } from 'react'
import { echarts, type EChartsOption, type ECharts } from './echartsRegistry'

interface BaseChartProps {
  /** Initial option (applied once on mount). */
  option: EChartsOption
  /** Called with the chart instance whenever `deps` changes — return nothing or call setOption inside. */
  updater?: (chart: ECharts) => void
  /** Dependency array that triggers the updater. */
  deps?: React.DependencyList
  className?: string
}

export function BaseChart({ option, updater, deps, className = 'w-full h-full' }: BaseChartProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const chart = echarts.init(hostRef.current)
    chartRef.current = chart
    chart.setOption(option)
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chartRef.current || !updater) return
    updater(chartRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? [])

  return <div ref={hostRef} className={className} />
}

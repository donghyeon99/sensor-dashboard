import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { EmptyState } from '../layout/EmptyState'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  channel: 'ch1' | 'ch2'
}

export function SignalQualityChart({ channel }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const sqData = useSensorDataStore((s) => s.eegSignalQuality)
  const color = channel === 'ch1' ? '#10b981' : '#f59e0b'

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `SQI: ${params[0]?.value?.[1]?.toFixed(1)}%` },
      grid: { left: '12%', right: '5%', bottom: '8%', top: '8%' },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', name: '%', nameLocation: 'middle', nameGap: 35, min: 0, max: 100, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [{
        type: 'line', data: [], lineStyle: { color, width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '4d' }, { offset: 1, color: color + '1a' }] } },
        symbol: 'none', animation: false,
      }],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || sqData.length === 0) return
    const chartData = sqData.map((p, i) => [i, p.value])
    chartInstance.current.setOption({
      xAxis: { min: 0, max: chartData.length - 1 },
      series: [{ data: chartData }],
    })
  }, [sqData])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {sqData.length === 0 && <EmptyState icon="📈" label="SQI" />}
    </div>
  )
}

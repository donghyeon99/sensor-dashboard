import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { EmptyState } from '../layout/EmptyState'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

export function SpO2Chart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const spo2History = useSensorDataStore((s) => s.spo2History)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.value?.[1]?.toFixed(1)}%` },
      grid: { left: '12%', right: '5%', bottom: '8%', top: '8%' },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', name: '%', nameLocation: 'middle', nameGap: 35, min: 85, max: 100, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [{
        type: 'line', data: [], lineStyle: { color: '#4ecdc4', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(78,205,196,0.3)' }, { offset: 1, color: 'rgba(78,205,196,0.05)' }] } },
        symbol: 'none', animation: false, smooth: true,
      }],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current) return
    const chartData = spo2History.map((p, i) => [i, p.value])
    chartInstance.current.setOption({
      xAxis: { min: 0, max: Math.max(chartData.length - 1, 1) },
      series: [{ data: chartData }],
    })
  }, [spo2History])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {spo2History.length === 0 && <EmptyState icon="🫁" label="SpO2" />}
    </div>
  )
}

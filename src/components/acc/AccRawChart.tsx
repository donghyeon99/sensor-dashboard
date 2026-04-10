import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { EmptyState } from '../layout/EmptyState'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export function AccRawChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const accX = useSensorDataStore((s) => s.accX)
  const accY = useSensorDataStore((s) => s.accY)
  const accZ = useSensorDataStore((s) => s.accZ)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['X', 'Y', 'Z'], top: 5, textStyle: { color: '#8888aa', fontSize: 11 } },
      grid: { left: '10%', right: '5%', bottom: '8%', top: '15%' },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', name: 'g', nameLocation: 'middle', nameGap: 35, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [
        { name: 'X', type: 'line', data: [], lineStyle: { color: '#ef4444', width: 1.5 }, symbol: 'none', animation: false },
        { name: 'Y', type: 'line', data: [], lineStyle: { color: '#4ade80', width: 1.5 }, symbol: 'none', animation: false },
        { name: 'Z', type: 'line', data: [], lineStyle: { color: '#3b82f6', width: 1.5 }, symbol: 'none', animation: false },
      ],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current) return
    const xData = accX.map((p, i) => [i, p.value])
    const yData = accY.map((p, i) => [i, p.value])
    const zData = accZ.map((p, i) => [i, p.value])
    const maxLen = Math.max(xData.length, yData.length, zData.length, 1)
    chartInstance.current.setOption({
      xAxis: { min: 0, max: maxLen - 1 },
      series: [{ data: xData }, { data: yData }, { data: zData }],
    })
  }, [accX, accY, accZ])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {accX.length === 0 && <EmptyState icon="📐" label="ACC" />}
    </div>
  )
}

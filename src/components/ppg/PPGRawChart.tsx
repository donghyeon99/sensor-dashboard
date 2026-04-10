import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { EmptyState } from '../layout/EmptyState'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export function PPGRawChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const ir = useSensorDataStore((s) => s.ppgIr)
  const red = useSensorDataStore((s) => s.ppgRed)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['IR', 'Red'], top: 5, textStyle: { color: '#8888aa', fontSize: 11 } },
      grid: { left: '10%', right: '5%', bottom: '8%', top: '15%' },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', name: 'ADC', nameLocation: 'middle', nameGap: 45, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [
        { name: 'IR', type: 'line', data: [], lineStyle: { color: '#a855f7', width: 1.5 }, symbol: 'none', animation: false },
        { name: 'Red', type: 'line', data: [], lineStyle: { color: '#ef4444', width: 1.5 }, symbol: 'none', animation: false },
      ],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current) return
    const irData = ir.map((p, i) => [i, p.value])
    const redData = red.map((p, i) => [i, p.value])
    const maxLen = Math.max(irData.length, redData.length, 1)
    chartInstance.current.setOption({
      xAxis: { min: 0, max: maxLen - 1 },
      series: [{ data: irData }, { data: redData }],
    })
  }, [ir, red])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {ir.length === 0 && <EmptyState icon="❤️" label="PPG" />}
    </div>
  )
}

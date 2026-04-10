import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

export function AccMagnitudeChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const magnitude = useSensorDataStore((s) => s.accMagnitude)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.value?.[1]?.toFixed(3)} g` },
      grid: { left: '12%', right: '5%', bottom: '8%', top: '8%' },
      xAxis: { type: 'value', show: false },
      yAxis: { type: 'value', name: 'g', nameLocation: 'middle', nameGap: 40, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [{
        type: 'line', data: [], lineStyle: { color: '#facc15', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(250,204,21,0.3)' }, { offset: 1, color: 'rgba(250,204,21,0.05)' }] } },
        symbol: 'none', animation: false, smooth: true,
      }],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current) return
    const chartData = magnitude.map((p, i) => [i, p.value])
    chartInstance.current.setOption({
      xAxis: { min: 0, max: Math.max(chartData.length - 1, 1) },
      series: [{ data: chartData }],
    })
  }, [magnitude])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {magnitude.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80">
          <div className="text-center space-y-2">
            <div className="text-4xl">📐</div>
            <div className="text-sm text-text-secondary">Magnitude 데이터 대기 중...</div>
          </div>
        </div>
      )}
    </div>
  )
}

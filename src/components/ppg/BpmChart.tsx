import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

export function BpmChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const bpmHistory = useSensorDataStore((s) => s.bpmHistory)
  const connected = useConnectionStore((s) => s.connected)

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0]?.value?.[1]?.toFixed(0)} BPM` },
      grid: { left: '12%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: { type: 'value', name: 'BPM', nameLocation: 'middle', nameGap: 40, min: 40, max: 140, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [{
        type: 'line', data: [], lineStyle: { color: '#ef4444', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0.05)' }] } },
        symbol: 'none', animation: false, smooth: true,
      }],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current) return
    chartInstance.current.setOption({ series: [{ data: bpmHistory.map((p) => [p.index, p.value]) }] })
  }, [bpmHistory])

  if (!connected || bpmHistory.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">💓</div>
          <div className="text-sm text-text-secondary">BPM 데이터 대기 중...</div>
        </div>
      </div>
    )
  }

  return <div ref={chartRef} className="w-full h-64" />
}

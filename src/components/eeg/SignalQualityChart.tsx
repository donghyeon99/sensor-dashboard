import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  channel: 'ch1' | 'ch2'
}

export function SignalQualityChart({ channel }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const data = channel === 'ch1' ? fp1 : fp2
  const color = channel === 'ch1' ? '#10b981' : '#f59e0b'

  const sqiData = useMemo(() => {
    if (data.length < 10) return []
    const windowSize = 50
    const result: [number, number][] = []
    for (let i = Math.min(windowSize, data.length - 1); i < data.length; i++) {
      const start = Math.max(0, i - windowSize)
      const window = data.slice(start, i)
      const mean = window.reduce((s, p) => s + p.value, 0) / window.length
      const std = Math.sqrt(window.reduce((s, p) => s + (p.value - mean) ** 2, 0) / window.length)
      const sqi = Math.max(0, Math.min(100, 100 - (std / (Math.abs(mean) + 1)) * 10))
      result.push([result.length, sqi])
    }
    return result
  }, [data])

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
    if (!chartInstance.current || sqiData.length === 0) return
    chartInstance.current.setOption({
      xAxis: { min: 0, max: sqiData.length - 1 },
      series: [{ data: sqiData }],
    })
  }, [sqiData])

  return (
    <div className="relative w-full h-64">
      <div ref={chartRef} className="w-full h-full" />
      {sqiData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80">
          <div className="text-center space-y-2">
            <div className="text-4xl">📈</div>
            <div className="text-sm text-text-secondary">데이터 대기 중...</div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  channel: 'ch1' | 'ch2'
}

export function SignalQualityChart({ channel }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const connected = useConnectionStore((s) => s.connected)
  const data = channel === 'ch1' ? fp1 : fp2
  const color = channel === 'ch1' ? '#10b981' : '#f59e0b'

  // Simple SQI: ratio of valid (non-extreme) samples in sliding window
  const sqiData = useMemo(() => {
    if (data.length < 10) return []
    const windowSize = 50
    const result: [number, number][] = []
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i)
      const validCount = window.filter((p) => Math.abs(p.value) < 100).length
      const sqi = (validCount / windowSize) * 100
      result.push([data[i].index, sqi])
    }
    return result
  }, [data])

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `SQI: ${params[0]?.value?.[1]?.toFixed(1)}%` },
      grid: { left: '12%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
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
    chartInstance.current.setOption({ series: [{ data: sqiData }] })
  }, [sqiData])

  if (!connected || sqiData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">📈</div>
          <div className="text-sm text-text-secondary">데이터 대기 중...</div>
        </div>
      </div>
    )
  }

  return <div ref={chartRef} className="w-full h-64" />
}

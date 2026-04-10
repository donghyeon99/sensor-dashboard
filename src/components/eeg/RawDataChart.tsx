import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])

interface Props {
  channel: 'ch1' | 'ch2'
}

export function RawDataChart({ channel }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const connected = useConnectionStore((s) => s.connected)
  const data = channel === 'ch1' ? fp1 : fp2
  const color = channel === 'ch1' ? '#10b981' : '#f59e0b'
  const label = channel === 'ch1' ? 'FP1 (Ch1)' : 'FP2 (Ch2)'

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)

    chartInstance.current.setOption({
      tooltip: { trigger: 'axis', formatter: (params: any) => `${label}: ${params[0]?.value?.[1]?.toFixed(2)} μV` },
      grid: { left: '12%', right: '5%', bottom: '12%', top: '8%' },
      xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: { type: 'value', name: 'μV', nameLocation: 'middle', nameGap: 40, min: -150, max: 150, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#8888aa', fontSize: 10 } },
      series: [{ type: 'line', data: [], lineStyle: { color, width: 1.5 }, symbol: 'none', animation: false, sampling: 'lttb' }],
      dataZoom: [{ type: 'inside', filterMode: 'none' }],
    })

    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || data.length === 0) return
    chartInstance.current.setOption({
      series: [{ data: data.map((p) => [p.index, p.value]) }],
    })
  }, [data])

  if (!connected || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">🧠</div>
          <div className="text-sm text-text-secondary">데이터 대기 중...</div>
          <div className="text-xs text-text-muted">디바이스를 연결해주세요</div>
        </div>
      </div>
    )
  }

  return <div ref={chartRef} className="w-full h-64" />
}

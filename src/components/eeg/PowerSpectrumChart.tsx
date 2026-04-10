import { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSensorDataStore } from '../../stores/sensorDataStore'
import { useConnectionStore } from '../../stores/connectionStore'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, CanvasRenderer])

// Simple FFT approximation using sliding DFT for visualization
function computeSpectrum(data: { value: number }[], sampleRate: number): [number, number][] {
  if (data.length < 64) return []
  const N = Math.min(256, data.length)
  const samples = data.slice(-N).map((p) => p.value)
  const result: [number, number][] = []

  for (let k = 1; k <= 45; k++) {
    const freq = k
    let realSum = 0, imagSum = 0
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * freq * n) / sampleRate
      realSum += samples[n] * Math.cos(angle)
      imagSum -= samples[n] * Math.sin(angle)
    }
    const magnitude = Math.sqrt(realSum * realSum + imagSum * imagSum) / N
    const db = magnitude > 0 ? 20 * Math.log10(magnitude + 1) : 0
    result.push([freq, db])
  }
  return result
}

export function PowerSpectrumChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const fp1 = useSensorDataStore((s) => s.eegFp1)
  const fp2 = useSensorDataStore((s) => s.eegFp2)
  const connected = useConnectionStore((s) => s.connected)

  const spectrumData = useMemo(() => {
    const ch1Spectrum = computeSpectrum(fp1, 250)
    const ch2Spectrum = computeSpectrum(fp2, 250)
    return { ch1: ch1Spectrum, ch2: ch2Spectrum, hasData: ch1Spectrum.length > 0 }
  }, [fp1, fp2])

  useEffect(() => {
    if (!chartRef.current) return
    chartInstance.current = echarts.init(chartRef.current)
    chartInstance.current.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let result = `${params[0]?.value?.[0]?.toFixed(1)} Hz<br/>`
          params.forEach((p: any) => { result += `${p.seriesName}: ${p.value[1].toFixed(2)} dB<br/>` })
          return result
        },
      },
      legend: { data: ['FP1 (Ch1)', 'FP2 (Ch2)'], top: 5, textStyle: { color: '#8888aa', fontSize: 11 } },
      grid: { left: '10%', right: '5%', bottom: '15%', top: '15%' },
      xAxis: { type: 'value', name: 'Hz', nameLocation: 'middle', nameGap: 25, min: 1, max: 45, axisLabel: { color: '#8888aa', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
      yAxis: { type: 'value', name: 'dB', nameLocation: 'middle', nameGap: 40, min: 0, axisLabel: { color: '#8888aa', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
      series: [
        {
          name: 'FP1 (Ch1)', type: 'line', data: [], symbol: 'none', smooth: true, animation: false,
          lineStyle: { color: '#3b82f6', width: 2 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.3)' }, { offset: 1, color: 'rgba(59,130,246,0.05)' }] } },
          markArea: {
            silent: true,
            data: [
              [{ name: 'Delta', xAxis: 1, itemStyle: { color: 'rgba(139,69,19,0.08)' } }, { xAxis: 4 }],
              [{ name: 'Theta', xAxis: 4, itemStyle: { color: 'rgba(255,140,0,0.08)' } }, { xAxis: 8 }],
              [{ name: 'Alpha', xAxis: 8, itemStyle: { color: 'rgba(50,205,50,0.08)' } }, { xAxis: 13 }],
              [{ name: 'Beta', xAxis: 13, itemStyle: { color: 'rgba(30,144,255,0.08)' } }, { xAxis: 30 }],
              [{ name: 'Gamma', xAxis: 30, itemStyle: { color: 'rgba(148,0,211,0.08)' } }, { xAxis: 45 }],
            ],
          },
        },
        {
          name: 'FP2 (Ch2)', type: 'line', data: [], symbol: 'none', smooth: true, animation: false,
          lineStyle: { color: '#ef4444', width: 2 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0.05)' }] } },
        },
      ],
    })
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chartInstance.current?.dispose() }
  }, [])

  useEffect(() => {
    if (!chartInstance.current || !spectrumData.hasData) return
    chartInstance.current.setOption({
      series: [{ data: spectrumData.ch1 }, { data: spectrumData.ch2 }],
    })
  }, [spectrumData])

  if (!connected || !spectrumData.hasData) {
    return (
      <div className="w-full h-72 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">🌈</div>
          <div className="text-sm text-text-secondary">데이터 대기 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div ref={chartRef} className="w-full h-72" />
      <div className="mt-2 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span className="text-text-secondary">FP1 (Ch1)</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full" /><span className="text-text-secondary">FP2 (Ch2)</span></div>
      </div>
    </div>
  )
}

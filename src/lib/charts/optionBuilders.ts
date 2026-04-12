// Design Ref: §3.4 — factory functions producing ECharts option objects for common chart shapes
import type { EChartsOption } from './echartsRegistry'
import { areaGradient, axisLabelStyle, legendTextStyle, splitLineStyle } from './theme'

type TooltipFormatter = (params: any) => string

export interface RealtimeLineOptions {
  color: string
  yName: string
  yMin?: number
  yMax?: number
  yInterval?: number
  yNameGap?: number
  smooth?: boolean
  area?: boolean
  sampling?: 'lttb' | 'average' | 'max' | 'min' | 'sum'
  tooltipFormatter?: TooltipFormatter
}

export function buildRealtimeLineOption({
  color,
  yName,
  yMin,
  yMax,
  yInterval,
  yNameGap = 40,
  smooth = false,
  area = false,
  sampling,
  tooltipFormatter,
}: RealtimeLineOptions): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      ...(tooltipFormatter ? { formatter: tooltipFormatter as any } : {}),
    },
    grid: { left: '12%', right: '5%', bottom: '8%', top: '8%' },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'value',
      name: yName,
      nameLocation: 'middle',
      nameGap: yNameGap,
      ...(yMin !== undefined ? { min: yMin } : {}),
      ...(yMax !== undefined ? { max: yMax } : {}),
      ...(yInterval !== undefined ? { interval: yInterval } : {}),
      splitLine: splitLineStyle,
      axisLabel: axisLabelStyle,
    },
    series: [
      {
        type: 'line',
        data: [],
        lineStyle: { color, width: area ? 2 : 1.5 },
        ...(area ? { areaStyle: { color: areaGradient(color) } } : {}),
        symbol: 'none',
        animation: false,
        ...(smooth ? { smooth: true } : {}),
        ...(sampling ? { sampling } : {}),
      },
    ],
  }
}

export interface MultiLineSeries {
  name: string
  color: string
  smooth?: boolean
}

export interface MultiLineOptions {
  series: MultiLineSeries[]
  yName: string
  yMin?: number
  yMax?: number
  yNameGap?: number
  legend?: boolean
  tooltipFormatter?: TooltipFormatter
}

export function buildMultiLineOption({
  series,
  yName,
  yMin,
  yMax,
  yNameGap = 35,
  legend = true,
  tooltipFormatter,
}: MultiLineOptions): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      ...(tooltipFormatter ? { formatter: tooltipFormatter as any } : {}),
    },
    ...(legend
      ? {
          legend: {
            data: series.map((s) => s.name),
            top: 5,
            textStyle: legendTextStyle,
          },
        }
      : {}),
    grid: { left: '10%', right: '5%', bottom: '8%', top: legend ? '15%' : '8%' },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'value',
      name: yName,
      nameLocation: 'middle',
      nameGap: yNameGap,
      ...(yMin !== undefined ? { min: yMin } : {}),
      ...(yMax !== undefined ? { max: yMax } : {}),
      splitLine: splitLineStyle,
      axisLabel: axisLabelStyle,
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: [],
      lineStyle: { color: s.color, width: 1.5 },
      symbol: 'none',
      animation: false,
      ...(s.smooth ? { smooth: true } : {}),
    })),
  }
}

export interface HistoryTrendOptions {
  color: string
  yName: string
  yMin: number
  yMax: number
  yNameGap?: number
  tooltipFormatter?: TooltipFormatter
}

export function buildHistoryTrendOption({
  color,
  yName,
  yMin,
  yMax,
  yNameGap = 40,
  tooltipFormatter,
}: HistoryTrendOptions): EChartsOption {
  return {
    tooltip: {
      trigger: 'axis',
      ...(tooltipFormatter ? { formatter: tooltipFormatter as any } : {}),
    },
    grid: { left: '12%', right: '5%', bottom: '8%', top: '8%' },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'value',
      name: yName,
      nameLocation: 'middle',
      nameGap: yNameGap,
      min: yMin,
      max: yMax,
      splitLine: splitLineStyle,
      axisLabel: axisLabelStyle,
    },
    series: [
      {
        type: 'line',
        data: [],
        lineStyle: { color, width: 2 },
        areaStyle: { color: areaGradient(color) },
        symbol: 'none',
        animation: false,
        smooth: true,
      },
    ],
  }
}

export interface SpectrumSeriesSpec {
  name: string
  color: string
  area?: boolean
}

export interface SpectrumOptions {
  series: SpectrumSeriesSpec[]
  yMin?: number
  yMax?: number
  fMin?: number
  fMax?: number
  markBands?: boolean
  tooltipFormatter?: TooltipFormatter
}

export function buildSpectrumOption({
  series,
  yMin = 0,
  yMax = 60,
  fMin = 1,
  fMax = 45,
  markBands = true,
  tooltipFormatter,
}: SpectrumOptions): EChartsOption {
  const bandMarks = markBands
    ? [
        [
          { name: 'Delta', xAxis: 1, itemStyle: { color: 'rgba(139,69,19,0.08)' } },
          { xAxis: 4 },
        ],
        [
          { name: 'Theta', xAxis: 4, itemStyle: { color: 'rgba(255,140,0,0.08)' } },
          { xAxis: 8 },
        ],
        [
          { name: 'Alpha', xAxis: 8, itemStyle: { color: 'rgba(50,205,50,0.08)' } },
          { xAxis: 13 },
        ],
        [
          { name: 'Beta', xAxis: 13, itemStyle: { color: 'rgba(30,144,255,0.08)' } },
          { xAxis: 30 },
        ],
        [
          { name: 'Gamma', xAxis: 30, itemStyle: { color: 'rgba(148,0,211,0.08)' } },
          { xAxis: 45 },
        ],
      ]
    : undefined

  return {
    tooltip: {
      trigger: 'axis',
      ...(tooltipFormatter ? { formatter: tooltipFormatter as any } : {}),
    },
    legend: {
      data: series.map((s) => s.name),
      top: 5,
      textStyle: legendTextStyle,
    },
    grid: { left: '10%', right: '5%', bottom: '15%', top: '15%' },
    xAxis: {
      type: 'value',
      name: 'Hz',
      nameLocation: 'middle',
      nameGap: 25,
      min: fMin,
      max: fMax,
      axisLabel: axisLabelStyle,
      splitLine: splitLineStyle,
    },
    yAxis: {
      type: 'value',
      name: 'dB',
      nameLocation: 'middle',
      nameGap: 40,
      min: yMin,
      max: yMax,
      interval: 10,
      axisLabel: axisLabelStyle,
      splitLine: splitLineStyle,
    },
    series: series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: [],
      lineStyle: { color: s.color, width: 2 },
      ...(s.area
        ? { areaStyle: { color: areaGradient(s.color, 0.3, 0.05) } }
        : {}),
      symbol: 'none',
      smooth: true,
      animation: false,
      ...(i === 0 && bandMarks ? { markArea: { silent: true, data: bandMarks as any } } : {}),
    })),
  }
}

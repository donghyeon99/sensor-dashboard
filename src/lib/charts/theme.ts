// Design Ref: §3.4 — shared echarts axis/tooltip defaults
export const chartColors = {
  fp1: '#10b981',
  fp2: '#f59e0b',
  ch1Spectrum: '#3b82f6',
  ch2Spectrum: '#ef4444',
  ir: '#a855f7',
  red: '#ef4444',
  bpm: '#ef4444',
  spo2: '#4ecdc4',
  accX: '#ef4444',
  accY: '#4ade80',
  accZ: '#3b82f6',
  magnitude: '#facc15',
  axisLabel: '#8888aa',
  gridLine: 'rgba(255,255,255,0.05)',
} as const

export const axisLabelStyle = {
  color: chartColors.axisLabel,
  fontSize: 10,
}

export const splitLineStyle = {
  lineStyle: { color: chartColors.gridLine },
}

export const legendTextStyle = {
  color: chartColors.axisLabel,
  fontSize: 11,
}

/** rgba helper — takes a hex string and alpha 0..1 */
export function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function areaGradient(hex: string, topAlpha = 0.3, bottomAlpha = 0.05) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: rgba(hex, topAlpha) },
      { offset: 1, color: rgba(hex, bottomAlpha) },
    ],
  }
}

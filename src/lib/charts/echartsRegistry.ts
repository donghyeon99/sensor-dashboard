// Design Ref: §3.4 D3 — single echarts registry to avoid duplicate `echarts.use` calls
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkAreaComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkAreaComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export { echarts }
export type { EChartsCoreOption as EChartsOption, ECharts } from 'echarts/core'

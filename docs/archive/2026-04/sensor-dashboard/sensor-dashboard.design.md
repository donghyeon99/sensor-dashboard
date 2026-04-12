# Design: Sensor Dashboard — Clean Architecture Rebuild (Option B)

| Field | Value |
|---|---|
| Feature | sensor-dashboard |
| Plan Ref | docs/01-plan/features/sensor-dashboard-rebuild.plan.md |
| Architecture | **Option B — Clean Architecture** |
| Created | 2026-04-11 |
| Level | Dynamic |

## Context Anchor

| 항목 | 내용 |
|---|---|
| **WHY** | LinkBand 본앱 수준 시각화를 교육용 대시보드에서 제공 + 향후 EEG/PPG/ACC 기능 확장에 견딜 수 있는 아키텍처 필요 |
| **WHO** | LuxAcademy 학생/교사 — BCI 실시간 모니터링 |
| **RISK** | echarts 초기화 중복, 필터/FFT 로직이 store에 섞여 테스트/재사용 불가, 컴포넌트 간 시각 패턴 드리프트 |
| **SUCCESS** | 레이어 경계 명확 · 차트/DSP/어댑터 단위 재사용 · 기존 UX 픽셀 동일 · `npm run build` 통과 |
| **SCOPE** | 프론트엔드 전면 리팩터. 백엔드 변경 없음 |

---

## 1. Overview

현재 구현(Plan M1~M7 전부 완료 상태)을 **레이어 경계가 명확한 Clean Architecture**로 리팩터한다. 시각·동작은 완전 동일하며, 내부 구조만 다음과 같이 재조직된다.

```
┌─────────────────────────────────────────────────────────────┐
│ UI Layer                                                    │
│   App.tsx ─ layout/ ─ {eeg,ppg,acc}/ ─ connect/             │
│     ↓ consumes                                              │
│   components/ui/ (Card, MetricCard, SectionHeader, ...)     │
│   lib/charts/ (BaseChart, optionBuilders, theme)            │
│     ↓ consumes                                              │
├─────────────────────────────────────────────────────────────┤
│ State Layer                                                 │
│   stores/slices/ (eeg | ppg | acc | battery | stats)        │
│   stores/connectionStore.ts                                 │
│   hooks/useSSEConnection.ts (dispatches to adapters)        │
│     ↓ consumes                                              │
├─────────────────────────────────────────────────────────────┤
│ Domain Layer (pure, testable)                               │
│   lib/sensors/ (eeg/ppg/acc adapters — ingest functions)    │
│   lib/dsp/ (biquad, eegPipeline, spectrum)                  │
│   lib/thresholds/ (indexThresholds + classifyIndex)         │
│     ↓ consumes                                              │
├─────────────────────────────────────────────────────────────┤
│ Types Layer                                                 │
│   types/sensor.ts (SSE payload shapes)                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 핵심 원칙

1. **Pure domain**: `lib/dsp/`, `lib/sensors/` 는 React/Zustand 의존 없음 → 유닛 테스트 및 재사용 가능
2. **Single echarts registry**: `echarts.use([...])` 는 `lib/charts/echartsRegistry.ts` 한 곳에서만 실행 (bundle dedup + module 중복 등록 방지)
3. **BaseChart**: `useEcharts` 훅 + 컴포넌트로 `init/resize/dispose` 표준화, 21개 컴포넌트에서 반복되던 80+라인 boilerplate 제거
4. **Store slice 분리**: 도메인별 slice (eeg/ppg/acc/battery/stats) — selector 단순화, re-render 범위 축소
5. **Threshold-aware MetricCard**: `indexThresholds` + `classifyIndex` 기반 범용 카드 → EEG/PPG/ACC 카드가 동일 primitive 재사용

---

## 2. Target Directory

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── types/
│   └── sensor.ts                         # 유지 (SSE payload 타입)
├── lib/
│   ├── dsp/
│   │   ├── biquad.ts                     # Biquad RBJ filter factories (notch/HP/LP)
│   │   ├── eegPipeline.ts                # createEegChannelFilter, processEegSample
│   │   └── spectrum.ts                   # computeSpectrum, computeBandPower, EEG_BANDS
│   ├── sensors/
│   │   ├── types.ts                      # EegBufferState, PpgBufferState, AccBufferState
│   │   ├── eegAdapter.ts                 # ingestEegRaw, ingestEegAnalysis
│   │   ├── ppgAdapter.ts                 # ingestPpgRaw, ingestPpgAnalysis
│   │   └── accAdapter.ts                 # ingestAccRaw, ingestAccAnalysis
│   ├── charts/
│   │   ├── echartsRegistry.ts            # echarts.use([...]) once
│   │   ├── theme.ts                      # color tokens, axis style defaults
│   │   ├── BaseChart.tsx                 # React wrapper: init / resize / dispose
│   │   └── optionBuilders.ts             # buildRealtimeLine, buildMultiLine,
│   │                                     #   buildHistoryTrend, buildSpectrum
│   └── thresholds/
│       └── indexThresholds.ts            # (moved from lib/indexThresholds.ts)
├── stores/
│   ├── connectionStore.ts                # 유지
│   └── slices/
│       ├── eegStore.ts                   # eegFp1/fp2/sq/analysis/leadOff/filterState
│       ├── ppgStore.ts                   # ppgIr/red/analysis/bpmHistory/spo2History
│       ├── accStore.ts                   # accX/Y/Z/magnitude/analysis
│       ├── batteryStore.ts               # batteryLevel
│       └── statsStore.ts                 # messageCount
├── hooks/
│   └── useSSEConnection.ts               # dispatches payload to adapter fns
└── components/
    ├── ui/
    │   ├── Card.tsx                      # bg-bg-card + border + rounded-2xl
    │   ├── SectionHeader.tsx             # title + subtitle 패턴
    │   ├── InfoBadge.tsx                 # 컬러 variant 받는 info pill
    │   ├── MetricCard.tsx                # threshold-aware metric tile
    │   └── WaitingState.tsx              # "Waiting for X data..." 패턴
    ├── layout/
    │   ├── Header.tsx                    # 유지 (ConnectPanel 임포트)
    │   ├── CategoryTabs.tsx              # 유지
    │   ├── Footer.tsx                    # statsStore 구독으로 변경
    │   └── EmptyState.tsx                # 유지 (connectionStore만 사용)
    ├── connect/
    │   └── ConnectPanel.tsx              # 유지
    ├── eeg/
    │   ├── EEGVisualizer.tsx
    │   ├── LeadOffBanner.tsx
    │   ├── IndexTooltip.tsx              # indexThresholds 뷰
    │   ├── RawDataChart.tsx              # BaseChart + buildRealtimeLine
    │   ├── SignalQualityChart.tsx        # BaseChart + buildRealtimeLine(area)
    │   ├── PowerSpectrumChart.tsx        # BaseChart + buildSpectrum
    │   ├── BandPowerCards.tsx            # dsp/spectrum
    │   └── IndexCards.tsx                # ui/MetricCard
    ├── ppg/
    │   ├── PPGVisualizer.tsx
    │   ├── PPGRawChart.tsx               # BaseChart + buildMultiLine
    │   ├── BpmChart.tsx                  # BaseChart + buildHistoryTrend
    │   ├── SpO2Chart.tsx                 # BaseChart + buildHistoryTrend
    │   └── PPGMetricsCards.tsx           # ui/MetricCard grid
    └── acc/
        ├── ACCVisualizer.tsx
        ├── AccRawChart.tsx               # BaseChart + buildMultiLine(triple)
        ├── AccMagnitudeChart.tsx         # BaseChart + buildRealtimeLine(area)
        └── MotionCards.tsx               # ui/MetricCard + raw value tiles
```

**삭제 대상**: `src/stores/sensorDataStore.ts` (분리됨), `src/lib/eegPower.ts` (dsp/spectrum으로 이동), `src/lib/indexThresholds.ts` (thresholds/ 로 이동)

---

## 3. Layer Specifications

### 3.1 Domain: `lib/dsp/`

**biquad.ts**
```ts
export interface BiquadState { x1: number; x2: number; y1: number; y2: number }
export interface BiquadCoefs { b0: number; b1: number; b2: number; a1: number; a2: number }
export const createBiquadState = (): BiquadState => ({ x1: 0, x2: 0, y1: 0, y2: 0 })
export const notchCoefs = (fs: number, f0: number, q: number): BiquadCoefs
export const highpassCoefs = (fs: number, f0: number, q: number): BiquadCoefs
export const lowpassCoefs = (fs: number, f0: number, q: number): BiquadCoefs
export const processBiquad = (coefs: BiquadCoefs, state: BiquadState, x: number): number
```

**eegPipeline.ts**
```ts
export const EEG_SAMPLE_RATE = 250
export const EEG_TRANSIENT_SAMPLES = 250
export interface EegChannelFilter { notch: BiquadState; hp: BiquadState; lp: BiquadState; n: number }
export const createEegChannelFilter = (): EegChannelFilter
export const processEegSample = (filter: EegChannelFilter, x: number): number
// cascade: notch(60Hz) → HP(1Hz) → LP(45Hz); returns 0 during transient warm-up
```

**spectrum.ts**
```ts
export interface BandRange { key: 'delta'|'theta'|'alpha'|'beta'|'gamma'; fMin: number; fMax: number }
export const EEG_BANDS: BandRange[]
export const computeSpectrum: (data: number[], sampleRate: number, kMin?: number, kMax?: number) => [number, number][]
export const computeBandPower: (data: number[], sampleRate: number, fMin: number, fMax: number) => { linear: number; db: number }
export const computeEegPower: (fp1: number[], fp2: number[], sampleRate: number) => ComputedEegPower | null
```

### 3.2 Domain: `lib/sensors/`

```ts
// types.ts
export interface EegBufferState {
  fp1: DataPoint[]; fp2: DataPoint[]; sq: DataPoint[]
  sampleIndex: number
  fp1Filter: EegChannelFilter; fp2Filter: EegChannelFilter
  rawLeadOff: { ch1: boolean; ch2: boolean }
}
// similarly: PpgBufferState, AccBufferState

// eegAdapter.ts — pure function returning next state
export function ingestEegRaw(prev: EegBufferState, samples: EegRawSample[], bufferSize: number): EegBufferState
export function normalizeEegAnalysis(raw: any): EegAnalysis
```

어댑터는 store에서 분리되어 **React/Zustand 비의존 순수 함수**. 테스트 및 재사용 용이.

### 3.3 State: `stores/slices/`

각 slice는 "내가 책임지는 데이터 + ingest 액션"만 소유. `useSSEConnection`이 payload를 받으면 해당 slice들의 ingest를 순서대로 호출한다.

```ts
// eegStore.ts
interface EegState extends EegBufferState {
  analysis: EegAnalysis | null
  ingestRaw: (samples: EegRawSample[]) => void
  ingestAnalysis: (raw: any) => void
  reset: () => void
}
export const useEegStore = create<EegState>(...)
```

### 3.4 UI: `lib/charts/`

**echartsRegistry.ts** — 모든 echarts 모듈 등록을 한 곳에서:
```ts
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, DataZoomComponent, CanvasRenderer])
export { echarts }
```

**BaseChart.tsx** — 모든 차트 컴포넌트의 공통 수명주기:
```tsx
interface Props {
  option: echarts.EChartsOption
  className?: string
  /** call on each data change to return a patch option for setOption */
  updater?: (chart: echarts.ECharts) => void
  deps?: React.DependencyList
}
export function BaseChart({ option, className, updater, deps }: Props) {
  // init on mount / dispose on unmount / resize listener
  // runs updater() whenever `deps` changes
}
```

**optionBuilders.ts** — 반복 패턴 팩토리:
```ts
buildRealtimeLineOption({ color, yMin, yMax, yName, yUnit, area?: boolean, tooltipFormatter?, ... })
buildMultiLineOption({ series: [{ name, color }], yName, yUnit, legend: boolean })
buildHistoryTrendOption({ color, yMin, yMax, yName, unit, smooth: boolean })
buildSpectrumOption({ series: [{ name, color, areaGradient }], markBands: boolean })
```

### 3.5 UI: `components/ui/`

- **Card** — `<div className="bg-bg-card border border-border rounded-2xl p-6">{children}</div>` (variant: `elevated`)
- **SectionHeader** — 제목 + 부제 + 우측 슬롯
- **InfoBadge** — `color` prop (teal/coral/yellow/purple) → 배경/테두리/텍스트 색상
- **MetricCard** — `threshold`, `value`, `dotColor`, `decimals`, `emoji`, `emojiAnimation` prop. `IndexTooltip` 내장. EEG/PPG/ACC 카드가 모두 이 primitive 사용
- **WaitingState** — `icon`, `label`, `dataKind` prop (connected/need-connect 분기 내장)

---

## 4. Decision Records

| # | 결정 | 이유 |
|---|---|---|
| D1 | Zustand slice 분리 (5개 slice) | 컴포넌트가 소비하는 데이터 범위 명확 → re-render 최소화, selector 단순 |
| D2 | DSP를 순수 함수로 추출 | store update reducer에서 200+ 라인 제거, 유닛 테스트 가능 |
| D3 | echarts 단일 registry | 각 컴포넌트의 `echarts.use([...])` 중복 호출 제거, tree-shaking 일관 |
| D4 | BaseChart 공통 래퍼 | init/dispose/resize boilerplate 17개 파일 × ~15줄 = 255줄 절약 |
| D5 | MetricCard primitive 통합 | EEG IndexCards / PPG PPGMetricsCards / ACC MotionCards의 90% 중복 제거 |
| D6 | thresholds를 `lib/thresholds/`로 이동 | domain grouping (sensor DSP와 같은 layer) |
| D7 | sensor adapter의 buffer state를 slice에 보관 | 필터 상태가 slice 내부에 캡슐화되어 reset 동작이 slice 단위로 가능 |
| D8 | 기존 LeadOffBanner/IndexTooltip 유지 | 동작 동일, 새 ui primitive에 맞게 import 경로만 수정 |

---

## 5. Implementation Guide

### 5.1 Module Map

| Module | Scope | Blocking |
|---|---|---|
| M-DSP | `lib/dsp/*` | - |
| M-ADAPT | `lib/sensors/*` | M-DSP |
| M-CHART | `lib/charts/*` | - |
| M-UI | `components/ui/*` | - |
| M-STORE | `stores/slices/*`, `stores/connectionStore.ts` | M-DSP, M-ADAPT |
| M-HOOK | `hooks/useSSEConnection.ts` | M-STORE |
| M-EEG | `components/eeg/*` | M-STORE, M-CHART, M-UI |
| M-PPG | `components/ppg/*` | M-STORE, M-CHART, M-UI |
| M-ACC | `components/acc/*` | M-STORE, M-CHART, M-UI |
| M-LAYOUT | `components/layout/*`, `App.tsx` | M-STORE |
| M-CLEANUP | delete legacy `stores/sensorDataStore.ts`, `lib/eegPower.ts`, move `lib/indexThresholds.ts` | all above |
| M-VERIFY | `npm run build` + dev smoke test | M-CLEANUP |

### 5.2 Recommended Session Plan

1. **Foundation session** (sequential): M-DSP → M-CHART → M-UI → M-ADAPT → M-STORE → M-HOOK
2. **Feature migration session** (parallel): M-EEG ‖ M-PPG ‖ M-ACC (disjoint dirs, safe to run concurrently)
3. **Finish session**: M-LAYOUT → M-CLEANUP → M-VERIFY

---

## 6. Success Criteria (from Plan)

| # | Criterion | How we verify |
|---|---|---|
| SC-1 | SSE URL 즉시 연결 | ConnectPanel → useSSEConnection 경로 unchanged |
| SC-2 | EEG 7 컴포넌트 실시간 렌더링 | 리팩터 후 시각 동일, useEegStore 구독 |
| SC-3 | PPG 4 컴포넌트 | MetricCard primitive 통해 12+ 지표 그리드 |
| SC-4 | ACC 3 컴포넌트 | X/Y/Z, magnitude, MotionCards |
| SC-5 | 탭 전환 데이터 유지 | Zustand 전역 상태 유지 |
| SC-6 | Mock 뱃지 | connectionStore.isMock unchanged |
| SC-7 | TypeScript 컴파일 | `npm run build` 통과 |
| SC-8 | 디자인 픽셀 동일 | 각 컴포넌트 className 그대로 이식 |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| 필터 상태가 slice 재생성 시 끊어짐 | slice 내부 state 유지, `resetData`에서만 초기화 |
| BaseChart updater 의존성 배열 미스 | 각 컴포넌트에서 `deps`에 최종 data ref 전달 원칙 문서화 |
| echarts tree-shaking 깨짐 | echartsRegistry 단일 진입점 + 동일 모듈 재등록 금지 |
| 병렬 에이전트 동시 편집 충돌 | EEG/PPG/ACC 디렉토리 disjoint, foundation 완료 후 dispatch |

---

## 8. Out of Scope

- 백엔드 변경
- 새 기능/지표 추가
- 유닛 테스트 작성 (별도 피처)
- Design tokens 분리 (Tailwind config 유지)

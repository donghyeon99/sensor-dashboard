# Design: LinkBand UI Match

| Field | Value |
|---|---|
| Feature | linkband-ui-match |
| Plan Ref | docs/01-plan/features/linkband-ui-match.plan.md |
| Architecture | **Option A — shadcn Isolated Directory** |
| Created | 2026-04-12 |
| Level | Dynamic |

## Context Anchor

| 항목 | 내용 |
|---|---|
| **WHY** | 공식 sdk.linkband.store 레퍼런스와 시각/구조 일치 + PPG 신호 품질 경고 시스템 도입 |
| **WHO** | LuxAcademy 학생/교사, LinkBand 생태계 사용자 |
| **RISK** | Windows FS 대소문자 충돌 회피, ACC 탭 완전 동결, PPG 필터 warm-up 이상, shadcn-Tailwind v4 호환 |
| **SUCCESS** | 3 탭 레퍼런스 일치 (ACC 동결) · PPG 필터/SQI/LeadOff 작동 · shadcn Tabs · `npm run build` 통과 |
| **SCOPE** | 프론트엔드 UI + PPG DSP · ACC 동결 · SSE 스키마 변경 없음 |

---

## 1. Overview

Plan에서 승인된 Option A(shadcn 격리 디렉터리)에 따라 다음과 같이 구조를 확장한다:

1. **shadcn/ui를 `src/components/shadcn/`에 격리 설치** (`components.json` alias로 공식 지원)
2. **기존 `components/ui/` primitive는 일절 이동/리네임하지 않음** → ACC 탭 import 0 변경
3. **EEG/PPG 탭은 shadcn primitive로 스타일 마이그레이션** (레퍼런스 raw Tailwind 사용)
4. **PPG 0.5–5Hz 필터 파이프라인 신설** + 필터링 버퍼를 `ppgStore`에 추가
5. **Visualizer 페이지 헤더 + 신호 품질 뱃지** 신규 컴포넌트 분리 (`components/visualizer/`)
6. **EEG SQI 버퍼를 Ch1/Ch2로 분리** (현 단일 버퍼 → 두 개, SSE 한계로 동일값 저장)
7. **LeadOffBanner 3-variant화** (FP1-only / FP2-only / both)

Clean Architecture foundation(`lib/dsp`, `lib/sensors`, `lib/charts`, `stores/slices`)은 **완전 재사용**. 신규 파일은 이 foundation 위에 얹힌다.

---

## 2. Target Directory

```
src/
├── App.tsx                                 # 재작성 (Visualizer 헤더 + shadcn Tabs)
├── main.tsx
├── index.css                               # shadcn CSS 변수 추가
├── lib/
│   ├── utils.ts                            # 신규: cn() helper (shadcn 표준)
│   ├── dsp/
│   │   ├── biquad.ts                       # 유지
│   │   ├── eegPipeline.ts                  # 유지
│   │   ├── ppgPipeline.ts                  # 신규: 0.5-5Hz bandpass
│   │   └── spectrum.ts                     # 유지
│   ├── sensors/
│   │   ├── types.ts                        # 확장: PpgBufferState에 filtered + filter state
│   │   ├── eegAdapter.ts                   # 확장: sq → sqCh1/sqCh2
│   │   ├── ppgAdapter.ts                   # 확장: ingest 시 필터링 수행
│   │   └── accAdapter.ts                   # 유지
│   ├── charts/                             # 유지 (BaseChart, optionBuilders, theme, registry)
│   └── thresholds/indexThresholds.ts       # 유지
├── stores/
│   ├── connectionStore.ts                  # 유지
│   └── slices/
│       ├── eegStore.ts                     # 확장: sqCh1/sqCh2
│       ├── ppgStore.ts                     # 확장: irFiltered/redFiltered + 필터 state
│       ├── accStore.ts                     # 유지
│       ├── batteryStore.ts                 # 유지
│       └── statsStore.ts                   # 유지
├── hooks/
│   ├── useSSEConnection.ts                 # 유지 (slice API 변화 없음)
│   └── useSignalQuality.ts                 # 신규
└── components/
    ├── ui/                                 # 🔒 기존 primitive 완전 유지 (ACC 의존)
    │   ├── Card.tsx
    │   ├── InfoBadge.tsx
    │   ├── MetricCard.tsx
    │   ├── SectionHeader.tsx
    │   ├── WaitingState.tsx
    │   └── index.ts
    ├── shadcn/                             # 🆕 shadcn 격리 설치
    │   ├── card.tsx
    │   ├── badge.tsx
    │   ├── tabs.tsx
    │   ├── button.tsx
    │   └── input.tsx
    ├── visualizer/                         # 🆕 page-level
    │   ├── VisualizerHeader.tsx
    │   ├── StreamingBadge.tsx
    │   └── SignalQualityBadge.tsx
    ├── layout/                             # 유지 (Header/Footer/EmptyState/CategoryTabs)
    │   └── ...  (CategoryTabs는 더 이상 쓰이지 않지만 삭제 X — dead code 허용)
    ├── connect/
    │   └── ConnectPanel.tsx                # 유지
    ├── eeg/                                # 🔄 리스타일
    │   ├── EEGVisualizer.tsx               # 재작성 (raw Tailwind + shadcn Card)
    │   ├── LeadOffBanner.tsx               # 3-variant props 확장
    │   ├── IndexTooltip.tsx                # 유지
    │   ├── RawDataChart.tsx                # Card wrapping 재작성 (내부 BaseChart 유지)
    │   ├── SignalQualityChart.tsx          # sqCh1/sqCh2 분기 prop
    │   ├── PowerSpectrumChart.tsx          # 재작성 (leadoff 배너 상단)
    │   ├── BandPowerCards.tsx              # 재작성 (레퍼런스 그리드)
    │   └── IndexCards.tsx                  # 재작성 (레퍼런스 카드 스타일, MetricCard 대체)
    ├── ppg/                                # 🔄 리스타일 + 신규/삭제
    │   ├── PPGVisualizer.tsx               # 재작성
    │   ├── PPGFilteredChart.tsx            # 🆕
    │   ├── PPGSQIChart.tsx                 # 🆕 (Ch1/Ch2 prop)
    │   ├── PPGLeadOffBanner.tsx            # 🆕 (eegStore 구독)
    │   ├── PPGMetricsCards.tsx             # 재작성 (14 지표 4-row grid)
    │   ├── BpmChart.tsx                    # 🗑️ 삭제
    │   ├── SpO2Chart.tsx                   # 🗑️ 삭제
    │   └── PPGRawChart.tsx                 # 🗑️ 삭제 (필터링된 것만)
    └── acc/                                # 🔒 완전 동결 (0 변경)
        ├── ACCVisualizer.tsx
        ├── AccRawChart.tsx
        ├── AccMagnitudeChart.tsx
        └── MotionCards.tsx
```

**Note on PPGRawChart**: 레퍼런스는 **Filtered만** 존재. Raw unfiltered 버전은 삭제하여 구조 단순화.

---

## 3. Layer Specifications

### 3.1 shadcn Integration (`components/shadcn/`)

**`components.json`**:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/shadcn",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**`src/lib/utils.ts`**:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**`vite.config.ts` path alias** (필요 시 `@` 추가):
```ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

**`tsconfig.json` compilerOptions**:
```json
{ "baseUrl": ".", "paths": { "@/*": ["src/*"] } }
```

**설치 컴포넌트**: `card`, `badge`, `tabs`, `button`, `input`. CLI 명령: `npx shadcn@latest add card badge tabs button input`.

### 3.2 PPG DSP (`lib/dsp/ppgPipeline.ts`)

```ts
import { createBiquadState, highpassCoefs, lowpassCoefs, processBiquad, type BiquadState } from './biquad'

export const PPG_SAMPLE_RATE = 50
export const PPG_TRANSIENT_SAMPLES = 50  // ~1s warm-up

const BUTTERWORTH_Q = 1 / Math.SQRT2
const HP_COEFS = highpassCoefs(PPG_SAMPLE_RATE, 0.5, BUTTERWORTH_Q)
const LP_COEFS = lowpassCoefs(PPG_SAMPLE_RATE, 5.0, BUTTERWORTH_Q)

export interface PpgChannelFilter {
  hp: BiquadState
  lp: BiquadState
  samplesProcessed: number
}

export const createPpgChannelFilter = (): PpgChannelFilter => ({
  hp: createBiquadState(),
  lp: createBiquadState(),
  samplesProcessed: 0,
})

export function processPpgSample(filter: PpgChannelFilter, sample: number): number {
  const h = processBiquad(HP_COEFS, filter.hp, sample)
  const l = processBiquad(LP_COEFS, filter.lp, h)
  const out = filter.samplesProcessed < PPG_TRANSIENT_SAMPLES ? 0 : l
  filter.samplesProcessed++
  return out
}
```

### 3.3 Store Extensions

**`eegStore` — sq split**:
```ts
interface EegBufferState {
  // ...existing
  sqCh1: DataPoint[]
  sqCh2: DataPoint[]
  // remove: sq
}
```
SSE의 `signalQuality` 필드가 샘플당 단일 숫자라 두 버퍼에 **동일값**을 저장. 향후 채널별 필드가 추가되면 분기.

**`ppgStore` — filtered buffers**:
```ts
interface PpgBufferState {
  ir: DataPoint[]
  red: DataPoint[]
  irFiltered: DataPoint[]      // 신규
  redFiltered: DataPoint[]     // 신규
  irFilter: PpgChannelFilter   // 신규
  redFilter: PpgChannelFilter  // 신규
  sampleIndex: number
  bpmHistory: DataPoint[]
  spo2History: DataPoint[]
  historyIndex: number
}
```

**`ppgAdapter.ingestPpgRaw`**: 기존 raw buffer 유지 + 필터링된 값도 동시 생성. unfiltered `ir`/`red`는 내부 로직(예: SpO2 계산)에서 쓸 수 있으므로 유지.

### 3.4 `useSignalQuality` Hook

```ts
import { useConnectionStore } from '../stores/connectionStore'
import { useEegStore } from '../stores/slices/eegStore'

export type SignalQuality = 'excellent' | 'good' | 'warning' | 'bad' | null

export function useSignalQuality(): SignalQuality {
  const connected = useConnectionStore((s) => s.connected)
  const sqCh1 = useEegStore((s) => s.sqCh1)
  const leadOff = useEegStore((s) => s.rawLeadOff)
  if (!connected) return null
  if (leadOff.ch1 || leadOff.ch2) return 'bad'
  const recent = sqCh1.slice(-50)
  if (recent.length === 0) return null
  const avg = recent.reduce((a, b) => a + b.value, 0) / recent.length
  if (avg >= 80) return 'excellent'
  if (avg >= 60) return 'good'
  return 'warning'
}
```

### 3.5 LeadOffBanner Variants

```tsx
interface Props {
  ch1Off: boolean
  ch2Off: boolean
  context?: 'eeg' | 'ppg' | 'spectrum' | 'band' | 'index'  // 메시지 조정
  size?: 'sm' | 'md'
}
```

- `ch1Off && !ch2Off`: "FP1 전극 접촉 불량 - 신호 품질이 저하될 수 있습니다"
- `!ch1Off && ch2Off`: "FP2 전극 접촉 불량 - 신호 품질이 저하될 수 있습니다"
- `ch1Off && ch2Off`: "전극 접촉 불량 (FP1: OFF, FP2: OFF) - {context} 분석 정확도가 저하될 수 있습니다"

아이콘은 `lucide-react`의 `TriangleAlert` 사용.

### 3.6 Visualizer Header

```tsx
// VisualizerHeader.tsx
export function VisualizerHeader() {
  const connected = useConnectionStore((s) => s.connected)
  const quality = useSignalQuality()
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Visualizer</h1>
        <p className="text-muted-foreground">실시간 데이터 시각화</p>
      </div>
      <div className="flex items-center gap-3">
        {connected && <StreamingBadge />}
        {quality && <SignalQualityBadge quality={quality} />}
      </div>
    </div>
  )
}
```

`StreamingBadge`: 항상 `variant="default"` + "스트리밍 중".
`SignalQualityBadge`: quality → 텍스트("우수"/"양호"/"주의"/"불량") + variant("default"/"secondary"/"outline"/"destructive").

### 3.7 App Shell

```tsx
// App.tsx
export default function App() {
  return (
    <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          <VisualizerHeader />
          <Card className="min-h-[900px]">
            <Tabs defaultValue="eeg">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="eeg">🧠 EEG 뇌파</TabsTrigger>
                <TabsTrigger value="ppg">❤️ PPG 심박</TabsTrigger>
                <TabsTrigger value="acc">📱 ACC 가속도</TabsTrigger>
              </TabsList>
              <TabsContent value="eeg" className="mt-6"><EEGVisualizer /></TabsContent>
              <TabsContent value="ppg" className="mt-6"><PPGVisualizer /></TabsContent>
              <TabsContent value="acc" className="mt-6"><ACCVisualizer /></TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

**Important**: ACC `<ACCVisualizer />` 내부는 기존 `components/ui/Card`, `InfoBadge` 등을 계속 사용 → ACC 파일 무변경.

### 3.8 Card Styling — Reference Raw Tailwind

레퍼런스는 `bg-black border border-gray-800 rounded-lg shadow` 조합 사용. shadcn `Card`의 기본은 `bg-card text-card-foreground rounded-xl border`. 레퍼런스 스타일을 정확히 매칭하려면 EEG/PPG 카드에서 shadcn `<Card>`를 사용하되 `className` 오버라이드:

```tsx
<Card className="bg-black border-gray-800 rounded-lg shadow p-6">...</Card>
```

---

## 4. Decision Records

| # | 결정 | 이유 |
|---|---|---|
| D1 | shadcn을 `components/shadcn/`에 격리 | ACC 탭 0 변경 조건 충족 + Windows FS 충돌 회피 |
| D2 | 기존 `components/ui/` primitive 완전 유지 | ACC import 경로 무변경 보장 |
| D3 | PPG 필터 파이프라인 신설 (노치 없음) | 50Hz 샘플링은 라인 노이즈와 Nyquist 무관, HP+LP 2단이면 충분 |
| D4 | PPG unfiltered `ir`/`red` buffer 유지 | SpO2 계산/향후 확장 대비 raw 보존 |
| D5 | EEG `sq`를 `sqCh1`/`sqCh2`로 분리 (동일값) | PPG SQI 차트 2개를 동일 API로 처리 + 향후 채널 분리 대비 |
| D6 | `useSignalQuality` 4단계 (excellent/good/warning/bad) | 레퍼런스 "신호 품질: 우수" 뱃지 로직 재현 |
| D7 | LeadOffBanner variant prop으로 3케이스 분기 | 레퍼런스의 차트별 세밀한 경고 일치 |
| D8 | `PPGRawChart` 삭제 (Filtered만 유지) | 레퍼런스에 unfiltered 차트 없음, 구조 단순화 |
| D9 | `BpmChart`/`SpO2Chart` 삭제 | 레퍼런스에 trend chart 없음, HRV 카드로 대체 |
| D10 | `components/layout/CategoryTabs.tsx` dead code 허용 | 삭제하지 않고 남김 — 리스크 방지 |
| D11 | `lib/utils.ts` 신설 (`cn()` helper) | shadcn 표준 진입점 |
| D12 | `@/*` path alias 추가 | shadcn 컴포넌트가 `@/lib/utils` 임포트 사용 |

---

## 5. Implementation Guide

### 5.1 Module Map

| Module | Files | Blocking |
|---|---|---|
| M1 — shadcn Install | `package.json`, `components.json`, `vite.config.ts`, `tsconfig.json`, `src/lib/utils.ts`, `src/index.css`, `src/components/shadcn/*.tsx` (5 components) | - |
| M2 — PPG DSP | `src/lib/dsp/ppgPipeline.ts` | - |
| M3 — Store Extensions | `src/lib/sensors/types.ts`, `eegAdapter.ts`, `ppgAdapter.ts`, `stores/slices/eegStore.ts`, `ppgStore.ts` | M2 |
| M4 — Signal Quality Hook | `src/hooks/useSignalQuality.ts` | M3 |
| M5 — Visualizer Page Components | `src/components/visualizer/VisualizerHeader.tsx`, `StreamingBadge.tsx`, `SignalQualityBadge.tsx` | M1, M4 |
| M6 — App Shell | `src/App.tsx` | M5 |
| M7 — LeadOffBanner Variants | `src/components/eeg/LeadOffBanner.tsx` | M1 |
| M8 — EEG Tab Restyle | `EEGVisualizer`, `RawDataChart`, `SignalQualityChart`, `PowerSpectrumChart`, `BandPowerCards`, `IndexCards` | M3, M7 |
| M9 — PPG New Components | `PPGFilteredChart.tsx`, `PPGSQIChart.tsx`, `PPGLeadOffBanner.tsx` | M3, M7 |
| M10 — PPG Tab Restyle + Deletes | `PPGVisualizer.tsx`, `PPGMetricsCards.tsx`; delete `BpmChart.tsx`, `SpO2Chart.tsx`, `PPGRawChart.tsx` | M9 |
| M11 — ACC Freeze Verification | (no edits) | - |
| M12 — Build Verify | `npm run build` | all above |

### 5.2 Session Plan

1. **Setup session** (sequential): M1 → M2 → M3 → M4 → M5 → M6
2. **Feature session** (parallel where disjoint): M7 → M8 ‖ M9 → M10
3. **Verify session**: M11 (spot-check ACC untouched) → M12 (build)

---

## 6. Success Criteria Mapping (Plan §2)

| # | SC | Design Section | Verification |
|---|---|---|---|
| SC-1 | shadcn install | §3.1, M1 | `components.json`, `src/lib/utils.ts`, 5 shadcn files |
| SC-2 | Visualizer header + badges | §3.6, §3.7, M5, M6 | 렌더 확인 |
| SC-3 | shadcn Tabs × 3 tabs | §3.7, M6 | 클릭 전환, 데이터 유지 |
| SC-4 | EEG per-channel LeadOff | §3.5, M7, M8 | ch1Off/ch2Off 케이스 분기 |
| SC-5 | PPG filtered chart | §3.2, §3.3, M9 | 0.5-5Hz 필터 출력 |
| SC-6 | PPG SQI Ch1/Ch2 | §3.3 D5, M9 | 2 line chart |
| SC-7 | PPG LeadOff banner | §3.5, M9 | leadOff 트리거 |
| SC-8 | Delete Bpm/SpO2/Raw charts | §2, M10 | `ls src/components/ppg/` |
| SC-9 | ACC 완전 동결 | §2 (🔒), M11 | `git diff src/components/acc/` 빈 출력 |
| SC-10 | Build 통과 | M12 | `npm run build` |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Tailwind v4와 shadcn 설정 충돌 | `components.json` `tailwind.config` 빈 문자열 지정 (v4는 config 불필요); CSS 변수만 주입 |
| `@/*` path alias가 기존 상대 경로 import와 혼재 | 기존 파일은 상대 경로 유지, 신규 파일만 `@/` 사용 |
| shadcn CLI add가 network 실패 | fallback으로 shadcn 소스를 수동 복사 (5개 컴포넌트, ~200줄) |
| PPG 필터 warm-up (~50 샘플 = 1초) 중 0 값 → 차트 시작이 지연돼 보임 | transient 기간 명확 표시하거나 PPGFilteredChart에 "필터 초기화 중" 오버레이 |
| PPG SQI가 EEG sq 공유라 동일 데이터 노출 → 의도 불명확 | 차트 부제에 "EEG signalQuality 공유 (Ch1/Ch2 동일)" 주석 |
| `PPGRawChart.tsx` 삭제 후 기존 `PPGVisualizer` 임포트 잔존 | M10에서 동시 수정, build verify로 잡힘 |
| dead code (`CategoryTabs.tsx`) 누적 | 허용 (D10), 차후 cleanup feature에서 제거 |

---

## 8. Out of Scope

- 백엔드 SSE payload 변경
- ACC 탭 기능/시각 변경 (동결)
- 국제화
- 테마 토글
- 유닛 테스트
- Design token 잠금 (Pencil MCP)

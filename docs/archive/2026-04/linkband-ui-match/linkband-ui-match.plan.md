# Plan: LinkBand UI Match

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | linkband-ui-match |
| Created | 2026-04-12 |
| Level | Dynamic |
| Reference | https://sdk.linkband.store |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | 우리 대시보드의 시각·구조가 공식 레퍼런스(sdk.linkband.store)와 다르고, PPG는 필터링/SQI/LeadOff 경고가 빠져 신호 품질 가시성이 낮음 |
| **Solution** | shadcn/ui + Radix + lucide-react로 UI 스택 통일 + PPG 필터 파이프라인 (0.5–5Hz bandpass) + PPG SQI/LeadOff 추가 + "Visualizer" 페이지 헤더 및 신호 품질 뱃지 도입 |
| **Function UX Effect** | 레퍼런스와 동일한 탭 구조·카드 디자인·전극 경고 레이어드 UI → 사용자가 다른 LinkBand 도구와 UX를 공유 |
| **Core Value** | 공식 SDK 데모 수준의 신뢰감 있는 시각화 + PPG 신호 품질 가시화로 교육 현장에서 데이터 해석 신뢰도 향상 |

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 공식 sdk.linkband.store 레퍼런스와 시각/구조를 일치시켜 사용자 친숙도와 신뢰도를 확보 + PPG 신호 품질 경고 시스템 도입 |
| **WHO** | LuxAcademy 학생/교사, LinkBand 생태계에 이미 익숙한 사용자 |
| **RISK** | shadcn 설치 시 기존 `components/ui/` primitive 충돌 (Windows 대소문자 FS), ACC 탭 동결 조건 준수, PPG 필터링된 신호의 스케일 차이로 기존 시각과 다르게 보일 수 있음 |
| **SUCCESS** | 3개 탭 모두 레퍼런스와 레이아웃 일치 (ACC 제외, 동결) · PPG 필터/SQI/LeadOff 작동 · shadcn 기반 Header/Tabs 동작 · `npm run build` 통과 |
| **SCOPE** | 프론트엔드 UI 레이어 + PPG DSP 파이프라인 · ACC 탭 동결 · 백엔드/SSE 스키마 변경 없음 |

---

## 1. Requirements

### 1.1 스택 추가 (신규 의존성)
- `lucide-react` — 아이콘 (`TriangleAlert`, `Clock`, `CircleCheckBig`)
- `class-variance-authority`, `clsx`, `tailwind-merge` — shadcn 유틸
- `@radix-ui/react-tabs`, `@radix-ui/react-slot` — shadcn Tabs/Button 기반
- shadcn 컴포넌트: `card`, `badge`, `tabs`, `button`, `input`

### 1.2 페이지 레이아웃
```
┌────────────────────────────────────────────────────────┐
│ LuxAcademy Header (기존 유지, ConnectPanel 포함)       │
├────────────────────────────────────────────────────────┤
│ Visualizer                    [스트리밍 중][신호:우수] │  ← 신규
│ 실시간 데이터 시각화                                    │  ← 신규
│                                                        │
│ ┌──Card──────────────────────────────────────────────┐ │
│ │ [🧠 EEG 뇌파] [❤️ PPG 심박] [📱 ACC 가속도]       │ │  ← shadcn Tabs
│ │                                                   │ │
│ │   <선택된 탭 콘텐츠>                              │ │
│ └───────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Footer (기존 유지: messages / rate / status)           │
└────────────────────────────────────────────────────────┘
```

### 1.3 EEG 탭 (레퍼런스 매칭)
| 블록 | 구성 | 특이사항 |
|---|---|---|
| Intro card | "🧠 EEG 뇌파 분석" + 설명 | `bg-black border-gray-800 rounded-lg` |
| Ch1 Filtered / Ch2 Filtered | 2-col grid | 각 카드에 **채널별** LeadOff 배너 (FP1만/FP2만) |
| Ch1 SQI / Ch2 SQI | 2-col grid | 레퍼런스는 배너 없음 |
| PowerSpectrum / BandPower | 2-col grid | 공통 LeadOff 배너 (둘 다 표시) |
| EEG 분석 지수 | 1 card | LeadOff 배너 + 4+3 카드 그리드 (7 지수) |

### 1.4 PPG 탭 (신규 + 레퍼런스 매칭)
| 블록 | 구성 | 변경 |
|---|---|---|
| Intro card | "💓 PPG 심박 분석" + 설명 | - |
| Filtered PPG 신호 | 0.5–5Hz bandpass 적용된 IR/Red | **신규** (`PPGFilteredChart`) |
| PPG SQI | Ch1/Ch2 (EEG SQI 공유) | **신규** (`PPGSQIChart`) |
| LeadOff 배너 | Filtered 카드 상단 / HRV 카드 상단 | **신규** (`PPGLeadOffBanner`) |
| 심박변이도 분석 지수 | 14 metrics, 4 rows (4+4+3+3) | 기존 `PPGMetricsCards` 레이아웃 재정렬 |
| ~~BpmChart~~ | — | **제거** |
| ~~SpO2Chart~~ | — | **제거** |

### 1.5 ACC 탭 (동결)
- `ACCVisualizer`, `AccRawChart`, `AccMagnitudeChart`, `MotionCards` — **기능·시각 완전 동결**
- 필요한 경우 import 경로만 변경 (shadcn 마이그레이션의 기술적 요구사항 한정)
- 레퍼런스의 "현재 활동 상태 카드", "업데이트 주기 뱃지", "안정화 pill", Magnitude 전체폭 등 **미적용**

### 1.6 Header 상태 뱃지
- **스트리밍 중** 뱃지: `connected === true`일 때 shadcn `Badge variant="default"` 표시
- **신호 품질** 뱃지: 4단계
  - `우수` — leadOff 없음 + 최근 SQI 평균 ≥ 80
  - `양호` — leadOff 없음 + SQI 평균 60–79
  - `주의` — leadOff 없음 + SQI 평균 < 60
  - `불량` — leadOff 1개 이상
- disconnected 시 두 뱃지 모두 숨김

### 1.7 LeadOff 배너 — 채널별 세분화
현재 단일 `LeadOffBanner`를 3가지 케이스로 확장:
- **Ch1 only**: "FP1 전극 접촉 불량" — RawDataChart Ch1 상단
- **Ch2 only**: "FP2 전극 접촉 불량" — RawDataChart Ch2 상단
- **Both**: "전극 접촉 불량 (FP1: OFF, FP2: OFF)" — PowerSpectrum/BandPower/IndexCards/PPG 카드 상단

---

## 2. Success Criteria

| # | 기준 | 검증 방법 |
|---|------|-----------|
| SC-1 | shadcn/ui + lucide-react 설치 · `components.json` 생성 | `npm run build` 통과 |
| SC-2 | "Visualizer" 페이지 헤더 + 스트리밍/신호 품질 뱃지 표시 | 연결 상태에 따라 뱃지 동적 변경 |
| SC-3 | shadcn `Tabs`로 3개 탭 전환 작동 | 클릭 시 active 탭 변경, 데이터 유지 |
| SC-4 | EEG 탭: Ch별 LeadOff 배너 (FP1만/FP2만/둘 다) 조건 분기 | 데이터 투입 후 leadOff 상태별 시각 확인 |
| SC-5 | PPG Filtered 차트 실시간 렌더링 (0.5–5Hz bandpass) | mock 데이터로 확인 |
| SC-6 | PPG SQI 차트 Ch1/Ch2 렌더링 (EEG SQI 공유) | 2-line chart 데이터 표시 |
| SC-7 | PPG LeadOff 배너 렌더링 | leadOff 트리거 시 표시 |
| SC-8 | BpmChart/SpO2Chart 파일 제거, 빌드 통과 | `ls src/components/ppg/` 확인 |
| SC-9 | ACC 탭 기능·시각 0 변경 (동결 준수) | git diff src/components/acc/ 결과가 기능적으로 동일 |
| SC-10 | `npm run build` 성공 · 타입 에러 0 | 빌드 로그 확인 |

---

## 3. Technical Approach

### 3.1 의존성 설치
```bash
npm install lucide-react class-variance-authority clsx tailwind-merge \
  @radix-ui/react-tabs @radix-ui/react-slot
npx shadcn@latest init          # components.json 생성
npx shadcn@latest add card badge tabs button input
```

### 3.2 디렉터리 전략 (ACC 동결 준수)

shadcn은 `src/components/ui/` 소문자 파일명 (card.tsx) 사용. 우리 기존 PascalCase (`Card.tsx`)와 Windows 대소문자 FS 충돌 가능 → **기존 legacy primitive를 `components/ui/legacy/`로 이동**.

```
src/components/
├── ui/                    # shadcn 신규
│   ├── card.tsx
│   ├── badge.tsx
│   ├── tabs.tsx
│   ├── button.tsx
│   ├── input.tsx
│   └── legacy/            # ACC 탭이 계속 사용 (visual 유지)
│       ├── Card.tsx
│       ├── InfoBadge.tsx
│       ├── SectionHeader.tsx
│       ├── WaitingState.tsx
│       └── MetricCard.tsx
└── visualizer/            # 신규 page-level 컴포넌트
    ├── VisualizerHeader.tsx  # Visualizer 제목 + 뱃지
    ├── StreamingBadge.tsx
    └── SignalQualityBadge.tsx
```

**ACC 컴포넌트 수정**: `import { ... } from '../ui/Card'` → `'../ui/legacy/Card'` (1줄 변경/파일, 시각·기능 무변경). 이는 "동결"의 해석 — 사용자 확인됨.

### 3.3 PPG 필터 파이프라인
```ts
// src/lib/dsp/ppgPipeline.ts
export const PPG_SAMPLE_RATE = 50
const BUTTERWORTH_Q = 1 / Math.SQRT2
const HP_COEFS = highpassCoefs(PPG_SAMPLE_RATE, 0.5, BUTTERWORTH_Q)
const LP_COEFS = lowpassCoefs(PPG_SAMPLE_RATE, 5.0, BUTTERWORTH_Q)

export interface PpgChannelFilter { hp: BiquadState; lp: BiquadState; n: number }
export const createPpgChannelFilter = (): PpgChannelFilter
export function processPpgSample(filter: PpgChannelFilter, sample: number): number
```

PPG는 EEG와 달리 노치 필터 불필요 (50Hz 샘플링이 라인 노이즈 60Hz와 무관). HP(0.5Hz)로 DC/baseline wander 제거, LP(5Hz)로 고주파 노이즈 컷.

### 3.4 PPG Store 확장
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
  spo2History: DataPoint[]     // 유지 (내부 상태만, 차트는 제거)
  historyIndex: number
}
```

### 3.5 PPG SQI 공유 전략
PPG SQI 차트는 별도 buffer 없이 **EEG sq 버퍼에서 selector**로 직접 읽음:
```ts
const sqCh1 = useEegStore((s) => s.sq) // 우리 sq는 현재 단일 버퍼 — ch1/ch2 분리 필요
```
→ `eegStore` 확장: `sq` 단일 버퍼 → `sqCh1`/`sqCh2` 분리. SSE signalQuality는 샘플 단위로 제공되므로 동일 값을 두 채널에 보내거나, 향후 확장 대비 분리 buffer 유지.

**현 SSE 한계**: signalQuality 필드는 샘플당 **1개**. 실제 Ch1/Ch2 구분 불가. 레퍼런스도 동일한 한계를 가진 것으로 보이므로 두 차트에 **동일 데이터**를 표시 (`sqCh1 === sqCh2`).

### 3.6 Signal Quality 계산
```ts
// src/hooks/useSignalQuality.ts
export function useSignalQuality(): 'excellent' | 'good' | 'warning' | 'bad' | null {
  const connected = useConnectionStore((s) => s.connected)
  const sq = useEegStore((s) => s.sq)
  const leadOff = useEegStore((s) => s.rawLeadOff)
  if (!connected) return null
  if (leadOff.ch1 || leadOff.ch2) return 'bad'
  const recent = sq.slice(-50)
  if (recent.length === 0) return null
  const avg = recent.reduce((a, b) => a + b.value, 0) / recent.length
  if (avg >= 80) return 'excellent'
  if (avg >= 60) return 'good'
  return 'warning'
}
```

---

## 4. Implementation Order

| # | 모듈 | 예상 파일 | 의존성 |
|---|---|---|---|
| M1 | shadcn 설치 + components.json + utils cn | 5 | - |
| M2 | legacy primitive를 `components/ui/legacy/`로 이동, ACC import 경로 갱신 | 4 (ACC files) + 5 (move) | M1 |
| M3 | `lib/dsp/ppgPipeline.ts` + PpgBufferState 확장 | 3 | - |
| M4 | eegStore sqCh1/sqCh2 분리 | 2 | - |
| M5 | `useSignalQuality` 훅 | 1 | M4 |
| M6 | `visualizer/` 컴포넌트 (Header, Streaming/SignalQuality Badge) | 3 | M5, M1 |
| M7 | App.tsx — Visualizer 헤더 + shadcn Tabs 통합 | 1 | M6 |
| M8 | LeadOffBanner 채널별 variant | 1 | M1 |
| M9 | EEG 탭 리스타일 (EEGVisualizer + 6 components) | 7 | M7, M8 |
| M10 | PPG 신규 컴포넌트: PPGFilteredChart, PPGSQIChart, PPGLeadOffBanner | 3 | M3, M4, M8 |
| M11 | PPG 탭 리스타일 + PPGMetricsCards 레이아웃 + 제거 (BpmChart, SpO2Chart) | 2 + 2 삭제 | M10 |
| M12 | Build verify + smoke test | - | M11 |

---

## 5. Risks & Mitigations

| 리스크 | 대응 |
|---|---|
| Windows FS 대소문자 충돌 (`Card.tsx` vs `card.tsx`) | legacy를 `ui/legacy/`로 격리 |
| ACC 탭 import 경로 변경이 "동결" 위반 여부 | 1-line path change만, 시각/기능 무변경 (Plan §3.2에 명시) |
| PPG 필터 warm-up 구간에 0 출력 → 초기 시각 이상 | transient 샘플 수 50개 정도로 짧게 (PPG 50Hz × 1초) |
| shadcn `tailwind.config.ts`와 우리 Tailwind v4 호환성 | shadcn은 v4 지원 (`components.json` 설정 조정), 문제 시 v3 프리셋 수동 이식 |
| SSE signalQuality가 채널 단일값 → PPG SQI 두 차트 동일 | 의도된 동작, 설명 툴팁에 기재 |
| `BpmChart`/`SpO2Chart` 제거 시 history 데이터 소실 우려 | HRV 카드의 BPM 카드에 marker로 대체 (BPM 카드만 상태 표시) |
| Tailwind 토큰(`bg-bg-card` 등) → 레퍼런스 raw Tailwind(`bg-black`) 혼용 | EEG/PPG는 신규 raw Tailwind 적용, ACC는 토큰 유지 (legacy 경로) |

---

## 6. Out of Scope

- 백엔드 SSE payload 변경
- ACC 탭 기능·시각 변경 (레퍼런스 ACC UI 미적용)
- 새로운 센서/지표 추가
- 국제화 (i18n) 전환 — 현재 ko/en 혼용 유지
- 다크/라이트 테마 토글 (다크만)
- 유닛 테스트 작성
- Pencil MCP 기반 design token 잠금

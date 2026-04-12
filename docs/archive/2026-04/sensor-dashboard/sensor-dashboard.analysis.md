# Analysis: sensor-dashboard (Check Phase)

| Field | Value |
|---|---|
| Feature | sensor-dashboard |
| Plan | docs/01-plan/features/sensor-dashboard-rebuild.plan.md |
| Design | docs/02-design/features/sensor-dashboard.design.md |
| Analysis Date | 2026-04-11 |
| **Overall Match Rate** | **98%** ✅ |

## Context Anchor

| 항목 | 내용 |
|---|---|
| **WHY** | LinkBand 본앱 수준 시각화 + 확장 가능한 Clean Architecture |
| **WHO** | LuxAcademy 학생/교사 |
| **RISK** | echarts 초기화 중복, DSP 로직이 store에 섞임, 시각 패턴 드리프트 |
| **SUCCESS** | 레이어 경계 명확 · 차트/DSP/어댑터 재사용 · 기존 UX 픽셀 동일 · build 통과 |
| **SCOPE** | 프론트엔드 리팩터, 백엔드 변경 없음 |

---

## 1. Match Rate Breakdown

| Axis | Rate | Weight | Contribution |
|---|---|---|---|
| Structural | 100% | 0.20 | 20.0 |
| Functional Depth | 95% | 0.40 | 38.0 |
| Contract (Dataflow) | 100% | 0.40 | 40.0 |
| **Overall** | | | **98.0%** |

Formula: static-only (`Structural × 0.2 + Functional × 0.4 + Contract × 0.4`).

---

## 2. Structural Match — 100%

모든 51개 파일 경로 Design §2 대상과 정확히 일치.

| Layer | Expected | Found | Status |
|---|---|---|---|
| `lib/dsp/` | biquad, eegPipeline, spectrum | 3/3 | ✅ |
| `lib/charts/` | echartsRegistry, theme, BaseChart, optionBuilders | 4/4 | ✅ |
| `lib/sensors/` | types, {eeg,ppg,acc}Adapter | 4/4 | ✅ |
| `lib/thresholds/` | indexThresholds.ts | 1/1 | ✅ |
| `stores/slices/` | eeg/ppg/acc/battery/stats (+index) | 5/5 | ✅ |
| `components/ui/` | Card, SectionHeader, InfoBadge, MetricCard, WaitingState | 5/5 | ✅ |
| `components/eeg/` | 8 files (Design §2 target) | 8/8 | ✅ |
| `components/ppg/` | 5 files | 5/5 | ✅ |
| `components/acc/` | 4 files | 4/4 | ✅ |
| `components/layout/` | 4 files | 4/4 | ✅ |
| Legacy deletions | sensorDataStore.ts, eegPower.ts, lib/indexThresholds.ts | 0 remaining | ✅ |

---

## 3. Functional Depth — 95%

| # | Check | Result |
|---|---|---|
| F1 | `echarts.use(...)` only in registry | ✅ (단 1회 호출, `echartsRegistry.ts:13`) |
| F2 | `echarts.init(` in 컴포넌트 파일 없음 | ✅ (0 matches) |
| F3 | legacy `sensorDataStore` 참조 없음 | ✅ (0 matches) |
| F4 | 8개 차트 컴포넌트 모두 `BaseChart` 사용 | ✅ (RawData/SQ/PowerSpectrum/PPGRaw/Bpm/SpO2/AccRaw/AccMagnitude) |
| F5 | `lib/dsp/` — React/Zustand import 없음 | ✅ (pure domain) |
| F6 | `lib/sensors/` — React/Zustand import 없음 | ✅ (pure domain) |
| F7 | `PPGMetricsCards`가 `ui/MetricCard` 사용 (local 정의 제거) | ✅ (13+ uses) |
| F8 | `EEG/IndexCards`가 `ui/MetricCard` 사용 | ✅ |
| F9 | `useSSEConnection`이 5개 slice로 분배 | ✅ |
| F10 | `Footer`가 `useStatsStore` 사용 | ✅ |

**−5% 감점**: G1 (아래) — `accRaw` / `accelerometer` 네이밍 드리프트(pre-existing). 실제 동작 정상이지만 문서-코드 불일치.

---

## 4. Contract (Internal Dataflow) — 100%

HTTP API 없음. 대신 SSE → adapter → slice 데이터플로우 검증:

| Flow | Location | Status |
|---|---|---|
| SSE payload shape `SensorPayload` | `types/sensor.ts` | ✅ |
| `JSON.parse` → `dispatchPayload` | `useSSEConnection.ts:84-92` | ✅ |
| 각 branch가 올바른 slice ingest 호출 | `useSSEConnection.ts:16-39` | ✅ |
| 5개 slice의 ingest 액션 존재 | `stores/slices/*.ts` | ✅ |
| Reset 흐름 (`resetAllSlices` + `resetConnection`) | `useSSEConnection.ts:42-48,108-113` | ✅ |

---

## 5. Success Criteria (Plan §2)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| SC-1 | SSE URL 즉시 연결 | ✅ Met | `ConnectPanel.tsx` → `useSSEConnection.connect()` → `new EventSource()` |
| SC-2 | EEG 7+ 컴포넌트 실시간 렌더링 | ✅ Met | 8 파일 (Plan은 7, 실구현 8 — LeadOffBanner + IndexTooltip 확장) |
| SC-3 | PPG 4 컴포넌트 | ✅ Met | PPGVisualizer + 4 charts/cards |
| SC-4 | ACC 3 컴포넌트 | ✅ Met | ACCVisualizer + AccRaw + AccMagnitude + MotionCards |
| SC-5 | 탭 전환 시 데이터 유지 | ✅ Met | Zustand 전역 slice 유지 |
| SC-6 | Mock 뱃지 | ✅ Met | `setIsMock(url.includes('mock'))`; ConnectPanel에서 뱃지 렌더 |
| SC-7 | `npm run build` 통과 | ✅ Met | 641 modules, 415ms, 에러 0 (리팩터 직후 확인됨) |
| SC-8 | Tailwind 다크 테마 | ✅ Met | `bg-bg-card/border/text-text-primary` 패턴 전체 적용 |

**SC Pass Rate: 8/8 = 100%**

---

## 6. Decision Record Verification (Design §4)

| # | Decision | Followed | Evidence |
|---|---|---|---|
| D1 | 5 Zustand slice 분리 | ✅ | `stores/slices/` 5 파일 + index |
| D2 | DSP 순수 함수화 | ✅ | `lib/dsp/` React/Zustand import 0 |
| D3 | echarts 단일 registry | ✅ | 전 리포 `echarts.use(` 1회 호출 |
| D4 | BaseChart 공통 래퍼 | ✅ | 8/8 차트 컴포넌트 적용 |
| D5 | MetricCard primitive 통합 | ✅ | PPG (13) + EEG (2) 사용 |
| D6 | thresholds → `lib/thresholds/` 이동 | ✅ | old 경로 삭제 확인 |
| D7 | Filter state eeg slice 내부 캡슐화 | ✅ | `EegBufferState`에 filter 상태 포함 |
| D8 | LeadOffBanner/IndexTooltip 유지 | ✅ | 두 파일 존재 |

**D1~D8: 8/8 = 100%**

---

## 7. Gap List

| # | Severity | Confidence | Description | Location |
|---|:---:|:---:|---|---|
| G1 | Minor | High | Plan §1.3은 SSE 필드를 `accelerometer`로 명시하지만 types/adapter/hook은 `accRaw` 사용. **Pre-existing** (리팩터 이전부터 있던 네이밍 드리프트). 실제 동작 정상. Plan 또는 Design에서 공식 이름 정리 필요. | `types/sensor.ts:73`, `useSSEConnection.ts:30` |
| G2 | Minor | Medium | Plan SC-2는 "EEG 7 컴포넌트", 실구현/Design은 8 (LeadOffBanner + IndexTooltip 추가). Design은 이를 acknowledged. Plan 문서만 정렬 필요. | plan §2 SC-2 |

**Critical/Important gap: 0건**

---

## 8. Checkpoint Decision

Match Rate 98% (기준 90% 초과). 발견된 gap 2건 모두 Minor 수준이며 문서(Plan)-구현 네이밍/카운트 드리프트일 뿐 **동작/품질 문제 없음**.

### 권장 진행
- **그대로 진행** → `/pdca report sensor-dashboard`로 Report 단계 진입
- (선택) G1/G2는 Plan 문서를 간단히 수정하거나 Design에 Note 추가로 추후 해결 가능 (블로커 아님)

---

## 9. Refactor Quality Signals

리팩터가 **회귀 없이 구조만 재정리**되었음을 보여주는 지표:

- ✅ build 통과 (641 modules, 415ms)
- ✅ 레거시 파일 완전 삭제 (0 stale refs)
- ✅ Pure domain 레이어 (`lib/dsp/`, `lib/sensors/`) React/Zustand 독립
- ✅ echarts 중복 등록 제거 (17 컴포넌트 × `echarts.use([...])` → 단일 registry)
- ✅ ~255줄의 init/dispose/resize boilerplate 제거 (BaseChart로 단일화)
- ✅ 3개 카드 primitive 중복 제거 (EEG IndexCards + PPG MetricsCards + ACC MotionCards 일부 → `ui/MetricCard`)

# Analysis: linkband-ui-match (Check Phase)

| Field | Value |
|---|---|
| Feature | linkband-ui-match |
| Plan | docs/01-plan/features/linkband-ui-match.plan.md |
| Design | docs/02-design/features/linkband-ui-match.design.md |
| Analysis Date | 2026-04-12 |
| **Overall Match Rate** | **100%** ✅ |

## Context Anchor

| 항목 | 내용 |
|---|---|
| **WHY** | 공식 sdk.linkband.store와 시각/구조 일치 + PPG 신호 품질 경고 시스템 도입 |
| **WHO** | LuxAcademy 학생/교사, LinkBand 생태계 사용자 |
| **RISK** | Windows FS 대소문자 충돌, ACC 탭 동결, PPG 필터 warm-up, shadcn-Tailwind v4 호환 |
| **SUCCESS** | 3 탭 레퍼런스 일치 (ACC 동결) · PPG 필터/SQI/LeadOff · shadcn Tabs · build 통과 |
| **SCOPE** | 프론트엔드 UI + PPG DSP · ACC 동결 · SSE 스키마 무변경 |

---

## 1. Match Rate Breakdown

| Axis | Rate | Weight | Contribution |
|---|---|---|---|
| Structural | 100% | 0.30 | 30.0 |
| Functional Depth | 100% | 0.70 | 70.0 |
| **Overall** | | | **100.0%** |

Formula: static-only (no HTTP API; internal dataflow verified in Functional).

---

## 2. Structural Match — 100%

| Layer | Required | Found | Status |
|---|---|---|---|
| shadcn config | `components.json` | ✅ | PASS |
| `lib/utils.ts` | `cn()` helper | ✅ | PASS |
| `lib/dsp/ppgPipeline.ts` | HP+LP biquad cascade | ✅ | PASS |
| `hooks/useSignalQuality.ts` | 4단계 union | ✅ | PASS |
| `components/shadcn/*` | card, badge, tabs, button, input | 5/5 | PASS |
| `components/visualizer/*` | VisualizerHeader + Streaming/SignalQuality badges | 3/3 | PASS |
| PPG 신규 | PPGFilteredChart, PPGSQIChart, PPGLeadOffBanner | 3/3 | PASS |
| PPG 삭제 | BpmChart, SpO2Chart, PPGRawChart | 0 remaining | PASS |
| `components/ui/` legacy 유지 | Card, InfoBadge, MetricCard, SectionHeader, WaitingState | 5/5 | PASS |
| 확장 — EEG sq split | `sqCh1`, `sqCh2` in types/adapter/store | ✅ | PASS |
| 확장 — PPG filter buffers | `irFiltered`, `redFiltered`, `irFilter`, `redFilter` | ✅ | PASS |
| `App.tsx` shadcn Tabs | 3 triggers (eeg/ppg/acc) | ✅ | PASS |

**Structural Match = 16/16 = 100%**

---

## 3. Functional Depth — 100%

| # | Check | Result |
|---|---|---|
| F1 | `echarts.use(` only in `echartsRegistry.ts` | ✅ (단 1회) |
| F2 | `echarts.init(` only in `BaseChart.tsx` | ✅ (단 1회) |
| F3 | `sensorDataStore` 참조 0 | ✅ |
| F4 | `BpmChart/SpO2Chart/PPGRawChart` import 0 | ✅ |
| F5 | `lib/dsp/ppgPipeline.ts` React/Zustand 독립 | ✅ (biquad만 import) |
| F6 | `LeadOffBanner` 채널 variant props (`only/context/size/className`) | ✅ |
| F7 | 모든 shadcn 파일 `@/lib/utils` 경로로 `cn` import | ✅ (5/5) |
| F8 | `App.tsx` shadcn tabs + card import | ✅ |
| F9 | `useSignalQuality` → `useEegStore` (sqCh1/rawLeadOff/analysis) + `useConnectionStore` | ✅ |
| F10 | PPG 필터 HP+LP only (노치 없음) | ✅ (`ppgPipeline.ts:13-15`) |

**Functional Depth = 10/10 = 100%**

---

## 4. ACC Freeze Verification — PASS

`src/components/acc/*.tsx` 4 파일 grep 결과:
- `shadcn` import: **0 matches**
- `lucide-react` import: **0 matches**
- `@/` alias: **0 matches**
- 여전히 `../ui/InfoBadge`, `bg-bg-card`, `text-text-primary` 등 legacy 토큰 사용 중

linkband-ui-match 사이클 동안 ACC 파일 완전 무변경 확인 ✅

---

## 5. Success Criteria (Plan §2)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| SC-1 | shadcn installed | ✅ Met | `components.json` + 5 primitive files + `lib/utils.ts` |
| SC-2 | VisualizerHeader + streaming/signal quality 뱃지 | ✅ Met | `VisualizerHeader.tsx:18-19` |
| SC-3 | shadcn Tabs × 3 tabs | ✅ Met | `App.tsx:21-38` — eeg/ppg/acc TabsTrigger |
| SC-4 | EEG per-channel LeadOff banner | ✅ Met | `LeadOffBanner.tsx:43-89` — FP1-only/FP2-only/both |
| SC-5 | PPG Filtered chart (0.5-5Hz) | ✅ Met | `PPGFilteredChart.tsx` reads `irFiltered`/`redFiltered` |
| SC-6 | PPG SQI Ch1/Ch2 | ✅ Met | `PPGSQIChart.tsx` channel prop + sqCh1/sqCh2 |
| SC-7 | PPG LeadOff banner | ✅ Met | `PPGLeadOffBanner.tsx` wraps shared `LeadOffBanner` |
| SC-8 | BpmChart/SpO2Chart 삭제 | ✅ Met | 파일 부재 + import 0 |
| SC-9 | ACC 완전 동결 | ✅ Met | §4 grep 검증 |
| SC-10 | `npm run build` 통과 | ✅ Met | 2374 modules, 945ms, error 0 |

**SC Pass Rate: 10/10 = 100%**

---

## 6. Decision Record Verification (Design §4)

| # | Decision | Followed | Evidence |
|---|---|---|---|
| D1 | shadcn in `components/shadcn/` | ✅ | 5 files there, not `components/ui/` |
| D2 | Legacy `components/ui/` 유지 | ✅ | 5/5 파일 존재 |
| D3 | PPG 필터 HP+LP only | ✅ | `ppgPipeline.ts:13-15` biquad coefs |
| D4 | PPG raw ir/red buffer 유지 | ✅ | types.ts 그대로 유지 |
| D5 | EEG sq → sqCh1/sqCh2 split | ✅ | `types.ts:9-10` |
| D6 | useSignalQuality 4단계 union | ✅ | `useSignalQuality.ts:5` |
| D7 | LeadOffBanner variant 로직 | ✅ | FP1-only/FP2-only/both 분기 |
| D8 | PPGRawChart 삭제 | ✅ | 파일 부재 |
| D9 | BpmChart/SpO2Chart 삭제 | ✅ | 파일 부재 |
| D10 | CategoryTabs dead code 허용 | ✅ | 파일 존재하되 미사용 |
| D11 | `lib/utils.ts` cn() export | ✅ | 5/5 shadcn 파일이 import |
| D12 | `@/*` path alias | ✅ | `tsconfig.json:20-22` + `vite.config.ts:9-10` |

**D1~D12: 12/12 = 100%**

---

## 7. Gap List

| # | Severity | Description |
|---|:---:|---|
| — | — | **None** |

**Critical: 0 · Important: 0 · Minor: 0**

---

## 8. Checkpoint Decision

Match Rate 100% — 기준 90% 크게 초과, 모든 Success Criteria 및 Decision Record 충족. **iterate 불필요**.

→ 바로 **`/pdca report linkband-ui-match`** 진행 가능

---

## 9. Key Files Verified

- `src/App.tsx`
- `src/lib/dsp/ppgPipeline.ts`
- `src/hooks/useSignalQuality.ts`
- `src/components/eeg/LeadOffBanner.tsx`
- `src/components/visualizer/VisualizerHeader.tsx`
- `src/components/ppg/{PPGFilteredChart,PPGSQIChart,PPGLeadOffBanner,PPGMetricsCards,PPGVisualizer}.tsx`
- `src/lib/sensors/types.ts`
- `src/components/acc/ACCVisualizer.tsx` (동결 확인)
- `src/components/shadcn/{card,badge,tabs,button,input}.tsx`
- `components.json`, `tsconfig.json`, `vite.config.ts`

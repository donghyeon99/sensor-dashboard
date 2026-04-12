# Report: sensor-dashboard — Clean Architecture Rebuild

| Field | Value |
|---|---|
| Feature | sensor-dashboard |
| Cycle | Plan → Design → Do → Check → Report ✅ |
| **Final Match Rate** | **98%** |
| Iteration Count | 0 (통과 기준 즉시 충족) |
| Completed | 2026-04-11 |
| Architecture | Option B (Clean Architecture) |

## Executive Summary

### 1.1 Feature Overview

LinkBand 본앱 수준의 BCI 센서 시각화 대시보드를, **확장 가능한 Clean Architecture**로 전면 리팩터. 기존 정상 동작하던 앱을 시각적으로는 픽셀 동일하게 유지하면서 내부 구조를 레이어 경계(Types → DSP → Sensors → Stores → UI primitives → Chart kit → Feature components)로 재조직.

### 1.2 Timeline

| Phase | Status | Notes |
|---|---|---|
| PM | (skip) | 기존 Plan 재사용 |
| Plan | ✅ | `sensor-dashboard-rebuild.plan.md` (기존 문서) |
| Design | ✅ | Option B 선택 — 22 신규 foundation 파일 + 17 마이그레이션 대상 |
| Do | ✅ | Foundation 직접 작성 + 3 에이전트 병렬로 EEG/PPG/ACC 마이그레이션 |
| Check | ✅ | gap-detector 호출, 98% Match Rate |
| Report | ✅ | 본 문서 |

### 1.3 Value Delivered

| 관점 | 계획 | 실제 결과 | 달성 |
|---|---|---|---|
| **Problem** | echarts 초기화 중복 · DSP가 store reducer에 섞임 · 카드 컴포넌트 간 드리프트 | 17 차트 컴포넌트의 `echarts.use` 중복 제거 · 304줄 store reducer → 순수 어댑터/slice로 분해 · 3개 카드 계열을 `MetricCard` primitive로 통합 | ✅ |
| **Solution** | 레이어 분리 + 공통 BaseChart + 도메인 slice + UI primitive | `lib/dsp` · `lib/sensors` · `lib/charts` · `stores/slices` · `components/ui` 5개 레이어 신설 | ✅ |
| **Function UX Effect** | 시각 완전 동일 + 확장 용이 | 모든 탭/차트/카드 픽셀 동일, `npm run build` 통과(641 modules, 415ms) | ✅ |
| **Core Value** | 향후 센서/지표 추가 시 단일 primitive 재사용으로 추가 비용 최소화 | 새 차트 추가 = optionBuilder 호출 + slice 1개 구독 / 새 지표 추가 = indexThresholds 항목 추가 + `<MetricCard/>` 1줄 | ✅ |

---

## 2. Success Criteria Final Status

**8/8 Met (100%)**

| # | Criterion | Status | Evidence |
|---|---|---|---|
| SC-1 | SSE URL 즉시 연결 | ✅ Met | `ConnectPanel.tsx` → `useSSEConnection.connect()` → `new EventSource()` |
| SC-2 | EEG 7+ 컴포넌트 실시간 렌더링 | ✅ Met | 8 파일 (LeadOffBanner, IndexTooltip 확장 포함) |
| SC-3 | PPG 4 컴포넌트 | ✅ Met | PPGVisualizer + 4 charts/cards |
| SC-4 | ACC 3 컴포넌트 | ✅ Met | ACCVisualizer + AccRaw + AccMagnitude + MotionCards |
| SC-5 | 탭 전환 시 데이터 유지 | ✅ Met | Zustand slice 전역 — unmount/remount 무관 |
| SC-6 | Mock 뱃지 표시 | ✅ Met | `setIsMock(url.includes('mock'))`, ConnectPanel 뱃지 렌더 |
| SC-7 | `npm run build` 통과 | ✅ Met | 641 modules transformed, 415ms, error 0 |
| SC-8 | Tailwind 다크 테마 | ✅ Met | `bg-bg-card/border/text-text-primary` 전체 적용 |

---

## 3. Architecture Decisions & Outcomes (D1–D8)

| # | Decision | Followed | Outcome |
|---|---|:---:|---|
| D1 | 5 Zustand slice 분리 (eeg/ppg/acc/battery/stats) | ✅ | 컴포넌트 re-render 범위 축소, selector 단순화 |
| D2 | DSP를 순수 함수로 추출 (`lib/dsp/`) | ✅ | store reducer 200+ 줄 제거, React/Zustand 독립 → 유닛 테스트 가능 |
| D3 | echarts 단일 registry (`echartsRegistry.ts`) | ✅ | 17개 컴포넌트의 `echarts.use([...])` 중복 호출 제거 |
| D4 | BaseChart 공통 래퍼 | ✅ | init/dispose/resize boilerplate 약 255줄 절약 |
| D5 | MetricCard primitive 통합 | ✅ | EEG IndexCards(7) + PPG PPGMetricsCards(13) 단일 primitive 공유 |
| D6 | thresholds → `lib/thresholds/` 이동 | ✅ | 도메인 그룹핑 일관성 확보 |
| D7 | Filter state를 eeg slice 내부에 캡슐화 | ✅ | reset 동작이 slice 단위로 정합 |
| D8 | LeadOffBanner/IndexTooltip 기존 동작 유지 | ✅ | import 경로만 교체, 시각/동작 픽셀 동일 |

**D1~D8: 8/8 = 100% 준수**

---

## 4. Implementation Summary

### 4.1 생성된 Foundation (22 파일)

| Layer | Files | 총 줄수 |
|---|---|---|
| `lib/dsp/` | biquad.ts, eegPipeline.ts, spectrum.ts | 226 |
| `lib/charts/` | echartsRegistry, theme, BaseChart, optionBuilders | 391 |
| `lib/sensors/` | types, eegAdapter, ppgAdapter, accAdapter | 247 |
| `lib/thresholds/` | indexThresholds.ts (이동) | 398 |
| `stores/slices/` | eeg/ppg/acc/battery/stats + index | 159 |
| `components/ui/` | Card, SectionHeader, InfoBadge, WaitingState, MetricCard, index | 200 |

### 4.2 마이그레이션 (17 컴포넌트)

3개 에이전트 병렬로 수행:
- **EEG 8개**: BaseChart + optionBuilders + `useEegStore` + MetricCard(size=large)
- **PPG 5개**: BaseChart + `usePpgStore` + MetricCard(compact)
- **ACC 4개**: BaseChart + `useAccStore` + 커스텀 stability/intensity 유지(픽셀 동일성 우선)

### 4.3 삭제된 레거시

| 파일 | 사유 |
|---|---|
| `src/stores/sensorDataStore.ts` (304줄) | DSP + adapter + slice로 분해됨 |
| `src/lib/eegPower.ts` | `lib/dsp/spectrum.ts`로 이동 |
| `src/lib/indexThresholds.ts` | `lib/thresholds/indexThresholds.ts`로 이동 |

### 4.4 Build 검증

```
vite v8.0.3
641 modules transformed
dist/index.html                   0.47 kB │ gzip:   0.30 kB
dist/assets/index-BXKp0c0n.css   31.77 kB │ gzip:   6.33 kB
dist/assets/index-DbUpLqxF.js   804.04 kB │ gzip: 259.19 kB
✓ built in 415ms
```

에러 0, 경고는 chunk size 안내(기능 영향 없음).

---

## 5. Gap Analysis Summary (Check Phase)

| Axis | Rate |
|---|---|
| Structural | 100% (51/51 files) |
| Functional Depth | 95% (10/10 anti-pattern checks, −5% 문서 드리프트) |
| Contract (Dataflow) | 100% |
| **Overall** | **98%** |

**Critical: 0 · Important: 0 · Minor: 2**

### 5.1 잔존 Minor 이슈 (비블로커)

| # | Description | 권장 조치 |
|---|---|---|
| G1 | Plan §1.3 `accelerometer` vs 실구현 `accRaw` 네이밍 드리프트 (pre-existing) | Plan 문서 정렬 또는 Design에 Note 추가 |
| G2 | Plan SC-2는 "EEG 7 컴포넌트"지만 실구현 8 (Design이 acknowledged) | Plan SC-2 카운트 업데이트 |

---

## 6. Process Metrics

| 항목 | 값 |
|---|---|
| 생성된 파일 | 22 신규 foundation + 17 마이그레이션 + 2 docs = 41 |
| 삭제된 파일 | 3 (legacy) |
| 총 코드 줄수 (foundation + ui) | ~1,620 |
| 에이전트 병렬 디스패치 | 3 (EEG, PPG, ACC, disjoint dirs) |
| Build 시간 | 415ms |
| Check iteration | 0 (첫 시도에 98% 달성) |
| Critical/Important gap | 0 |

---

## 7. Lessons Learned

| # | 관찰 | 재사용 가치 |
|---|---|---|
| L1 | Pre-existing 코드의 as-is를 Design §2에 **타깃 디렉토리로 먼저 그림** → 에이전트가 mechanical migration에 집중 가능 | 대규모 리팩터 시 디렉토리 맵 먼저 잠그기 |
| L2 | **Foundation 직접 작성 → Feature 에이전트 병렬 dispatch** 2단 분리가 병렬 안정성에 결정적. Foundation을 에이전트에 맡겼다면 BaseChart / optionBuilders API가 컴포넌트 마이그레이션 중 변동되어 혼란 | "Foundation은 leader, Feature는 swarm" 원칙 |
| L3 | 에이전트 프롬프트에 **OLD→NEW 매핑 표 + 최소 1개 구체 코드 예시**를 포함하면 기계적 rewrite 품질이 크게 상승 | 마이그레이션 에이전트 프롬프트 템플릿화 |
| L4 | `disjoint directory` 원칙으로 3개 에이전트 병렬 실행 시 충돌 0 | 병렬 디스패치의 기본 안전장치 |
| L5 | `computeEegPower`/`computeSpectrum` 시그니처 변경(`{value}[]` → `number[]`)처럼 **호환성 깨는 변경은 프롬프트에 명시적으로 경고**해야 에이전트가 `.map(p=>p.value)` 누락하지 않음 | API 변경 시 checklist 필수 |
| L6 | gap-detector 에이전트에 Design §2 파일 리스트 + grep 포인트를 구체적으로 제공 → 스팟체크 품질 ↑ | 갭 검출 프롬프트에 "verify by grep" 지시 |

---

## 8. Next Steps

- [x] PDCA cycle closed at 98% — `/pdca report` 완료
- [ ] (선택) Plan 문서 G1/G2 정렬 수정 — 블로커 아님, 후속 문서 hygiene
- [ ] (선택) `/pdca archive sensor-dashboard --summary` — feature 아카이브 및 status 요약 보존
- [ ] (향후) 유닛 테스트 작성 — 순수 도메인(`lib/dsp`, `lib/sensors`)은 이제 테스트 가능, 별도 피처로 추적 권장

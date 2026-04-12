# Plan: Sensor Dashboard Rebuild

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | sensor-dashboard-rebuild |
| Created | 2026-04-10 |
| Level | Dynamic |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 대시보드는 순수 JSX+CSS+Canvas로 구현되어 차트 기능이 제한적이고, EEG 일부 지표만 표시. PPG/ACC 데이터 미시각화 |
| **Solution** | TypeScript + Tailwind + echarts + Zustand 기반 전면 리빌드. EEG/PPG/ACC 3개 카테고리 Visualizer 구현 |
| **Function UX Effect** | 전문적인 실시간 차트(파형, 스펙트럼, 밴드파워), 카드형 지수 표시, 카테고리별 탭 분리로 직관적 모니터링 |
| **Core Value** | 교육용 BCI 대시보드의 데이터 활용도 극대화. 학생/교사가 모든 센서 데이터를 실시간으로 이해하고 분석 가능 |

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 참조 앱(LinkBand 본앱)과 동일한 수준의 시각화를 교육용 대시보드에서 제공하기 위함 |
| **WHO** | LuxAcademy 학생/교사 — BCI 센서 데이터를 모니터링하고 로봇 제어에 활용 |
| **RISK** | 기술 스택 전환(JS→TS, CSS→Tailwind) 시 빌드 설정 복잡도 증가. echarts 번들 크기 |
| **SUCCESS** | 3개 카테고리(EEG/PPG/ACC) 모두 실시간 시각화 작동. SSE 직접 연결 유지. Mock 데이터 구분 표시 |
| **SCOPE** | 프론트엔드 전면 리빌드. 백엔드 변경 없음 (SSE 직접 연결 방식 유지) |

---

## 1. Requirements

### 1.1 기술 스택 전환

| 현재 | 변경 후 |
|------|---------|
| JavaScript (JSX) | TypeScript (TSX) |
| 순수 CSS (App.css) | Tailwind CSS |
| Canvas 2D API (직접 그리기) | echarts (차트 라이브러리) |
| useState/useRef (직접 관리) | Zustand (전역 상태 관리) |
| WebSocket 기반 | EventSource(SSE) 직접 연결 |

### 1.2 데이터 소스

- **SSE 직접 연결**: 프론트엔드에서 `EventSource`로 Cloud SSE API에 직접 연결
- **Connect 패널**: 헤더에 URL 붙여넣기 → 바로 연결
- **Mock 감지**: URL에 `mock` 포함 시 MOCK 뱃지 표시
- **Python 백엔드 불필요** (프론트엔드에서 직접 파싱)

### 1.3 SSE 데이터 구조 (payload)

```json
{
  "type": "connected" | undefined,
  "deviceId": "string",
  "timestamp": number,
  "payload": {
    "eegRaw": [{ "fp1": float, "fp2": float, "signalQuality": int, "leadOff": { "ch1": bool, "ch2": bool }, "timestamp": float }],
    "eegAnalysis": {
      "attention": float, "focusIndex": float, "relaxationIndex": float,
      "stressIndex": float, "cognitiveLoad": float, "emotionalBalance": float,
      "meditationLevel": float, "totalPower": float,
      "movingAverageValues": { ... }
    },
    "ppgAnalysis": { "bpm": float, "spo2": float|null },
    "ppgRaw": [{ "ir": float, "red": float, "timestamp": float }],
    "accRaw": [{ "x": float, "y": float, "z": float, "magnitude"?: float, "timestamp": float }],
    "accAnalysis": { "activityState": string, "intensity": float, "stability": float, "avgMovement": float, "maxMovement": float },
    "battery": { "level": int }
  }
}
```

### 1.4 카테고리별 Visualizer 요구사항

#### EEG Visualizer
| 컴포넌트 | 설명 | 차트 유형 |
|----------|------|-----------|
| FilteredRawDataChart (Ch1) | FP1 채널 실시간 파형 | echarts Line (시계열) |
| FilteredRawDataChart (Ch2) | FP2 채널 실시간 파형 | echarts Line (시계열) |
| SignalQualityChart (Ch1) | FP1 신호 품질 (SQI) | echarts Line (0-100%) |
| SignalQualityChart (Ch2) | FP2 신호 품질 (SQI) | echarts Line (0-100%) |
| PowerSpectrumChart | 주파수 도메인 파워 스펙트럼 (1-45Hz) | echarts Line (dual channel) |
| EEGBandPowerCards | 델타~감마 5밴드 파워 카드 | 카드 + 수직 바 |
| EEGIndexesChart | 7개 분석 지수 카드 (집중, 이완, 스트레스 등) | 카드 그리드 |

#### PPG Visualizer (EEG 패턴 기반 설계)
| 컴포넌트 | 설명 | 차트 유형 |
|----------|------|-----------|
| PPGRawChart | IR/Red 채널 실시간 파형 | echarts Line (dual) |
| BpmChart | 심박수 실시간 추이 | echarts Line |
| SpO2Chart | 산소포화도 실시간 추이 | echarts Line |
| PPGMetricsCards | BPM, SpO2, HRV 지표 카드 | 카드 그리드 |

#### ACC Visualizer (EEG 패턴 기반 설계)
| 컴포넌트 | 설명 | 차트 유형 |
|----------|------|-----------|
| AccRawChart | X/Y/Z 3축 실시간 파형 | echarts Line (triple) |
| AccMagnitudeChart | 합성 가속도 추이 | echarts Line |
| MotionStatusCards | 움직임 상태, 자세 지표 카드 | 카드 그리드 |

### 1.5 레이아웃

- **헤더**: LuxAcademy 로고 + Connect 버튼 (기존 유지)
- **카테고리 탭**: EEG | PPG | ACC 탭 전환
- **메인 영역**: 선택된 카테고리의 Visualizer 렌더링
- **푸터**: 메시지 수, 데이터 레이트, 연결 상태 (기존 유지)

---

## 2. Success Criteria

| # | 기준 | 검증 방법 |
|---|------|-----------|
| SC-1 | SSE URL 붙여넣기로 즉시 연결 | mock URL로 Connect → 데이터 수신 확인 |
| SC-2 | EEG Visualizer 8개 컴포넌트 실시간 렌더링 (Raw×2, SQI×2, Spectrum, BandPower, IndexCards, LeadOffBanner) | echarts 차트에 데이터 표시 확인 |
| SC-3 | PPG Visualizer 4개 컴포넌트 실시간 렌더링 | BPM/SpO2 차트 + 카드 동작 확인 |
| SC-4 | ACC Visualizer 3개 컴포넌트 실시간 렌더링 | X/Y/Z 파형 차트 동작 확인 |
| SC-5 | 카테고리 탭 전환 시 데이터 유실 없음 | 탭 전환 후 복귀 시 차트 유지 |
| SC-6 | Mock 데이터 시 MOCK 뱃지 표시 | URL에 mock 포함 → 뱃지 확인 |
| SC-7 | TypeScript 컴파일 에러 없음 | `npm run build` 성공 |
| SC-8 | Tailwind CSS 적용 확인 | 다크 테마 + 반응형 레이아웃 |

---

## 3. Technical Approach

### 3.1 프로젝트 설정 변경

```bash
# TypeScript + Tailwind 추가
npm install -D typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite

# 차트 + 상태관리 추가
npm install echarts echarts-for-react zustand

# 기존 불필요 패키지 제거
npm uninstall lightweight-charts
```

### 3.2 디렉토리 구조 (목표)

```
src/
├── main.tsx
├── App.tsx
├── App.css                          # Tailwind import
├── index.css                        # Tailwind base
├── types/
│   └── sensor.ts                    # SSE 데이터 타입 정의
├── stores/
│   ├── connectionStore.ts           # SSE 연결 상태
│   └── sensorDataStore.ts           # 센서 데이터 (EEG/PPG/ACC)
├── hooks/
│   └── useSSEConnection.ts          # EventSource 연결 관리
├── components/
│   ├── layout/
│   │   ├── Header.tsx               # 헤더 + Connect 패널
│   │   ├── CategoryTabs.tsx         # EEG | PPG | ACC 탭
│   │   └── Footer.tsx               # 메시지 통계 + 상태
│   ├── connect/
│   │   └── ConnectPanel.tsx         # URL 입력 + 연결/해제
│   ├── eeg/
│   │   ├── EEGVisualizer.tsx        # EEG 탭 메인
│   │   ├── RawDataChart.tsx         # 원시 파형 (Ch1/Ch2)
│   │   ├── SignalQualityChart.tsx   # SQI 차트
│   │   ├── PowerSpectrumChart.tsx   # 파워 스펙트럼
│   │   ├── BandPowerCards.tsx       # 밴드 파워 카드
│   │   └── IndexCards.tsx           # 분석 지수 카드
│   ├── ppg/
│   │   ├── PPGVisualizer.tsx        # PPG 탭 메인
│   │   ├── PPGRawChart.tsx          # IR/Red 파형
│   │   ├── BpmChart.tsx             # 심박수 추이
│   │   ├── SpO2Chart.tsx            # 산소포화도 추이
│   │   └── PPGMetricsCards.tsx      # BPM/SpO2 카드
│   └── acc/
│       ├── ACCVisualizer.tsx        # ACC 탭 메인
│       ├── AccRawChart.tsx          # X/Y/Z 파형
│       ├── AccMagnitudeChart.tsx    # 합성 가속도
│       └── MotionCards.tsx          # 움직임 카드
└── utils/
    └── sseParser.ts                 # SSE payload 파싱
```

### 3.3 Zustand Store 설계

```typescript
// connectionStore: SSE 연결 상태
{ url, connected, isMock, connect(url), disconnect() }

// sensorDataStore: 센서 데이터 버퍼
{
  eeg: { rawBuffer, analysis, signalQuality, bandPower },
  ppg: { rawBuffer, bpm, spo2, bpmHistory },
  acc: { rawBuffer, magnitude, magnitudeHistory },
  battery: { level },
  stats: { messageCount },
  updateFromPayload(payload)
}
```

---

## 4. Implementation Order

| 순서 | 모듈 | 예상 파일 수 | 의존성 |
|------|------|-------------|--------|
| M1 | 프로젝트 설정 (TS, Tailwind, 패키지) | 5 | 없음 |
| M2 | 타입 정의 + Store + SSE Hook | 4 | M1 |
| M3 | 레이아웃 (Header, Tabs, Footer, Connect) | 4 | M2 |
| M4 | EEG Visualizer (7 컴포넌트) | 7 | M2, M3 |
| M5 | PPG Visualizer (4 컴포넌트) | 5 | M2, M3 |
| M6 | ACC Visualizer (3 컴포넌트) | 4 | M2, M3 |
| M7 | App.tsx 통합 + 빌드 검증 | 2 | M3~M6 |

---

## 5. Risks & Mitigations

| 리스크 | 대응 |
|--------|------|
| echarts 번들 크기 (500KB+) | tree-shaking 적용, 필요한 차트 모듈만 import |
| SSE payload에 ACC 데이터 없을 수 있음 | 데이터 없으면 "연결 대기" 상태 표시 |
| 실시간 차트 성능 (다수 echarts 인스턴스) | requestAnimationFrame 제한, sampling:'lttb' 적용 |
| Tailwind 전환 시 기존 디자인 톤 변경 | 현재 CSS 변수 색상을 tailwind.config에 매핑 |

---

## 6. Out of Scope

- 백엔드(Python) 변경
- 데이터 저장/내보내기 기능
- 로봇 제어 인터페이스
- PWA/오프라인 지원
- Firebase 연동
- 사용자 인증

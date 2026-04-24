# LuxAcademy Sensor Dashboard — 구현 발표 가이드

> 이 문서는 여러분이 **"제가 이 대시보드를 이렇게 구현했습니다"**라고 발표할 때
> 어디를 가리키며 설명할지, 어느 포인트를 자랑하면 좋을지 정리한 자료입니다.
> 복잡한 신호처리 부분은 Claude의 도움을 받아 작성했지만,
> **어떤 구조로 돌아가는지, 왜 그렇게 만들었는지**는 여러분이 직접 이해하고 설명할 수 있어야 합니다.

---

## 1. 프로젝트 개요 — "무엇을 만들었는가"

**LuxAcademy Sensor Dashboard**는 LinkBand 뇌파 헤드셋에서 오는 실시간 센서 데이터를 웹 브라우저에서 시각화하는 대시보드입니다.

- **EEG(뇌파, 2채널 FP1/FP2, 250Hz)** — 필터 파형, 신호품질, 파워 스펙트럼, 밴드 파워(Delta/Theta/Alpha/Beta/Gamma), 집중·이완·스트레스 등 분석 지표
- **PPG(맥박, IR/Red, 50Hz)** — 필터 파형, 신호품질, 심박수(BPM), HRV 메트릭
- **ACC(가속도, X/Y/Z, 30Hz)** — 3축 파형, magnitude, 움직임 상태

발표 한 줄 요약:
> "저희는 **React + TypeScript + ECharts**로 실시간 생체신호 대시보드를 만들었고,
> **SSE(Server-Sent Events)**로 센서 데이터를 받아 **디지털 신호처리**를 거쳐 차트로 그립니다."

---

## 2. 전체 데이터 흐름도 (발표할 때 꼭 보여주세요)

```
┌────────────────────────┐
│ LinkBand 뇌파 헤드셋    │   실제 하드웨어 (Bluetooth)
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Broadcast Server (GCP) │   외부 SSE 서버 — 우리가 만든 게 아님
│ (SSE 스트림 제공)       │
└──────────┬─────────────┘
           │ HTTP SSE (Server-Sent Events)
           │ JSON 패킷이 초당 여러 번 흘러옴
           ▼
┌─────────────────────────────────────────────┐
│ ① 수신 (EventSource API)                    │  src/hooks/useSSEConnection.ts
│   └ 브라우저에서 직접 SSE 스트림 구독        │
└──────────┬──────────────────────────────────┘
           │ raw 샘플 배열 + 분석 결과
           ▼
┌─────────────────────────────────────────────┐
│ ② 프레임 페이싱 (requestAnimationFrame)     │  src/hooks/useSSEConnection.ts
│   └ 불규칙 버스트를 60fps 일정 속도로 평탄화 │
└──────────┬──────────────────────────────────┘
           │ 프레임당 정해진 개수씩 꺼냄
           ▼
┌─────────────────────────────────────────────┐
│ ③ DSP (디지털 신호처리)                     │  src/lib/dsp/*,
│   └ Biquad 필터, SQI, DFT, Morlet 웨이블릿  │  src/lib/sensors/*
└──────────┬──────────────────────────────────┘
           │ 필터링된 데이터 + 지표
           ▼
┌─────────────────────────────────────────────┐
│ ④ 상태 저장소 (Zustand)                     │  src/stores/slices/*
│   └ eegStore / ppgStore / accStore          │
└──────────┬──────────────────────────────────┘
           │ React 컴포넌트 구독
           ▼
┌─────────────────────────────────────────────┐
│ ⑤ 시각화 (ECharts + React)                  │  src/components/*
│   └ 실시간 차트, 메트릭 카드, 지표 표시      │
└─────────────────────────────────────────────┘
```

**발표 포인트**: "데이터가 **다섯 단계**를 거쳐 화면에 나타납니다 — 수신, 페이싱, 신호처리, 저장, 렌더링."

---

## 3. 발표 핵심 포인트 (여기를 강조하세요)

### 🎯 포인트 1 — 실시간 스트리밍을 어떻게 받는가
**"SSE로 JSON 패킷이 계속 흘러들어옵니다."**

- 보여줄 파일: **`src/hooks/useSSEConnection.ts`**
- 핵심 코드: `new EventSource(sseUrl)` → `es.onmessage`에서 JSON 파싱
- 왜 SSE인가? HTTP 기반이라 방화벽 친화적, 브라우저 내장 API라 별도 라이브러리 불필요, 자동 재연결 지원.

### 🎯 포인트 2 — 들어온 데이터가 어떻게 생겼나
**"센서마다 샘플레이트가 다르고, raw 배열과 분석 결과가 같이 옵니다."**

- 보여줄 파일: **`src/types/sensor.ts`**
- 핵심 타입: `SensorPayload` — 이 한 덩어리에 EEG/PPG/ACC raw 배열 + 분석 지표 + 배터리까지 다 들어옴.
- 한 패킷 예시:
  ```json
  {
    "payload": {
      "eegRaw": [{ "fp1": 12.3, "fp2": -8.1, ... }, ...250Hz],
      "eegAnalysis": { "attention": 0.72, "focusIndex": 0.58, ... },
      "ppgRaw": [...50Hz],
      "ppgAnalysis": { "bpm": 74, "spo2": 98 },
      "accRaw": [...30Hz],
      "battery": { "level": 76 }
    }
  }
  ```

### 🎯 포인트 3 — 왜 바로 차트에 그리지 않고 "페이싱"을 하는가 ⭐
**"SSE는 불규칙한 버스트로 들어오는데, 차트는 일정 속도로 그려야 자연스럽습니다."**

- 보여줄 파일: **`src/hooks/useSSEConnection.ts`** 의 `drainQueue()` 함수
- 문제 상황:
  - PPG는 "14샘플 → 280ms 쉬고 → 14샘플 → 280ms 쉬고…" 이런 식으로 옴
  - 그대로 그리면 차트가 "와르르 → 멈춤 → 와르르 → 멈춤" 부자연스러움
- 해결 방법:
  1. 수신 샘플을 **큐(FIFO)**에 쌓음
  2. `requestAnimationFrame`으로 매 프레임 호출되는 `drainQueue()`가
  3. **경과시간 × 샘플레이트** 만큼만 꺼내서 스토어에 씀
  4. 짧은 공백엔 **마지막 샘플을 반복(hold-last)**해서 차트가 멈추지 않게
- **발표 한 줄**: "이 부분이 저희 대시보드에서 가장 까다로웠습니다. 불규칙한 입력을 부드러운 60fps 출력으로 바꾸기 위해 프레임 페이서를 직접 구현했습니다."

### 🎯 포인트 4 — 신호처리는 어떻게 하는가
**"raw 데이터는 노이즈가 많아 그대로 쓸 수 없어서 필터를 거칩니다."**

- 보여줄 파일: **`src/lib/dsp/biquad.ts`**, **`src/lib/dsp/eegPipeline.ts`**, **`src/lib/dsp/ppgPipeline.ts`**
- EEG: **60Hz 노치(전력선 노이즈 제거) → 1Hz 하이패스(DC 드리프트 제거) → 45Hz 로우패스(고주파 제거)** 3단 캐스케이드
- PPG: **0.5Hz 하이패스 → 5Hz 로우패스** 밴드패스 (심박 대역만 통과)
- **Biquad 필터**: RBJ 쿡북 수식 기반 2차 IIR 필터. 같은 틀로 notch/HP/LP/BP 다 만듦.
- **발표 한 줄**: "수학적으로는 **RBJ Audio EQ Cookbook**의 Biquad 필터 수식을 그대로 구현했고, Claude가 이 부분을 도와줬습니다."

### 🎯 포인트 5 — 신호 품질(SQI)은 어떻게 판단하는가
**"전극이 잘 붙었는지, 신호가 깨끗한지 실시간으로 점수를 매깁니다."**

- 보여줄 파일: **`src/lib/sensors/eegAdapter.ts`**, **`src/lib/sensors/ppgAdapter.ts`**
- 원리: 필터링된 신호에 슬라이딩 윈도우 씌워서 **진폭이 임계치를 벗어나는 비율**을 계산 → 0~100% 점수
- 발표 포인트: "전극이 피부에 제대로 안 닿으면 이 점수가 떨어져서 경고 배너가 뜹니다."

### 🎯 포인트 6 — 뇌파 밴드 파워는 어떻게 계산하는가
**"Delta/Theta/Alpha/Beta/Gamma 각 주파수 대역의 세기를 따로 구합니다."**

- 보여줄 파일: **`src/lib/dsp/spectrum.ts`**
- 두 가지 분석:
  1. **DFT(이산 푸리에 변환)** — 1~45Hz 스펙트럼 그래프용
  2. **Morlet 웨이블릿** — 특정 주파수 대역의 파워를 정밀하게 추정 → 밴드 파워 카드용
- **발표 한 줄**: "각 뇌파 대역이 어떤 상태를 의미하는지도 표시합니다 — Alpha는 이완, Beta는 집중, Gamma는 고차 인지."

### 🎯 포인트 7 — 상태 관리는 왜 Zustand인가
**"컴포넌트 수십 개가 같은 데이터를 봐야 해서 전역 스토어가 필요합니다."**

- 보여줄 파일: **`src/stores/slices/eegStore.ts`** 등
- 왜 Redux가 아닌 Zustand? → 보일러플레이트가 적고, 컴포넌트 바깥(프레임 페이서)에서도 `useEegStore.getState()`로 쉽게 접근 가능.
- 도메인별로 슬라이스 분리: `eegStore`, `ppgStore`, `accStore`, `batteryStore`, `statsStore`, `connectionStore`.

### 🎯 포인트 8 — 차트는 어떻게 그리나
**"ECharts를 React 수명주기에 맞게 감쌌습니다."**

- 보여줄 파일: **`src/lib/charts/BaseChart.tsx`**, **`src/lib/charts/optionBuilders.ts`**
- 공통 베이스 컴포넌트가 ECharts 인스턴스 생성·정리·리사이즈를 관리 → 각 차트 컴포넌트는 옵션만 넘김.
- 실시간 업데이트는 `chart.setOption({ ... })`으로 부분 갱신.

---

## 4. 발표 때 가리키며 설명할 주요 코드 파일

아이들이 발표 시 손으로 짚으면서 설명할 수 있도록 **역할별로 정리**했습니다.

### 📂 입구 (데이터가 들어오는 곳)
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/components/connect/ConnectPanel.tsx` | "Connect" 버튼 UI — 사용자가 SSE 주소를 입력하고 연결을 시작하는 지점 |
| **`src/hooks/useSSEConnection.ts`** ⭐ | SSE 구독 + 프레임 페이서 + 스토어 분배 — **핵심 엔트리 포인트** |
| `src/types/sensor.ts` | 들어오는 데이터의 TypeScript 타입 정의 |

### 📂 신호처리 (DSP)
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/lib/dsp/biquad.ts` | Biquad 필터 수식 (notch / HP / LP / BP) |
| `src/lib/dsp/eegPipeline.ts` | EEG 전용 필터 체인 + SQI |
| `src/lib/dsp/ppgPipeline.ts` | PPG 전용 밴드패스 + SQI |
| `src/lib/dsp/spectrum.ts` | DFT 스펙트럼 + Morlet 웨이블릿 밴드 파워 |
| `src/lib/sensors/eegAdapter.ts` | raw → 필터링 → SQI 버퍼 관리 (EEG) |
| `src/lib/sensors/ppgAdapter.ts` | raw → 필터링 → SQI + BPM 히스토리 (PPG) |
| `src/lib/sensors/accAdapter.ts` | raw → magnitude 계산 (ACC) |

### 📂 상태 저장소
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/stores/connectionStore.ts` | 연결 상태, SSE URL, 에러 메시지 |
| `src/stores/slices/eegStore.ts` | EEG 버퍼 + 분석 지표 |
| `src/stores/slices/ppgStore.ts` | PPG 버퍼 + BPM/SpO₂ 히스토리 |
| `src/stores/slices/accStore.ts` | ACC 3축 버퍼 + magnitude |
| `src/stores/slices/batteryStore.ts` | 배터리 잔량 |
| `src/stores/slices/statsStore.ts` | 수신 패킷 카운터 |

### 📂 화면 (UI)
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/App.tsx` | 최상위 레이아웃 + EEG/PPG/ACC 탭 전환 |
| `src/components/layout/Header.tsx` | 상단 헤더 + Connect 버튼 배치 |
| `src/components/eeg/EEGVisualizer.tsx` | EEG 페이지 (파형·SQI·스펙트럼·밴드 파워·분석 지표) |
| `src/components/ppg/PPGVisualizer.tsx` | PPG 페이지 (필터 파형·SQI·HRV 카드) |
| `src/components/acc/ACCVisualizer.tsx` | ACC 페이지 (3축 파형·magnitude·움직임 분석) |
| `src/components/eeg/RawDataChart.tsx` | 필터링된 EEG 파형 차트 |
| `src/components/eeg/SignalQualityChart.tsx` | SQI 실시간 차트 |
| `src/components/eeg/PowerSpectrumChart.tsx` | 파워 스펙트럼 차트 |
| `src/components/eeg/BandPowerCards.tsx` | Delta/Theta/Alpha/Beta/Gamma 카드 |
| `src/components/eeg/IndexCards.tsx` | 집중·이완·스트레스 등 지표 카드 |
| `src/components/ppg/PPGFilteredChart.tsx` | 필터링된 PPG 파형 |
| `src/components/ppg/PPGMetricsCards.tsx` | HRV·BPM·SpO₂ 카드 |
| `src/components/acc/AccRawChart.tsx` | 3축 raw 파형 |
| `src/components/acc/AccMagnitudeChart.tsx` | magnitude 차트 |
| `src/lib/charts/BaseChart.tsx` | 모든 차트의 공통 껍데기 (ECharts 수명주기 관리) |
| `src/lib/charts/optionBuilders.ts` | 차트 옵션 공통 빌더 |

---

## 5. 사용한 기술과 라이브러리

### 프론트엔드 스택
| 라이브러리 | 용도 | 발표 포인트 |
|-----------|------|-------------|
| **React 19** | UI 프레임워크 | 함수형 컴포넌트 + Hooks로 선언적 UI |
| **TypeScript** | 정적 타입 | 센서 데이터 스키마를 타입으로 보장 |
| **Vite** | 빌드 도구 | 초고속 HMR로 실시간 차트 개발 편리 |
| **Zustand** | 상태 관리 | Redux보다 가볍고, 컴포넌트 밖에서도 접근 가능 |
| **ECharts** | 차트 엔진 | 고성능 캔버스 렌더링, 대량 데이터 처리에 강함 |
| **Tailwind CSS** | 스타일링 | 유틸리티 클래스 기반 빠른 UI 개발 |
| **Radix UI** | 접근성 컴포넌트 | 키보드 내비·스크린리더 지원되는 Tabs |

### 브라우저 네이티브 API
| API | 용도 |
|-----|------|
| **EventSource** | SSE 스트림 구독 (별도 라이브러리 없이 브라우저 내장) |
| **requestAnimationFrame** | 60fps 프레임 동기 렌더링 |
| **localStorage** | 마지막 접속 SSE URL 기억 |

### 꼭 알아야 할 용어 (발표 중 질문 대비)
| 용어 | 한 줄 설명 |
|------|-----------|
| **SSE (Server-Sent Events)** | HTTP 기반 단방향 실시간 스트림. WebSocket보다 간단 |
| **EEG / PPG / ACC** | 뇌파 / 맥박 / 가속도 |
| **FP1, FP2** | 이마 왼쪽·오른쪽 전극 위치 (국제 10-20 시스템) |
| **Biquad 필터** | 2차 IIR 디지털 필터. 필터 종류 상관없이 같은 수식틀 |
| **SQI (Signal Quality Index)** | 신호 품질 점수 (0~100) |
| **DFT / 웨이블릿** | 시간 → 주파수 도메인 변환 (스펙트럼 분석) |
| **Delta/Theta/Alpha/Beta/Gamma** | 뇌파 주파수 대역 (깊은 수면~고차 인지) |
| **HRV** | 심박변이도 (Heart Rate Variability) |
| **Frame pacing** | 불규칙 입력을 일정 주기로 평탄화하는 기법 |

---

## 6. Claude(AI)와의 협업 방식 — "어디까지 우리가 했고, 어디를 Claude가 도왔는가"

발표에서 "AI를 썼다"고 했을 때 "그럼 너희는 뭘 한 거야?"라는 질문이 올 수 있으니,
**우리 몫**과 **Claude의 몫**을 명확히 구분해서 말할 수 있어야 합니다.

### 👥 우리가 직접 한 것
- **전체 구조 설계**: 5단계 데이터 흐름(수신→페이싱→DSP→저장→렌더) 구조 결정
- **요구사항 정의**: 어떤 차트를 어떤 레이아웃으로 보여줄지, 어떤 지표를 강조할지
- **UI/UX 설계**: EEG/PPG/ACC 탭 구조, 카드 배치, 색상·아이콘
- **통합 및 디버깅**: 각 조각이 연결됐을 때 생기는 문제(예: SSE 버스트 → 차트 끊김) 발견
- **프레임 페이싱 아이디어**: "차트가 끊겨 보여요" 문제를 정의하고 해결 방향 제시

### 🤖 Claude가 도와준 것
- **Biquad 필터 수식 구현**: RBJ Audio EQ Cookbook 기반 계수 계산 코드
- **DFT / Morlet 웨이블릿 수학**: 주파수 분석 알고리즘 구현
- **SQI 슬라이딩 윈도우 최적화**: 매번 전체 재계산 대신 증분 계산으로 바꿈
- **TypeScript 타입 설계 제안**: `DataPoint`, `SensorPayload` 등 공통 타입 구조
- **버그 원인 분석**: "왜 차트가 멈추나?" 같은 문제의 원인(HMR 중 EventSource 누수 등) 분석
- **주석과 문서화**: 왜 이렇게 짰는지 설명하는 주석 보강

### 발표 한 줄
> "저희는 **어떤 기능이 필요한지, 어떻게 연결할지**를 설계했고,
> **수학적으로 어려운 부분(필터 수식, 주파수 분석)**은 Claude에게 구현을 맡긴 뒤 작동을 검증했습니다.
> 덕분에 전문 지식이 부족해도 실제로 쓸 수 있는 수준의 대시보드를 만들 수 있었습니다."

---

## 7. 실행 방법 (시연용)

```bash
npm install         # 의존성 설치
npm run dev         # 개발 서버 → http://localhost:5173
```

브라우저 접속 후 우측 상단 **Connect** 버튼을 눌러 SSE URL 입력 → 실시간 차트가 흐르기 시작.

---

## 8. 발표 리허설용 5줄 스크립트 (복붙해서 연습하세요)

1. "LinkBand 뇌파 헤드셋에서 오는 실시간 데이터를 웹 대시보드로 시각화했습니다."
2. "데이터는 **SSE**로 받고, 불규칙하게 들어오기 때문에 **프레임 페이서**로 부드럽게 그립니다."
3. "원본 신호는 노이즈가 많아서 **Biquad 필터**로 정제한 뒤, **DFT와 웨이블릿**으로 주파수 분석을 합니다."
4. "처리된 데이터는 **Zustand 스토어**에 저장되고, **ECharts**로 실시간 차트를 그립니다."
5. "수학적으로 어려운 부분은 **Claude**의 도움을 받았지만, 전체 구조 설계와 통합은 저희가 직접 했습니다."

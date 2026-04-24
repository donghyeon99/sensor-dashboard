# LuxAcademy Sensor Dashboard — 구현 발표 가이드

> 대시보드 구현 발표 문서
> 복잡한 신호처리 부분은 Claude의 도움을 받아 작성했지만,
> **어떤 구조로 돌아가는지, 왜 그렇게 만들었는지**는 여러분이 직접 이해하고 설명할 수 있어야 함.

---

## 1. 프로젝트 개요 — "무엇을 만들었는가"

**LuxAcademy Sensor Dashboard**는 LinkBand 뇌파 헤드셋에서 오는 실시간 센서 데이터를 웹 브라우저에서 시각화하는 대시보드이다. 현재 들어오는 데이터는 아래 3가지이다.

- **EEG(뇌파)** — 2채널 파형, 신호품질, 파워 스펙트럼, 밴드 파워, 집중·이완·스트레스 지표
- **PPG(맥박)** — 필터 파형, 신호품질, 심박수(BPM), HRV 메트릭
- **ACC(가속도)** — 3축 파형, magnitude, 움직임 상태

발표용:
> "**React + TypeScript + ECharts**로 실시간 생체신호 대시보드를 만들었고,
> **SSE**로 센서 데이터를 받아 **디지털 신호처리**를 거쳐 차트로 그린 뒤,
> **Vercel**로 웹에 배포"

- **React**: 화면을 조립식 블록(컴포넌트)처럼 만들 수 있게 해주는 UI 라이브러리
- **TypeScript**: 데이터의 타입(종류)을 미리 정해두어 실수를 잡아주는 '똑똑한 자바스크립트'
- **ECharts**: 실시간 차트를 빠르게 그려주는 라이브러리
- **SSE (Server-Sent Events)**: 서버가 브라우저에게 데이터를 계속 보내주는 기술
- **디지털 신호처리**: 지저분한 센서 신호를 수학적 계산으로 깨끗하게 다듬는 방법(필터링)
- **Vercel**: GitHub 코드를 자동으로 웹에 띄워주는 서비스
---

## 2. 전체 데이터 흐름도

```
┌────────────────────────┐
│ LinkBand 뇌파 헤드셋    │   실제 하드웨어 (Bluetooth)
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Broadcast Server       │   외부 SSE 서버 (우리가 만든 게 아님)
│  (SSE 스트림 제공)      │
└──────────┬─────────────┘
           │ HTTP SSE — JSON 패킷이 초당 여러 번 흘러옴
           ▼
┌─────────────────────────────────────────────┐
│ ① 수신                                       │
│   브라우저가 SSE를 구독해서 데이터를 받음     │  src/hooks/useSSEConnection.ts
└──────────┬──────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────┐
│ ② 차트에 부드럽게 보여주기 (= 페이싱)         │
│   "한꺼번에 온 데이터 → 차트 끊김"을           │  src/hooks/useSSEConnection.ts
│   "일정 속도로 부드럽게"로 바꿈                │
└──────────┬──────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────┐
│ ③ 신호처리 (DSP)                             │
│   노이즈 필터, 품질 점수, 주파수 분석         │  src/lib/dsp/*, src/lib/sensors/*
└──────────┬──────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────┐
│ ④ 데이터 저장 (Zustand)                      │
│   EEG/PPG/ACC 별 저장소에 넣어둠              │  src/stores/slices/*
└──────────┬──────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────┐
│ ⑤ 화면 그리기 (ECharts + React)              │
│   실시간 차트와 카드로 표시                  │  src/components/*
└─────────────────────────────────────────────┘
```

- **페이싱**: 데이터가 들쭉날쭉 오지만, 차트는 매끄럽게 흘러야 해서 중간에서 속도를 맞춰주는 장치
- **EEG (뇌파)**: 실제 센서 데이터 주기 250Hz — 초당 약 250개 샘플. 서버에 SSE로 날라오는 데이터는 한 패킷에 약 25개씩 뭉쳐서 도착.
- **PPG (맥박)**: 실제 센서 데이터 주기 50Hz — 초당 약 50개 샘플. 서버에 SSE로 날라오는 데이터는 한 패킷에 약 14개씩, 약 280ms 간격으로 도착
- **ACC (가속도)**: 실제 센서 데이터 주기 30Hz — 초당 약 30개 샘플. 서버에 SSE로 날라오는 데이터는 패킷 간격이 불규칙하며, 최대 3초까지 비는 경우도 있음
---

## 3. 발표 핵심 포인트

중요한 포인트 **네 가지**만 짧은 코드와 함께 설명할 수 있으면 충분.

### 🎯 포인트 1 — 데이터를 어떻게 받는가 (SSE)

**"서버가 계속 흘려보내는 JSON을 브라우저가 듣고 있다가, 올 때마다 받아서 처리."**

- **SSE(Server-Sent Events)**는 서버가 먼저 데이터를 보내주고 브라우저는 받기만 하는 단방향 HTTP 스트림.
- 브라우저에 내장된 **`EventSource`** API를 쓰면 별도 라이브러리 없이 한 줄로 구독할 수 있다.
- 받은 JSON은 곧바로 각 센서 저장소(EEG/PPG/ACC)로 분배한다.

📍 **보여줄 파일**: `src/hooks/useSSEConnection.ts`

```typescript
// 1) SSE 서버 주소로 연결 생성
//    "나 이 주소의 데이터를 구독할게"라고 브라우저가 서버에 알림
const es = new EventSource(sseUrl)

// 2) 서버가 데이터를 보낼 때마다 이 콜백이 자동 호출됨
es.onmessage = (event) => {
  // 3) 문자열로 온 JSON을 자바스크립트 객체로 변환
  const data = JSON.parse(event.data)

  // 4) payload(실제 센서 데이터)가 있으면 각 센서 파이프라인으로 전달
  //    → 이후 필터링(포인트 2) → 분석(포인트 3) → 그리기(포인트 4) 순으로 흘러감
  if (data.payload) dispatchPayload(data.payload)
}
```

💡 **발표 한 줄**: "서버가 데이터를 보내주면 `onmessage` 콜백이 호출되면서 브라우저가 받아 처리."

---

### 🎯 포인트 2 — 데이터 필터링: 노이즈는 어떻게 제거하는가 (필터)

**"센서에서 나오는 원본 신호는 지직거려서 그대로 쓸 수 없음. 그래서 필터로 깨끗하게 만듦."**

- 뇌파에는 **60Hz 전력선 노이즈**, **천천히 드리프트하는 기저선**, **너무 높은 주파수 잡음**이 섞여 있음.
- 이걸 **세 개의 필터를 순서대로** 통과시켜서 깨끗한 뇌파만 남김.
- 세 필터 모두 **Biquad**라는 동일한 2차 디지털 필터 구조로 구현 — 계수(공식)만 바꾸면 노치·하이패스·로우패스가 됨.

```
 raw 뇌파  →  [60Hz 노치]  →  [1Hz 하이패스]  →  [45Hz 로우패스]  →  깨끗한 뇌파
             (전력선 제거)   (DC 드리프트 제거)   (고주파 제거)
```

📍 **보여줄 파일**: `src/lib/dsp/eegPipeline.ts`

```typescript
// 한 개의 EEG 샘플을 필터 3단에 차례로 통과시키는 함수
export function processEegSample(filter: EegChannelFilter, sample: number): number {
  // 1) 60Hz 노치 필터 — 콘센트(전력선)에서 유입되는 60Hz 노이즈만 콕 집어 제거
  const n = processBiquad(NOTCH_COEFS, filter.notch, sample)

  // 2) 1Hz 하이패스 필터 — 천천히 움직이는 기저선(DC 드리프트) 제거
  const h = processBiquad(HP_COEFS, filter.hp, n)

  // 3) 45Hz 로우패스 필터 — 뇌파와 무관한 고주파 잡음 제거
  const l = processBiquad(LP_COEFS, filter.lp, h)

  // 4) 세 필터를 모두 거친 깨끗한 샘플을 반환
  return l
}
```

- **Biquad 필터** 수학 공식은 **RBJ Audio EQ Cookbook**(오디오 업계 표준 레시피)에서 가져옴. 구현은 Claude의 도움을 받음.
- **다른 센서는?** PPG는 별도 파일(`ppgPipeline.ts`)에서 같은 Biquad 구조로 **0.5~5Hz 밴드패스**(심박 대역만 통과) 필터를 씀. ACC는 **필터 없이** raw 그대로 사용하고 magnitude(√x²+y²+z²)만 계산함.

💡 **발표 한 줄**: "세 단계 필터를 거치면 지저분한 원본 신호가 깨끗한 뇌파 곡선으로 바뀜. 이게 있어야 이후 주파수 분석이 의미 있어짐."

---

### 🎯 포인트 3 — 데이터 분석: 뇌파 대역별 파워 분석

**"뇌파는 주파수에 따라 의미가 달라서, 대역을 나눠서 각각의 세기(파워)를 보여줌."**

- 뇌파는 **주파수 대역별로 다른 의미**를 가짐 (Delta / Theta / Alpha / Beta / Gamma).
- 각 대역이 **얼마나 강한지(파워)**를 숫자로 계산해서 5개 카드에 막대로 표시함.
- 계산엔 **DFT(푸리에 변환)**와 **Morlet 웨이블릿** 두 가지 주파수 분석 수학을 사용함.

| 대역 | 주파수 | 의미 |
|------|--------|------|
| Delta | 1–4Hz | 깊은 수면 |
| Theta | 4–8Hz | 졸림·명상 |
| Alpha | 8–13Hz | 편안·이완 |
| Beta | 13–30Hz | 집중·사고 |
| Gamma | 30–45Hz | 고차 인지 |

📍 **보여줄 파일**: `src/lib/dsp/spectrum.ts`

```typescript
// 5개 대역(Delta / Theta / Alpha / Beta / Gamma)을 순회하며 파워를 각각 계산
for (const band of EEG_BANDS) {
  // 1) 왼쪽 전극(FP1, Ch1)의 해당 대역 파워 계산
  //    내부 동작: Biquad 필터 → Morlet 웨이블릿 → dB로 환산
  const ch1 = computeBandPower(fp1Raw, 250, band.fMin, band.fMax)

  // 2) 오른쪽 전극(FP2, Ch2)의 같은 대역 파워 계산
  const ch2 = computeBandPower(fp2Raw, 250, band.fMin, band.fMax)

  // 3) 두 채널의 dB 값을 대역별 결과 객체에 저장
  //    → BandPowerCards 컴포넌트가 이 값을 읽어서 막대 높이로 시각화
  bands[band.key] = { ch1Db: ch1.db, ch2Db: ch2.db }
}
```

- 수학이 복잡한 **DFT / Morlet 웨이블릿** 구현은 Claude의 도움을 받음. 결과를 어떻게 시각화할지(카드 배치, 색상, 정규화 방식)는 직접 결정함.
- **다른 센서는?** PPG의 BPM·HRV·SpO₂, ACC의 activityState·intensity 등은 **서버가 이미 계산해서 보내줌**. 프론트엔드에선 받은 값을 그대로 저장소에 넣어 카드에 표시만 함 (추가 계산 없음).

💡 **발표 한 줄**: "각 대역의 막대가 올라가면 지금 그 상태가 활성화됐다는 뜻 — 예: Alpha가 높으면 편안한 상태임을 실시간으로 확인 가능."

---

### 🎯 포인트 4 — 데이터 그리기: 페이싱 (속도 맞춰주기) ⭐

**"한꺼번에 몰려오는 데이터를 큐에 모아뒀다가 일정 속도로 꺼내서 차트에 흘려보냄."**

- 데이터는 **불규칙한 버스트**로 들어온다. (예: PPG는 14개씩 280ms마다 한꺼번에 도착)
- 받은 즉시 차트에 그리면 **"와르르 → 멈춤 → 와르르"** 식으로 보여 부자연스럽다.
- 그래서 받은 샘플을 **큐(FIFO 버퍼)**에 쌓아두고, **초당 60번 실행되는 프레임 루프**에서 일정량씩 꺼내 차트로 보낸다.

#### 쉽게 비유하면

수도꼭지에서 물이 콸콸 쏟아졌다가, 뚝 끊겼다가, 또 콸콸 쏟아지는 상황을 떠올려 보자. 이 물을 컵에 바로 받으면 쏟아질 땐 넘치고, 끊길 땐 빈 컵이 된다.

그래서 중간에 **깔때기와 작은 구멍이 달린 통**을 둔다. 물이 콸콸 들어와도 통에 모아뒀다가, 아래 구멍으로는 항상 같은 속도로 똑똑똑 떨어지게 하는 것이다. 이것이 **페이싱(pacing = 속도를 맞춰주는 것)**이다.

```
           와르르 ↓     (끊김)       와르르 ↓
   SSE: ████████         ░░          ████████

   깔때기(큐)에 모아뒀다가...
   │
   ▼
   60fps로 똑같은 양씩 꺼내서 화면에 그림
   ──────────────────────────────────────▶
   항상 일정한 속도!
```

#### 실제 코드 (핵심만)

📍 **보여줄 파일**: `src/hooks/useSSEConnection.ts`

```typescript
// 1) 센서별로 큐를 각각 준비 (깔때기 3개)
const eegQueue: EegRawSample[] = []   // 250Hz
const ppgQueue: PpgRawSample[] = []   // 50Hz
const accQueue: AccSample[] = []      // 30Hz

// 2) 브라우저 화면이 새로고침될 때(초당 약 60번)마다 호출되는 함수
function frameLoop(now: number) {
  // 3) 같은 drainQueue 헬퍼 하나로 세 센서를 모두 처리
  //    — 샘플레이트(250/50/30)와 버퍼 크기만 달라짐
  const eegBatch = drainQueue(eegQueue, elapsedMs, 250, /* ...버퍼 파라미터 */)
  const ppgBatch = drainQueue(ppgQueue, elapsedMs,  50, /* ...버퍼 파라미터 */)
  const accBatch = drainQueue(accQueue, elapsedMs,  30, /* ...버퍼 파라미터 */)

  // 4) 꺼낸 샘플(필터·분석을 거친 값)을 각 센서의 Zustand 저장소에 넣음
  //    → 저장소를 구독 중인 React 차트 컴포넌트가 자동으로 다시 그림
  if (eegBatch.length > 0) useEegStore.getState().ingestRaw(eegBatch)
  if (ppgBatch.length > 0) usePpgStore.getState().ingestRaw(ppgBatch)
  if (accBatch.length > 0) useAccStore.getState().ingestRaw(accBatch)

  // 5) "다음 프레임에도 이 함수를 다시 불러줘"라고 브라우저에 요청
  //    → 이 덕분에 초당 60번 루프가 계속 돌아감
  requestAnimationFrame(frameLoop)
}
```

- **셋 다 같은 구조**: `drainQueue` 헬퍼 하나를 세 번 호출하는 방식이라, 나중에 센서가 늘어나도 큐와 호출 한 줄만 추가하면 됨.
- **버퍼 크기만 센서별로 다름**: EEG 1.5s / PPG 4s(버스트가 큼) / ACC 5s(패킷 공백이 최대 3s까지 생김).

💡 **발표 한 줄**: "이 페이싱 장치 하나로 EEG·PPG·ACC **세 센서를 모두** 매끄럽게 흘려보냄. 같은 `drainQueue`를 세 번 호출하는 구조라 확장도 쉬움."

---

### 📊 센서별 처리 방식 비교 (질문 대비)

발표 중 *"EEG만 이렇게 하나요? PPG/ACC는 어떻게 처리하나요?"* 라는 질문이 오면 이 표로 답하면 됨.

| 단계 | EEG (뇌파) | PPG (맥박) | ACC (가속도) |
|------|-----------|-----------|-------------|
| **1. 받기** | 공통 — `useSSEConnection.ts`에서 세 센서 모두 같은 방식으로 받음 |||
| **2. 필터링** | 60Hz 노치 + 1Hz HP + 45Hz LP<br>(`eegPipeline.ts`) | 0.5Hz HP + 5Hz LP 밴드패스<br>(`ppgPipeline.ts`) | **필터 없음**, raw + magnitude만 계산<br>(`accAdapter.ts`) |
| **3. 분석** | 뇌파 대역별 파워 (Delta/Theta/Alpha/Beta/Gamma)<br>— **프론트에서 직접 계산** | BPM, HRV, SpO₂<br>— **서버 계산값 받아씀** | activityState, intensity<br>— **서버 계산값 받아씀** |
| **4. 그리기 (페이싱)** | 250Hz / 버퍼 1.5s | 50Hz / 버퍼 4s (버스트 큼) | 30Hz / 버퍼 5s (공백 최대 3s) |

**핵심 메시지**:
- 파이프라인 구조(받기 → 필터 → 분석 → 그리기)는 셋 다 **동일**함.
- 다만 **EEG는 프론트에서 주파수 분석까지 직접** 하고, **PPG/ACC는 서버가 이미 계산한 값을 받아서 그대로 씀**.
- 페이싱도 같은 헬퍼(`drainQueue`)를 센서별로 파라미터만 바꿔 호출함.

---

## 4. 발표 때 가리키며 설명할 주요 코드 파일

역할별 정리. 발표 중 **"이 파일이 이런 역할을 함"**이라고 손으로 짚어가며 설명하면 됨.

### 📂 입구 (데이터가 들어오는 곳)
| 파일 | 역할 |
|------|------|
| `src/components/connect/ConnectPanel.tsx` | "Connect" 버튼 UI |
| **`src/hooks/useSSEConnection.ts`** ⭐ | SSE 구독 + 페이싱 + 데이터 분배 (가장 중요) |
| `src/types/sensor.ts` | 들어오는 데이터의 타입 정의 |

### 📂 신호처리 (DSP)
| 파일 | 역할 |
|------|------|
| `src/lib/dsp/biquad.ts` | Biquad 필터 수식 |
| `src/lib/dsp/eegPipeline.ts` | 뇌파 필터 3단 (노치 + HP + LP) |
| `src/lib/dsp/ppgPipeline.ts` | 맥박 밴드패스 (0.5–5Hz) |
| `src/lib/dsp/spectrum.ts` | 주파수 분석 (DFT + Morlet) |
| `src/lib/sensors/eegAdapter.ts` | raw → 필터 → 품질점수 관리 |
| `src/lib/sensors/ppgAdapter.ts` | raw → 필터 → BPM 히스토리 |
| `src/lib/sensors/accAdapter.ts` | raw → magnitude 계산 |

### 📂 데이터 저장소 (Zustand)
| 파일 | 역할 |
|------|------|
| `src/stores/connectionStore.ts` | 연결 상태 |
| `src/stores/slices/eegStore.ts` | EEG 버퍼 + 분석 지표 |
| `src/stores/slices/ppgStore.ts` | PPG 버퍼 + BPM/SpO₂ 히스토리 |
| `src/stores/slices/accStore.ts` | ACC 3축 버퍼 |

### 📂 화면 (UI)
| 파일 | 역할 |
|------|------|
| `src/App.tsx` | 최상위 레이아웃 + 탭 전환 |
| `src/components/eeg/EEGVisualizer.tsx` | EEG 페이지 전체 |
| `src/components/ppg/PPGVisualizer.tsx` | PPG 페이지 전체 |
| `src/components/acc/ACCVisualizer.tsx` | ACC 페이지 전체 |
| `src/lib/charts/BaseChart.tsx` | 모든 차트의 공통 껍데기 |

---

## 5. 사용한 기술과 라이브러리

### 프론트엔드 스택
| 라이브러리 | 어떤 것인가 |
|-----------|------------|
| **React 19** | 화면을 **조립식 블록(컴포넌트)**처럼 만들 수 있게 해주는 UI 라이브러리 |
| **TypeScript** | 데이터의 타입을 미리 정해두어 실수를 잡아주는 '똑똑한 자바스크립트' |
| **Vite** | 개발 서버 + 빌드 도구 (저장하면 즉시 반영) |
| **Zustand** | 가벼운 **전역 상태 관리** 라이브러리 (Redux보다 훨씬 간단) |
| **ECharts** | 고성능 **실시간 차트 엔진** (초당 수백 개 데이터도 부드럽게) |
| **Tailwind CSS** | 유틸리티 클래스 기반 스타일링 도구 |
| **Radix UI** | 접근성 보장된 탭·슬롯 컴포넌트 |

### 브라우저 기본 기능 (라이브러리 아님)
| API | 역할 |
|-----|------|
| **EventSource** | SSE 스트림 구독 |
| **requestAnimationFrame** | 60fps 프레임 루프 (페이싱의 핵심) |
| **localStorage** | 마지막 접속 주소 기억 |

### 꼭 알아야 할 용어 (질문 대비)
| 용어 | 한 줄 설명 |
|------|-----------|
| **SSE (Server-Sent Events)** | 서버가 브라우저에 계속 데이터를 흘려보내는 HTTP 기술 |
| **페이싱 (Pacing)** | 들쭉날쭉 들어오는 데이터를 일정한 속도로 맞춰주는 것 |
| **Biquad 필터** | 잡음 제거용 2차 디지털 필터 (노치/HP/LP/BP 모두 같은 틀) |
| **DFT / 웨이블릿** | 시간 신호를 주파수 분석으로 바꾸는 수학 기법 |
| **Delta/Theta/Alpha/Beta/Gamma** | 뇌파 주파수 대역 (깊은 수면 ~ 고차 인지) |
| **HRV (Heart Rate Variability)** | 심박변이도 |
| **SQI (Signal Quality Index)** | 신호 품질 점수 (0~100) |

---

## 6. 배포 — Vercel + GitHub 연동

대시보드를 **실제 인터넷에 띄워서 누구나 접속할 수 있게** 만듦.

### 배포 흐름
```
[내 컴퓨터]    git push      [GitHub]     자동 감지     [Vercel]     배포     [웹 주소]
   코드    ───────────▶    저장소     ───────────▶   빌드     ────────▶  누구나 접속
```

### 어떻게 했는가
1. **코드를 GitHub 저장소에 올림** (`git push`).
2. **Vercel에 GitHub 계정을 연결**하고 이 저장소를 Import 함.
3. Vercel이 다음을 자동으로 감지함:
   - **Vite** 프로젝트라는 것
   - 빌드 명령은 `npm run build`
   - 결과물은 `dist` 폴더

📍 **보여줄 파일**: `vercel.json` (딱 5줄)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

### 자동 배포의 마법 ✨
한 번 설정하고 나면 **GitHub에 `git push` 하는 순간** Vercel이 자동으로:
1. 최신 코드를 가져옴
2. `npm run build`로 빌드함
3. 몇 초 만에 업데이트된 사이트를 띄워줌

💡 **발표 한 줄**: "코드를 GitHub에 올리기만 하면 Vercel이 알아서 인터넷에 띄워줌. 주소 하나만 공유하면 누구나 접속 가능."

---

## 7. Claude(AI)와의 협업 방식

"AI를 썼다"고 하면 *"그럼 너희는 뭘 한 거야?"* 라는 질문이 올 수 있음. 이 질문에 대비해 **우리가 한 것**과 **Claude가 도운 것**을 명확히 구분해 둠.

### 👥 우리가 직접 한 것
- **전체 구조 설계** — 5단계 흐름(수신 → 페이싱 → DSP → 저장 → 렌더)
- **요구사항 정의** — 어떤 차트·지표를 어디에 보여줄지
- **UI/UX 설계** — 탭 구조, 카드 배치, 색상
- **배포 환경 구성** — GitHub + Vercel 연동
- **문제 발견** — "차트가 끊겨 보인다" 같은 문제를 찾고 해결 방향 제시

### 🤖 Claude가 도와준 것
- **Biquad 필터 수학 공식** 구현
- **DFT / Morlet 웨이블릿** 알고리즘 구현
- **SQI 슬라이딩 윈도우** 최적화
- **TypeScript 타입 설계** 제안
- **버그 원인 분석** (예: Vite HMR 중 EventSource 누수)

### 발표 한 줄
> "저희는 **어떤 기능이 필요하고 어떻게 연결할지**를 설계했고,
> **수학적으로 복잡한 구현**은 Claude에게 맡긴 뒤 결과를 검증함.
> 덕분에 전문 지식이 부족해도 실제로 쓸 수 있는 수준의 대시보드를 만들 수 있었음."

---

## 8. 실행 방법 (시연용)

```bash
npm install         # 의존성 설치
npm run dev         # 개발 서버 → http://localhost:5173
```

브라우저 접속 후 우측 상단 **Connect** 버튼 → SSE URL 입력 → 실시간 차트 시작.

---

## 9. 발표 리허설용 5줄 스크립트

발표 시 **실제로 말할 내용**이라 이 부분만 공손체로 유지함. 포인트 1~4 순서(받기 → 필터 → 분석 → 그리기)와 맞춤.

1. "LinkBand 뇌파 헤드셋에서 오는 실시간 데이터를 웹 대시보드로 시각화했습니다."
2. "서버에서 오는 데이터를 **SSE**로 받은 뒤, **Biquad 필터** 3단을 거쳐 노이즈를 정제합니다."
3. "그다음 **DFT와 Morlet 웨이블릿** 같은 주파수 분석 수학으로 뇌파 대역별(Delta·Theta·Alpha·Beta·Gamma) 파워를 계산합니다."
4. "마지막으로 들쭉날쭉 들어오는 데이터를 **페이싱**으로 매끄럽게 흘려보내 **ECharts** 차트에 실시간으로 그립니다. 이 페이싱 부분이 저희가 가장 공들인 포인트입니다."
5. "코드는 **GitHub**에 올리고 **Vercel**로 자동 배포해서 누구나 웹에서 접속할 수 있습니다. 수학적으로 복잡한 부분은 **Claude**의 도움을 받았지만, 전체 구조와 통합은 저희가 직접 설계했습니다."

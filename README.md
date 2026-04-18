# LuxAcademy Sensor Dashboard

LinkBand BCI 헤드셋의 EEG/PPG/ACC 센서 데이터를 실시간으로 시각화하는 교육용 대시보드입니다.

**[온라인 데모](https://sensor-dashboard-tawny-three.vercel.app/)** — 설치 없이 바로 접속

> **[English README](README.en.md)**

---

## 1. LinkBand 연결하기

### 1-1. 준비물

| 항목 | 설명 |
|------|------|
| **LinkBand** | LooxidLabs BCI 헤드셋 (EEG + PPG + ACC 센서 내장) |
| **PC** | Node.js 18+ 설치된 컴퓨터 |

### 1-2. LinkBand 웹에서 데이터 스트리밍 시작

1. PC에서 [sdk.linkband.store](https://sdk.linkband.store) 접속
2. 왼쪽 메뉴에서 **LinkBand** 클릭
3. **Scan Devices** → 디바이스 선택 → **Connect and Pairing**
4. 왼쪽 메뉴에서 **SYSTEM PROCESS** 클릭
5. **브로드캐스트 서버** 섹션에서 **연결** 클릭
6. 아래로 스크롤 → **Developer API** 섹션 → **cURL** 탭 → URL 복사
7. 복사한 URL에 본인의 **Device ID**가 쿼리스트링(`?deviceId=...`)으로 포함되어 있습니다

> **중요**: Device ID는 세션마다 새로 발급됩니다. 반드시 **본인 LinkBand 세션에서 복사한 URL**을 사용하세요.

### 1-3. 대시보드에 연결

1. [온라인 데모](https://sensor-dashboard-tawny-three.vercel.app/) 또는 로컬 서버(`http://localhost:5173`) 접속
2. 우측 상단 **Connect** 버튼 클릭
3. 1-2에서 복사한 SSE URL 붙여넣기
4. **Connect** 클릭 → 실시간 데이터가 차트에 표시됩니다

> **SSE URL 형식**: `https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId={YOUR_DEVICE_ID}`

---

## 2. 설치 및 실행

### 2-0. 사전 준비: Node.js

```bash
node --version   # v18 이상 필요
npm --version
```

- **Windows**: [nodejs.org](https://nodejs.org) → LTS 버전 다운로드 → .msi 설치
- **Mac**: `brew install node` 또는 .pkg 다운로드
- **Linux**: `sudo apt install nodejs npm` 또는 [nvm](https://github.com/nvm-sh/nvm)

### 2-1. 프로젝트 클론

```bash
git clone https://github.com/donghyeon99/sensor-dashboard.git
cd sensor-dashboard
```

### 2-2. 의존성 설치

```bash
npm install
```

### 2-3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:5173` 에서 접속 가능합니다.

---

## 3. 주요 기능

### 3-1. 테마 전환 (Purple / Black / White)

Visualizer 헤더의 컬러 버튼으로 3가지 테마를 즉시 전환합니다. 선택은 localStorage에 자동 저장됩니다.

| 테마 | 배경 | 카드 | 용도 |
|------|------|------|------|
| **Purple** | 딥 인디고 (#0a0a1a) | 보라빛 다크 | 몰입형 다크 환경 |
| **Black** | 순수 검정 (#000000) | 뉴트럴 다크 | OLED 화면, 미니멀 |
| **White** | 라이트 그레이 (#f8f9fa) | 화이트 카드 | 밝은 교실, 프레젠테이션 |

### 3-2. 신호 품질 모니터링

- **Streaming 뱃지**: SSE 연결 시 표시
- **Signal Quality 뱃지**: 4단계 (Excellent / Good / Warning / Bad)
  - 최근 50 샘플의 SQI 평균 + 전극 Lead-off 상태 기반
- **차트별 LeadOff 배너**: FP1만 / FP2만 / 둘 다 — 각 차트 위에 인라인 표시

### 3-3. 고정 네비게이션

Visualizer 제목, 테마 스위처, 상태 뱃지, EEG/PPG/ACC 탭 바가 스크롤 시에도 상단에 고정됩니다.

### 3-4. EEG 탭

| 컴포넌트 | 설명 |
|----------|------|
| Ch1/Ch2 필터링된 EEG 신호 | FP1/FP2 실시간 파형 (60Hz 노치 + 1-45Hz 밴드패스) |
| Ch1/Ch2 신호 품질 (SQI) | 채널별 전극 접촉 품질 모니터링 |
| 파워 스펙트럼 (1-45Hz) | 주파수 도메인 듀얼 채널 분석 (밴드 마커 표시) |
| 주파수 밴드 파워 | Delta/Theta/Alpha/Beta/Gamma 5밴드 파워 카드 (Ch1 vs Ch2) |
| EEG 분석 지수 | 7개 지수: Focus, Arousal, Stress, Emotional Stability, Total Power, Cognitive Load, Hemispheric Balance |

모든 지수 카드의 **좌측 상단 점은 현재 threshold 수준에 따라 색상이 동적으로 변경**됩니다 (초록=정상, 빨강=과도 등). **마우스 hover 시** 공식, 정상 범위, 해석, 참고 문헌이 툴팁으로 표시됩니다.

### 3-5. PPG 탭

| 컴포넌트 | 설명 |
|----------|------|
| 필터링된 PPG 신호 | IR/Red 채널 **0.5-5.0Hz 밴드패스 필터** 적용 (DC 제거) |
| PPG 신호 품질 (SQI) | 신호 품질 차트 (동일 이마 전극이므로 EEG SQI 공유) |
| PPG LeadOff 배너 | PPG 섹션 전용 전극 접촉 경고 |
| 심박변이도 지표 (14개) | 4행 그리드: BPM/SpO2/HR Max/HR Min → Stress/RMSSD/SDNN/SDSD → LF/HF/LF-HF Ratio → AVNN/PNN50/PNN20 |

### 3-6. ACC 탭

| 컴포넌트 | 설명 |
|----------|------|
| 3축 가속도 파형 | X (빨강), Y (초록), Z (파랑) 실시간 |
| 합성 가속도 (Magnitude) | √(x²+y²+z²) 종합 가속도 |
| 움직임 분석 | 축별 값, 활동 상태, 안정성, 강도 |

---

## 4. 아키텍처

### 4-1. 데이터 흐름

```
LinkBand 디바이스
    ↓ (Bluetooth)
LinkBand 앱 / 클라우드
    ↓ (HTTPS)
Cloud Broadcast Server (Google Cloud Run)
    ↓ (SSE / EventSource)
┌─────────────────────────────────────────────┐
│  React 대시보드 (브라우저)                    │
│                                             │
│  EventSource(sseUrl)                        │
│    ↓ JSON.parse                             │
│  useSSEConnection → dispatchPayload()       │
│    ↓                                        │
│  Zustand Store Slices                       │
│    eegStore / ppgStore / accStore            │
│    batteryStore / statsStore                 │
│    ↓ subscribe                              │
│  BaseChart (echarts) → 렌더링                │
└─────────────────────────────────────────────┘
```

백엔드 없이 프론트엔드에서 SSE를 직접 구독합니다.

### 4-2. Clean Architecture 레이어

```
┌─────────────────────────────────────────────┐
│ UI 레이어                                    │
│   shadcn/ (Card, Badge, Tabs, Button)       │
│   visualizer/ (Header, ThemeSwitcher)       │
│   eeg/ ppg/ acc/ connect/ layout/           │
├─────────────────────────────────────────────┤
│ 차트 레이어                                   │
│   lib/charts/ (BaseChart, optionBuilders,   │
│                echartsRegistry, theme)       │
├─────────────────────────────────────────────┤
│ 상태 레이어                                   │
│   stores/slices/ (eeg, ppg, acc, battery,   │
│                   stats) + connectionStore  │
│   hooks/ (useSSEConnection, useTheme,       │
│           useSignalQuality)                 │
├─────────────────────────────────────────────┤
│ 도메인 레이어 (순수 함수, React 비의존)         │
│   lib/dsp/ (biquad, eegPipeline,            │
│             ppgPipeline, spectrum)           │
│   lib/sensors/ (eegAdapter, ppgAdapter,     │
│                 accAdapter)                  │
│   lib/thresholds/ (indexThresholds)          │
├─────────────────────────────────────────────┤
│ 타입 레이어                                   │
│   types/sensor.ts (SSE 페이로드 타입)          │
└─────────────────────────────────────────────┘
```

### 4-3. 핵심 설계 결정

| # | 결정 | 이유 |
|---|------|------|
| D1 | shadcn/ui를 `components/shadcn/`에 격리 설치 | Windows 파일시스템 대소문자 충돌 방지 |
| D2 | echarts 단일 registry | 8+ 차트 컴포넌트의 중복 `echarts.use()` 호출 방지 |
| D3 | BaseChart 공통 래퍼 | init/resize/dispose 수명주기 표준화 (~255줄 보일러플레이트 제거) |
| D4 | 5개 Zustand store slice | 도메인별 selector로 re-render 최소화 |
| D5 | 순수 DSP 함수 | `lib/dsp/`는 React/Zustand import 0 — 유닛 테스트 가능 |
| D6 | PPG 0.5-5Hz 밴드패스 (노치 없음) | 50Hz 샘플링에서 60Hz 라인 노이즈 필터링 불필요 |
| D7 | PPG SQI에 EEG SQI 공유 | SSE가 샘플당 단일 signalQuality 제공, Ch1/Ch2 미러 저장 |
| D8 | CSS 커스텀 속성으로 테마 구현 | `data-theme` 속성 전환만으로 JS re-render 없이 색상 변경 |
| D9 | Frame-paced sample drainer | SSE 패킷 버스트를 매끄럽게 펴서 차트가 일정 속도로 흐르도록 (D10 참조) |

### 4-4. SSE 패킷 구조와 프레임 페이싱

LinkBand 디바이스는 **개별 샘플을 하나씩 SSE로 보내지 않고**, 디바이스 내부에 모은 다음 한 묶음으로 패킷화해 전송합니다. 라이브 캡처(12초 측정) 결과:

| 센서 | nominal SR | 패킷당 샘플 | 패킷 간격 (avg / max) |
|------|------------|------------|----------------------|
| EEG | 250 Hz | ~50 샘플 | ~200ms / ~300ms |
| PPG | 50 Hz | ~28 샘플 | ~1s / ~1.7s |
| ACC | 30 Hz | ~30 샘플 | ~1s / ~3s |

즉, 패킷 빈도는 1-5Hz 수준이지만 **각 패킷에 1초치 샘플이 묶여 있어** 정보 손실은 없습니다. 다만 그대로 차트에 그리면 패킷 도착 순간에만 뚝뚝 튀고 사이엔 멈춰 있는 "와락→정지" 패턴이 됩니다.

**해결: Frame-Paced Sample Drainer** (`src/hooks/useSSEConnection.ts`)

```
SSE 패킷 ─→ per-stream FIFO 큐
              │
              ▼
       매 animation frame (60fps)
              │
              ▼
       fractional accumulator: acc += SR × elapsed_sec
       drain = floor(acc)            ← 정확히 자연 속도 유지
              │
              ▼
       store.ingestRaw(drained)
              │
              ▼
       chart re-renders smoothly
```

- **Playback buffer**: EEG 1s, PPG 1.5s, ACC 2s 만큼 미리 모은 후 재생 시작 → 네트워크 지터 흡수
- **Hold-last-sample**: 짧은 SSE 갭(≤800ms) 동안엔 마지막 샘플을 복제해 차트 흐름 유지, 그 이상 침묵이면 정직하게 멈춤
- **Idle resync**: 탭 백그라운드 후 복귀 시 큐를 최근 1초치만 남기고 트림 → "지금 시점"부터 재생 (라이브 스트림 방식)
- **HMR dispose**: Vite 핫 리로드 시 옛 EventSource 자동 정리 → 모듈 교체 후 SSE 핸들러가 stale closure에 묶이는 문제 방지

---

## 5. 신호 처리

### 5-1. EEG 필터 파이프라인

```
Raw EEG (250Hz) → 60Hz 노치 → 1Hz 하이패스 → 45Hz 로우패스 → 표시
                   (RBJ biquad)  (Butterworth)   (Butterworth)
```

처음 250 샘플 (~1초)은 필터 transient 구간으로 0이 출력됩니다.

### 5-2. PPG 필터 파이프라인

```
Raw PPG (50Hz) → 0.5Hz 하이패스 → 5.0Hz 로우패스 → 표시
                  (Butterworth)     (Butterworth)
```

DC 기저선 드리프트와 고주파 노이즈를 제거합니다. 처음 50 샘플 (~1초) 동안 0이 출력됩니다.

### 5-3. EEG 분석 지수

각 지수 카드에 마우스를 올리면 공식, 정상 범위, 해석, 학술 참고문헌이 표시됩니다.

| 지수 | 공식 | 정상 범위 | 참고 |
|------|------|-----------|------|
| **Focus** | β / (α + θ) | 1.8 – 2.4 | Klimesch 1999 |
| **Arousal** | α / (α + β) | 0.18 – 0.22 | Bazanova & Vernon 2014 |
| **Stress** | (β + γ) / (α + θ) | 3.0 – 4.0 | Ahn et al. 2019 |
| **Hemispheric Balance** | (αL − αR) / (αL + αR) | −0.1 – 0.1 | Davidson 2004 |
| **Cognitive Load** | θ / α | 0.3 – 0.8 | Gevins & Smith 2003 |
| **Emotional Stability** | (α + θ) / γ | 0.4 – 0.8 | Knyazev 2007 |
| **Total Power** | Σ band powers | 850 – 1150 μV² | Klimesch 1999 |

### 5-4. PPG / HRV 지표

| 지표 | 방법 | 정상 범위 | 단위 |
|------|------|-----------|------|
| **BPM** | PPG 피크 간격 분석 | 60 – 100 | beats/min |
| **SpO2** | Red/IR 비율 (Beer–Lambert) | 95 – 100 | % |
| **SDNN** | √(Σ(RRᵢ − R̄R)² / (N−1)) | 30 – 100 | ms |
| **RMSSD** | √(Σ(RRᵢ₊₁ − RRᵢ)² / (N−1)) | 20 – 50 | ms |
| **PNN50** | count(\|ΔRR\| > 50ms) / N × 100 | 10 – 30 | % |
| **PNN20** | count(\|ΔRR\| > 20ms) / N × 100 | 20 – 60 | % |
| **AVNN** | Σ(RRᵢ) / N | 600 – 1000 | ms |
| **LF Power** | PSD 0.04–0.15 Hz | 200 – 1200 | ms² |
| **HF Power** | PSD 0.15–0.4 Hz | 80 – 4000 | ms² |
| **LF/HF** | LF / HF | 1.5 – 2.5 | ratio |
| **Stress** | 0.4·SDNNn + 0.4·RMSSDn + 0.2·HRstress | 0.30 – 0.70 | normalized |
| **SDSD** | √(Σ((ΔRR) − mean_Δ)² / (N−1)) | 15 – 40 | ms |
| **HR Max/Min** | 2분 이동 윈도우 | 80–150 / 50–80 | bpm |

> 출처: Task Force of ESC/NASPE 1996, Shaffer & Ginsberg 2017, AHA Guidelines.

### 5-5. 가속도계

| 필드 | 설명 | 단위 |
|------|------|------|
| `x`, `y`, `z` | 3축 가속도 | g |
| `magnitude` | √(x²+y²+z²) 합성 가속도 | g |
| Stability | 자세 안정성 (0-100%) | % |
| Intensity | 움직임 강도 (0-100%) | % |

샘플링 레이트: 30Hz (라이브 캡처에서 측정한 디바이스 nominal rate)

---

## 6. 프로젝트 구조

```
sensor-dashboard/
├── src/
│   ├── App.tsx                          # 메인 레이아웃 (고정 헤더 + 탭 + 컨텐츠)
│   ├── main.tsx                         # 진입점
│   ├── index.css                        # Tailwind + 3개 테마 CSS 변수 세트
│   ├── types/
│   │   └── sensor.ts                    # SSE 페이로드 타입 정의
│   ├── lib/
│   │   ├── utils.ts                     # cn() 헬퍼 (shadcn 표준)
│   │   ├── dsp/                         # 순수 신호 처리 (React 비의존)
│   │   │   ├── biquad.ts               # RBJ biquad 필터 기본요소
│   │   │   ├── eegPipeline.ts           # 60Hz 노치 + 1-45Hz 밴드패스
│   │   │   ├── ppgPipeline.ts           # 0.5-5Hz 밴드패스
│   │   │   └── spectrum.ts              # DFT, 밴드 파워 계산
│   │   ├── sensors/                     # 순수 데이터 어댑터 (React 비의존)
│   │   │   ├── eegAdapter.ts
│   │   │   ├── ppgAdapter.ts
│   │   │   ├── accAdapter.ts
│   │   │   └── types.ts                 # 버퍼 상태 타입
│   │   ├── charts/                      # echarts 추상화
│   │   │   ├── echartsRegistry.ts       # 단일 echarts.use() 등록
│   │   │   ├── BaseChart.tsx            # 재사용 차트 수명주기 래퍼
│   │   │   ├── optionBuilders.ts        # 차트 옵션 팩토리
│   │   │   └── theme.ts                 # 차트 색상 토큰
│   │   └── thresholds/
│   │       └── indexThresholds.ts       # EEG/PPG/ACC threshold 정의
│   ├── stores/
│   │   ├── connectionStore.ts           # SSE 연결 상태
│   │   └── slices/                      # 도메인별 Zustand 스토어
│   │       ├── eegStore.ts
│   │       ├── ppgStore.ts
│   │       ├── accStore.ts
│   │       ├── batteryStore.ts
│   │       └── statsStore.ts
│   ├── hooks/
│   │   ├── useSSEConnection.ts          # SSE 수명주기 + 스토어 디스패치
│   │   ├── useTheme.ts                  # 테마 전환 (purple/black/white)
│   │   └── useSignalQuality.ts          # 4단계 신호 품질 계산
│   └── components/
│       ├── shadcn/                      # shadcn/ui 프리미티브 (격리)
│       │   ├── card.tsx
│       │   ├── badge.tsx
│       │   ├── tabs.tsx
│       │   ├── button.tsx
│       │   └── input.tsx
│       ├── ui/                          # 레거시 프리미티브
│       ├── visualizer/                  # 페이지 레벨 컴포넌트
│       │   ├── VisualizerHeader.tsx
│       │   ├── StreamingBadge.tsx
│       │   ├── SignalQualityBadge.tsx
│       │   └── ThemeSwitcher.tsx
│       ├── layout/                      # Header, Footer
│       ├── connect/                     # ConnectPanel (URL 입력)
│       ├── eeg/                         # EEG Visualizer (8개 컴포넌트)
│       ├── ppg/                         # PPG Visualizer (5개 컴포넌트)
│       └── acc/                         # ACC Visualizer (4개 컴포넌트)
├── docs/
│   ├── PROJECT_IDEAS.md
│   └── archive/                         # PDCA 사이클 문서
├── components.json                      # shadcn 설정
├── package.json
├── tsconfig.json                        # TypeScript + @/* 경로 별칭
└── vite.config.ts                       # Vite + Tailwind + @/ 별칭
```

---

## 7. 기술 스택

| 기술 | 용도 |
|------|------|
| **React 19** | UI 프레임워크 |
| **TypeScript 6** | 타입 안전성 |
| **Vite 8** | 빌드 도구 / 개발 서버 |
| **Tailwind CSS 4** | 스타일링 (CSS 커스텀 속성으로 테마 구현) |
| **shadcn/ui** | UI 컴포넌트 프리미티브 (Card, Badge, Tabs) |
| **Radix UI** | 접근성 기반 헤드리스 컴포넌트 (Tabs) |
| **lucide-react** | 아이콘 라이브러리 (TriangleAlert, Clock) |
| **echarts 6** | 실시간 차트 시각화 |
| **Zustand 5** | 전역 상태 관리 (5개 도메인 slice) |
| **EventSource (SSE)** | 서버 → 클라이언트 실시간 데이터 스트림 |

---

## 8. 학생 가이드: 로봇 제어 (Python)

별도 Python 백엔드를 실행하면 센서 데이터를 실시간으로 받아 로봇 제어 등 학생 프로젝트에 활용할 수 있습니다.

### 8-1. 구조

```
backend/
├── server.py              # SSE → WebSocket 중계 서버 (수정 불필요)
├── sensor_data.py         # 센서 데이터 타입 정의 (수정 불필요)
├── robot_controller.py    # ★ 학생이 코드를 작성하는 파일
├── example_controller.py  # 작성 예시
└── requirements.txt       # Python 의존성
```

### 8-2. 데이터 흐름

```
Cloud Broadcast Server (SSE)
    ↓
server.py (SSE 수신 → 파싱)
    ↓
robot_controller.py의 on_sensor_data() 자동 호출
    ↓
학생이 센서 데이터로 로봇 제어 로직 작성
```

### 8-3. 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
python server.py
```

> **Windows 사용자**: `python3` 대신 `python`을 사용하세요.

서버가 시작되면 SSE에 자동 연결하여 센서 데이터를 수신합니다. `http://localhost:8000`에서 WebSocket과 REST API도 제공합니다.

### 8-4. Device ID 설정

`server.py`의 `DEVICE_ID`를 본인 LinkBand 세션의 Device ID로 변경해야 합니다:

```python
# server.py 25~26번째 줄
SSE_URL = "https://broadcast-server-506664317461.us-central1.run.app/subscribe"
DEVICE_ID = "여기에_본인_Device_ID_입력"
```

Device ID는 [sdk.linkband.store](https://sdk.linkband.store)에서 연결 후 Developer API 섹션의 cURL URL에서 확인할 수 있습니다.

### 8-5. 학생 코드 작성

`robot_controller.py`의 `on_sensor_data()` 함수 안에 코드를 작성합니다:

```python
def on_sensor_data(data: SensorData):
    # EEG 분석 데이터
    if data.eeg_analysis:
        eeg = data.eeg_analysis
        print(f"[EEG] Focus: {eeg.focus_index:.2f} | "
              f"Stress: {eeg.stress_index:.2f} | "
              f"Relax: {eeg.relaxation_index:.2f}")

        # 집중도가 높으면 앞으로 이동
        if eeg.focus_index > 0.7:
            move_forward()
        # 스트레스가 높으면 정지
        elif eeg.stress_index > 0.5:
            stop()

    # PPG 분석 데이터
    if data.ppg_analysis:
        ppg = data.ppg_analysis
        print(f"[PPG] BPM: {ppg.bpm:.0f}")
```

### 8-6. 사용 가능한 센서 데이터

| 데이터 | 필드 | 설명 |
|--------|------|------|
| `data.eeg_analysis.attention` | 0.0 ~ 1.0 | 집중도 |
| `data.eeg_analysis.focus_index` | float | 포커스 지수 |
| `data.eeg_analysis.relaxation_index` | float | 이완 지수 |
| `data.eeg_analysis.stress_index` | float | 스트레스 지수 |
| `data.eeg_analysis.cognitive_load` | float | 인지 부하 |
| `data.eeg_analysis.emotional_balance` | float | 감정 균형 |
| `data.eeg_analysis.total_power` | float | 전체 뇌파 파워 |
| `data.ppg_analysis.bpm` | float | 심박수 (BPM) |
| `data.ppg_analysis.spo2` | float or None | 산소포화도 (%) |

### 8-7. REST API (선택)

WebSocket 대신 HTTP 폴링으로도 데이터를 가져올 수 있습니다:

```bash
curl http://localhost:8000/api/latest
```

자세한 프로젝트 아이디어는 `docs/PROJECT_IDEAS.md`를 참고하세요.

---

## 9. 문제 해결

### Connect 후 데이터가 안 나옴

1. 브라우저 개발자 도구(F12) → **Network** 탭 → `subscribe` 요청 확인 → **EventStream**에 데이터가 흘러오는지 확인
2. LinkBand sdk.linkband.store에서 실제로 publish가 나가는지 확인 (Network → `POST /publish` → 200)
3. 대시보드의 `deviceId`와 LinkBand 세션의 `deviceId`가 **동일한지** 확인 (가장 흔한 실수)
4. 헤드밴드가 이마에 제대로 밀착되어 있는지 확인 (Lead-off 상태면 값이 고정됨)
5. Device ID에 `+` 등 특수문자가 있어도 정상입니다 — 대시보드가 자동으로 URL 인코딩 처리합니다

### Mock 데이터가 안 나옴

Mock 서버가 비활성 상태일 수 있습니다. 실제 디바이스 연결 또는 다른 Mock ID를 시도해보세요.

### npm install 실패

프로젝트 루트 폴더(`sensor-dashboard/`)에서 실행 중인지, Node.js 18+ 설치되어 있는지 확인하세요.

---

## 10. 참고 자료

| 자료 | 링크 |
|------|------|
| LinkBand SDK 공식 문서 | https://sdk.linkband.store/ |
| LooxidLabs SDK-Android | https://github.com/LooxidLabs/SDK-Android |
| 10-20 International System | https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG) |
| ESC/NASPE HRV 기준 | European Heart Journal, Vol 17, 1996 |

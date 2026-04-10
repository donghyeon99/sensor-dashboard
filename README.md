# LuxAcademy Sensor Dashboard

BCI(Brain-Computer Interface) 헤드셋의 EEG/PPG/ACC 센서 데이터를 실시간으로 시각화하는 교육용 대시보드입니다.

---

## 1. LinkBand 연결하기

### 1-1. 준비물

| 항목 | 설명 |
|------|------|
| **LinkBand** | LooxidLabs BCI 장치 (EEG + PPG + ACC 센서 내장) |
| **PC** | Node.js 18+ 설치된 컴퓨터 (대시보드 실행용) |

### 1-2. LinkBand 웹에서 데이터 스트리밍 시작

1. PC에서 [LinkBand 웹사이트(클릭)](https://sdk.linkband.store) 접속
2. BLE(블루투스)로 헤드셋 연결
3. 데이터 스트리밍 시작 → Cloud SSE API로 데이터 전송됨
4. 웹에서 **Device ID** 확인 (예: `ifBqqUHSkf1DZZe1DTaW9A==`)

### 1-3. SSE URL 구성

아래 형식으로 SSE URL을 구성합니다:

```
https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId={YOUR_DEVICE_ID}
```

예시:
```
https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId=ifBqqUHSkf1DZZe1DTaW9A==
```

> **테스트용 Mock 데이터**: Device ID에 `mock`이 포함되면 서버에서 가상 데이터를 생성합니다.
> ```
> https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId=mock-1775781462168
> ```

---

## 2. 대시보드 설치 및 실행

### 2-0. 사전 준비: Node.js 설치

Node.js가 설치되어 있지 않다면 먼저 설치해야 합니다.

- [Node.js 공식 사이트](https://nodejs.org) 접속 → **LTS 버전** 다운로드 및 설치
- 설치 확인:
  ```bash
  node --version   # v18 이상이면 OK
  npm --version    # 함께 설치됨
  ```

> **Windows**: 설치 파일(.msi) 실행 후 기본 설정으로 진행
> **Mac**: 설치 파일(.pkg) 또는 `brew install node`
> **Linux**: `sudo apt install nodejs npm` 또는 [nvm](https://github.com/nvm-sh/nvm) 사용

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

브라우저에서 `http://localhost:5173` 을 엽니다.

### 2-4. 센서 데이터 연결

1. 헤더의 **Connect** 버튼 클릭
2. SSE URL 붙여넣기 (1-3에서 구성한 URL)
3. **Connect** 클릭
4. 실시간 데이터가 차트에 표시됩니다

Mock 데이터로 연결하면 Connect 버튼에 **MOCK** 뱃지가 표시됩니다.

---

## 3. 대시보드 기능

### 카테고리 탭

| 탭 | 설명 |
|----|------|
| **EEG** | 뇌파 원시 신호, 신호 품질, 파워 스펙트럼, 주파수 밴드 파워, 분석 지수 (7개 컴포넌트) |
| **PPG** | 맥파 원시 신호 (IR/Red), 심박수 추이, 산소포화도 추이, BPM/SpO2 카드 (4개 컴포넌트) |
| **ACC** | 3축 가속도 (X/Y/Z), 합성 가속도, 움직임 지표 카드 (3개 컴포넌트) |

### EEG 탭 상세

| 컴포넌트 | 설명 |
|----------|------|
| Ch1/Ch2 EEG 신호 | FP1, FP2 전극의 실시간 원시 파형 |
| Ch1/Ch2 신호 품질 (SQI) | 각 채널별 신호 품질 지수 모니터링 |
| 파워 스펙트럼 (1-45Hz) | 주파수 도메인 분석 (Delta~Gamma 대역 표시) |
| 주파수 밴드 파워 | 델타, 세타, 알파, 베타, 감마 5밴드 파워 카드 |
| EEG 분석 지수 | 집중력, 이완도, 스트레스 등 7개 지수 카드 |

### PPG 탭 상세

| 컴포넌트 | 설명 |
|----------|------|
| PPG 원시 신호 | IR(적외선), Red(적색) 광원 실시간 파형 |
| 심박수 (BPM) 추이 | 심박수 변화 그래프 |
| 산소포화도 (SpO2) 추이 | 혈중 산소 농도 변화 그래프 |
| PPG 분석 지표 | BPM, SpO2 실시간 요약 카드 |

### ACC 탭 상세

| 컴포넌트 | 설명 |
|----------|------|
| 3축 가속도 | X, Y, Z 축 가속도 실시간 파형 |
| 합성 가속도 | √(x² + y² + z²) 움직임 강도 추이 |
| 움직임 지표 | 각 축 값, Magnitude, 활동 상태, 안정도 카드 |

---

## 4. 센서 데이터 설명

### 4-1. 뇌파 주파수 대역

| 대역 | 주파수 범위 | 설명 |
|------|------------|------|
| **Delta** | 0.5 - 4 Hz | 깊은 수면 상태 |
| **Theta** | 4 - 8 Hz | 졸음, 명상, 창의적 사고 |
| **Alpha** | 8 - 13 Hz | 이완, 안정 상태 |
| **SMR** | 12 - 15 Hz | 집중 준비 상태 |
| **Beta** | 13 - 30 Hz | 활발한 사고, 집중 |
| **Gamma** | 30 Hz 이상 | 고도의 인지 처리 |

### 4-2. EEG Raw (뇌파 원시 데이터)

| 필드 | 설명 | 단위/범위 |
|------|------|-----------|
| `fp1` | 왼쪽 전두엽 (FP1) 전극 전압값 | μV |
| `fp2` | 오른쪽 전두엽 (FP2) 전극 전압값 | μV |
| `signalQuality` | 신호 품질 (0 = 최고) | int |
| `leadOff` | 전극 접촉 상태 | `{ch1: bool, ch2: bool}` |

- **채널 수**: 2채널 (FP1, FP2)
- **샘플링 레이트**: 250Hz
- **패킷당 샘플 수**: ~200개

### 4-3. EEG Analysis (뇌파 분석)

| 필드 | 설명 | 범위 |
|------|------|------|
| `attention` | 집중도 (Beta파 기반) | 0 ~ 1 |
| `focusIndex` | 초점 지수 (SMR + Mid-Beta) | 0 ~ 1 |
| `relaxationIndex` | 이완 지수 (Alpha파 기반) | 0 ~ 1 |
| `stressIndex` | 스트레스 (High-Beta 기반) | 0 ~ 1 |
| `cognitiveLoad` | 인지 부하 (Theta/Alpha 비율) | 0 ~ 1 |
| `emotionalBalance` | 감정 균형 (FP1/FP2 비대칭) | 0 ~ 1 |
| `meditationLevel` | 명상 수준 (Theta + Alpha) | 0 ~ 1 |
| `totalPower` | 전체 뇌파 파워 | dB |

### 4-4. PPG Analysis (맥파 분석)

| 필드 | 설명 | 단위 |
|------|------|------|
| `bpm` | 심박수 | BPM |
| `spo2` | 산소포화도 (없을 수 있음) | % |
| `sdnn` | HRV 표준편차 | ms |
| `rmssd` | HRV RMSSD | ms |
| `stressIndex` | PPG 기반 스트레스 지수 | float |

### 4-5. Accelerometer (가속도)

| 필드 | 설명 | 단위 |
|------|------|------|
| `x`, `y`, `z` | 3축 가속도 | g |
| `magnitude` | 합성 가속도 | g |

- **샘플링 레이트**: 25Hz
- **패킷당 샘플 수**: ~30개

### 4-6. ACC Analysis (가속도 분석)

| 필드 | 설명 |
|------|------|
| `activityState` | 활동 상태 (stationary, moving 등) |
| `intensity` | 움직임 강도 |
| `stability` | 안정도 (%) |
| `avgMovement` | 평균 움직임 |

---

## 5. 시스템 구조

```
┌──────────────┐                      ┌──────────────────┐
│ BCI Headset  │  BLE → 앱 → Cloud   │  Cloud SSE API   │
│ (LinkBand)   │ ───────────────────► │  (broadcast-     │
│ EEG+PPG+ACC  │                      │   server)        │
└──────────────┘                      └────────┬─────────┘
                                               │
                                               │ SSE (EventSource)
                                               ▼
                                      ┌──────────────────┐
                                      │  React Frontend  │
                                      │  (Vite, :5173)   │
                                      │  TypeScript +    │
                                      │  Tailwind +      │
                                      │  echarts +       │
                                      │  Zustand         │
                                      └──────────────────┘
```

백엔드 없이 프론트엔드에서 SSE를 직접 구독하여 데이터를 파싱합니다.

---

## 6. 학생 가이드: 로봇 제어 코드 작성법

별도로 Python 백엔드를 실행하면 WebSocket 기반으로 학생 코드에서도 센서 데이터를 사용할 수 있습니다.

### 6-1. 백엔드 실행 (선택 사항)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 server.py
```

### 6-2. 학생 코드 예시

```python
# robot_controller.py
from sensor_data import from_dict, SensorData

def on_sensor_data(data: SensorData):
    if data.eeg_analysis:
        attention = data.eeg_analysis.attention
        if attention > 0.6:
            print(f"집중도 {attention:.2f} → 로봇 전진!")

    if data.ppg_analysis:
        bpm = data.ppg_analysis.bpm
        print(f"심박수: {bpm:.0f} BPM")
```

자세한 내용은 `docs/PROJECT_IDEAS.md`를 참고하세요.

---

## 7. 프로젝트 구조

```
sensor-dashboard/
├── src/                          # React Frontend (TypeScript)
│   ├── main.tsx                  # 진입점
│   ├── App.tsx                   # 메인 레이아웃 + 카테고리 탭
│   ├── types/
│   │   └── sensor.ts             # SSE 데이터 타입 정의
│   ├── stores/
│   │   ├── connectionStore.ts    # SSE 연결 상태 (Zustand)
│   │   └── sensorDataStore.ts    # 센서 데이터 버퍼 (Zustand)
│   ├── hooks/
│   │   └── useSSEConnection.ts   # EventSource 연결 관리
│   ├── components/
│   │   ├── layout/               # Header, CategoryTabs, Footer
│   │   ├── connect/              # ConnectPanel (URL 입력)
│   │   ├── eeg/                  # EEG Visualizer (6개 컴포넌트)
│   │   ├── ppg/                  # PPG Visualizer (5개 컴포넌트)
│   │   └── acc/                  # ACC Visualizer (4개 컴포넌트)
│   └── index.css                 # Tailwind CSS + 커스텀 테마
│
├── backend/                      # Python 백엔드 (선택 사항)
│   ├── server.py                 # FastAPI 서버
│   ├── sensor_data.py            # 센서 데이터 타입 (dataclass)
│   └── requirements.txt          # Python 의존성
│
├── docs/                         # 문서
│   └── PROJECT_IDEAS.md          # 학생 프로젝트 아이디어 가이드
│
├── index.html                    # HTML 템플릿
├── package.json                  # Node.js 의존성
├── tsconfig.json                 # TypeScript 설정
└── vite.config.ts                # Vite + Tailwind 설정
```

---

## 8. 기술 스택

| 기술 | 용도 |
|------|------|
| **React 19** | UI 프레임워크 |
| **TypeScript** | 타입 안전성 |
| **Vite 8** | 빌드 도구 / 개발 서버 |
| **Tailwind CSS** | 스타일링 |
| **echarts** | 실시간 차트 시각화 |
| **Zustand** | 전역 상태 관리 |
| **EventSource (SSE)** | 서버 → 클라이언트 실시간 데이터 스트림 |

---

## 9. 문제 해결

### Connect 후 데이터가 표시되지 않음

1. 브라우저 개발자 도구(F12) → Console 탭 확인
2. `✅ SSE connected` 메시지가 보이는지 확인
3. LinkBand 앱에서 데이터 스트리밍이 활성화되어 있는지 확인
4. Device ID가 정확한지 확인

### Mock 데이터가 안 나옴

Mock 서버에서 데이터 발행이 비활성 상태일 수 있습니다. 실제 디바이스 연결 또는 다른 mock ID를 시도해보세요.

### npm install 실패

프로젝트 루트 폴더 (`sensor-dashboard/`)에서 실행하고 있는지 확인하세요.

---

## 10. 참고 자료

| 자료 | 링크 |
|------|------|
| LinkBand SDK 공식 문서 | https://sdk.linkband.store/ |
| LooxidLabs SDK-Android GitHub | https://github.com/LooxidLabs/SDK-Android |
| 10-20 International System | https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG) |

# LuxAcademy Sensor Dashboard

BCI(Brain-Computer Interface) 헤드셋의 EEG/PPG 센서 데이터를 실시간으로 수집, 시각화하고,
학생들이 센서 데이터를 활용하여 로봇을 제어하는 코드를 작성할 수 있도록 지원하는 교육용 대시보드입니다.

---

## 0. 센서 장치 소개 (About the Sensor Device)

본 프로젝트는 **LooxidLabs**에서 개발한 **LinkBand** BCI 헤드셋을 사용합니다.

| 항목 | 내용 |
|------|------|
| 장치명 | LinkBand |
| 제조사 | LooxidLabs (룩시드랩스) |
| 연결 방식 | BLE (Bluetooth Low Energy) |
| Android SDK | `io.github.looxidlabs:SDK-Android` (Maven Central) |
| 전극 배치 | 10-20 International System (FP1, FP2) |
| 착용 위치 | 이마 (전두엽 영역) |

LinkBand는 이마에 착용하는 경량 BCI 장치로, EEG(뇌전도), PPG(광용적맥파), ACC(가속도) 센서를 내장하고 있습니다.
PPG 센서는 IR(적외선) 및 Red(적색) 광원을 사용하여 심박수(BPM)와 산소포화도(SpO2)를 측정합니다.

### 참고 링크

- SDK 공식 문서: https://sdk.linkband.store/
- GitHub 저장소: https://github.com/LooxidLabs/SDK-Android

---

## 1. 프로젝트 소개

| 항목 | 설명 |
|------|------|
| 대상 | LuxAcademy 수업에 참여하는 학생 및 교사 |
| 목적 | 뇌파(EEG)와 맥파(PPG) 데이터를 실시간 모니터링하고, 이를 활용한 로봇 제어 코드를 작성 |
| 핵심 기술 | Python (FastAPI), React (Vite), WebSocket, SSE |

**교사**는 대시보드에서 학생의 뇌파/심박 데이터를 실시간으로 확인할 수 있고,
**학생**은 Python 코드를 작성하여 자신의 뇌파 상태에 따라 로봇을 제어합니다.

---

## 2. 시스템 구조

```
┌──────────────┐     SSE (HTTPS)     ┌──────────────────┐     WebSocket     ┌──────────────────┐
│ BCI Headset  │ ──────────────────► │  Cloud SSE API   │ ◄─────────────── │                  │
│ (EEG + PPG)  │                     │  (broadcast-     │                   │  React Frontend  │
└──────────────┘                     │   server)        │                   │  (Vite, :5173)   │
                                     └────────┬─────────┘                   └────────▲─────────┘
                                              │                                      │
                                              │ SSE Stream                  WebSocket │
                                              ▼                                      │
                                     ┌──────────────────┐                            │
                                     │  Python Backend   │ ───────────────────────────┘
                                     │  (FastAPI, :8000) │
                                     └────────┬─────────┘
                                              │
                                              │ sensor_data (Python)
                                              ▼
                                     ┌──────────────────┐
                                     │  Student Code     │
                                     │  (robot_control)  │
                                     └──────────────────┘
```

**데이터 흐름:**
1. BCI 헤드셋이 EEG/PPG 데이터를 Cloud SSE API로 전송
2. Python Backend가 SSE API에 연결하여 데이터를 수집 및 파싱
3. 파싱된 데이터를 WebSocket으로 React Frontend에 실시간 전달
4. 학생은 Python에서 같은 데이터를 받아 로봇 제어 코드를 작성

---

## 3. 빠른 시작 (Quick Start)

### 사전 준비

- **Node.js** 18 이상
- **Python** 3.9 이상
- **npm** (Node.js와 함께 설치됨)

### 3-1. Backend 실행

```bash
# 프로젝트 루트에서 backend 폴더로 이동
cd backend

# 가상환경 생성 및 활성화 (권장)
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python3 server.py
```

서버가 `http://localhost:8000` 에서 시작됩니다.

### 3-2. Frontend 실행

```bash
# 프로젝트 루트에서 실행
npm install
npm run dev
```

개발 서버가 `http://localhost:5173` 에서 시작됩니다.

### 3-3. 대시보드 확인

브라우저에서 `http://localhost:5173` 을 열면 실시간 센서 대시보드를 볼 수 있습니다.

---

## 4. 센서 데이터 설명

> LinkBand는 센서별로 샘플링 레이트가 다르므로, 하나의 데이터 패킷 안에서도 배열 길이가 다를 수 있습니다.
> 데이터 내보내기 형식: CSV (센서별 컬럼) 또는 JSON (timestamp 배열 + 센서 값 배열).

### 4-0. 뇌파 주파수 대역 (Brainwave Frequency Bands)

EEG 분석 지표를 이해하려면 뇌파의 주파수 대역을 알아야 합니다.
LinkBand의 서버 측 FFT 분석은 아래 주파수 대역을 기반으로 각 지표를 산출합니다.

| 대역 | 주파수 범위 | 한국어 | 설명 |
|------|------------|--------|------|
| **Delta** | 0.5 - 4 Hz | 델타파 | 깊은 수면 상태에서 우세. 의식이 거의 없는 상태 |
| **Theta** | 4 - 8 Hz | 세타파 | 졸음, 명상, 창의적 사고 시 발생. 내면 집중 상태 |
| **Alpha** | 8 - 13 Hz | 알파파 | 이완, 안정 상태. 눈을 감고 편안할 때 우세 |
| **SMR** | 12 - 15 Hz | SMR파 | 집중 준비 상태 (Sensorimotor Rhythm). 주의력 유지와 관련 |
| **Beta** | 13 - 30 Hz | 베타파 | 활발한 사고, 집중, 문제 해결 시 우세 |
| **Gamma** | 30 Hz 이상 | 감마파 | 고도의 인지 처리, 학습, 기억 통합 시 발생 |

### 4-1. EEG Raw (뇌파 원시 데이터)

LinkBand의 FP1/FP2 전극에서 직접 측정된 전기 신호입니다.
10-20 International System 기준으로 이마 좌/우측에 배치됩니다.

| 필드 | 설명 | 단위/범위 |
|------|------|-----------|
| `fp1` | 왼쪽 전두엽 (Left Frontal, FP1) 전극 전압값 | uV (마이크로볼트) |
| `fp2` | 오른쪽 전두엽 (Right Frontal, FP2) 전극 전압값 | uV (마이크로볼트) |
| `signalQuality` | 신호 품질 | 0 = 최고 (int), 높을수록 노이즈 |
| `leadOff` | 전극 접촉 상태 | `{ch1: bool, ch2: bool}` - `true` = 접촉 안됨 |
| `timestamp` | 측정 시각 | ms (float) |

- **채널 수**: 2채널 (FP1, FP2)
- **샘플링 레이트**: 250Hz
- **패킷당 샘플 수**: ~25개 (250Hz / 10 packets per second)

### 4-2. EEG Analysis (뇌파 분석 데이터)

원시 뇌파에 서버 측 FFT(Fast Fourier Transform) 분석을 적용하여 산출된 고수준 지표입니다.
`totalPower`를 제외하고 모든 값은 0 ~ 1 범위입니다.
`movingAverageValues` 필드에 각 지표의 이동 평균(smoothed) 값이 포함됩니다.

| 필드 | 한국어 | 기반 주파수 대역 | 설명 | 범위 |
|------|--------|-----------------|------|------|
| `attention` | 집중도 | **Beta (13-30Hz)** power ratio | Beta파 비중이 높을수록 집중 상태 | 0 ~ 1 |
| `focusIndex` | 초점 지수 | **SMR (12-15Hz)** + **Mid-Beta** ratio | 시각적/인지적 초점의 정도. 주의 유지 능력 | 0 ~ 1 |
| `relaxationIndex` | 이완 지수 | **Alpha (8-13Hz)** power ratio | Alpha파 비중이 높을수록 편안한 상태 | 0 ~ 1 |
| `stressIndex` | 스트레스 지수 | **High-Beta (20-30Hz)** dominance | High-Beta 우세 시 긴장/불안 상태 | 0 ~ 1 |
| `cognitiveLoad` | 인지 부하 | **Theta/Alpha** ratio | Theta 대비 Alpha 비율로 정보 처리 부하 측정 | 0 ~ 1 |
| `emotionalBalance` | 감정 균형 | **FP1 vs FP2** asymmetry | 좌/우 전두엽 활성 비대칭. 0.5가 균형 상태 | 0 ~ 1 |
| `meditationLevel` | 명상 수준 | **Theta (4-8Hz)** + **Alpha** dominance | Theta+Alpha 우세 시 깊은 이완/명상 상태 | 0 ~ 1 |
| `totalPower` | 총 파워 | 전 대역 | 전체 스펙트럼 파워 (Total spectral power) | dB |

### 4-3. PPG Analysis (맥파 분석 데이터)

광용적맥파(PPG, Photoplethysmography) 센서로 측정한 심혈관 데이터입니다.
LinkBand는 이마에 위치한 IR(적외선) + Red(적색) 광원을 사용합니다.

| 필드 | 한국어 | 설명 | 단위 |
|------|--------|------|------|
| `bpm` | 심박수 | 분당 심장 박동 수 (Beats Per Minute) | BPM (float) |
| `spo2` | 산소포화도 | 혈중 산소 농도. 측정 불가 시 `null` | % (float\|null) |

- **샘플링 레이트**: 50Hz (PPG Raw 기준)
- **광원**: IR (Infrared) + Red light

### 4-4. Accelerometer (가속도 센서)

헤드셋의 움직임을 측정합니다. Motion mode switching을 지원합니다.

| 필드 | 설명 | 단위 |
|------|------|------|
| `x` | X축 가속도 | g (float) |
| `y` | Y축 가속도 | g (float) |
| `z` | Z축 가속도 | g (float) |
| `magnitude` | 합성 가속도 (sqrt(x^2 + y^2 + z^2)) | g (float) |
| `timestamp` | 측정 시각 | ms (float) |

- **샘플링 레이트**: 25Hz
- **3축**: X, Y, Z

### 4-5. Battery (배터리)

| 필드 | 설명 | 범위 |
|------|------|------|
| `level` | 실시간 배터리 충전 잔량 | 0 ~ 100 (%) |

---

## 5. 학생 가이드: 로봇 제어 코드 작성법

### 5-1. 기본 구조

`backend/` 폴더에 새로운 Python 파일을 만들어 로봇 제어 코드를 작성합니다.

```python
# robot_controller.py
import asyncio
import json
import websockets
from sensor_data import from_dict, SensorData

async def on_sensor_data(data: SensorData):
    """
    센서 데이터가 들어올 때마다 호출되는 함수입니다.
    여기에 로봇 제어 로직을 작성하세요!
    """
    if data.eeg_analysis:
        attention = data.eeg_analysis.attention
        stress = data.eeg_analysis.stress_index

        # 예제: 집중하면 전진, 긴장하면 정지
        if attention > 0.6:
            print(f"집중도 {attention:.2f} → 로봇 전진!")
            # robot.forward()
        elif stress > 0.7:
            print(f"스트레스 {stress:.2f} → 로봇 정지!")
            # robot.stop()

    if data.ppg_analysis:
        bpm = data.ppg_analysis.bpm
        print(f"심박수: {bpm:.0f} BPM")

async def main():
    uri = "ws://localhost:8000/ws"
    async with websockets.connect(uri) as ws:
        print("서버에 연결되었습니다!")
        async for message in ws:
            raw = json.loads(message)
            if raw.get("type") == "sensor":
                data = from_dict(raw)
                await on_sensor_data(data)

if __name__ == "__main__":
    asyncio.run(main())
```

### 5-2. sensor_data 모듈 사용법

`sensor_data.py`에 정의된 dataclass를 활용하면 센서 데이터에 쉽게 접근할 수 있습니다.

```python
from sensor_data import from_dict

data = from_dict(raw_dict)

# EEG 분석 데이터 접근
data.eeg_analysis.attention        # 집중도
data.eeg_analysis.stress_index     # 스트레스
data.eeg_analysis.relaxation_index # 이완 지수

# PPG 데이터 접근
data.ppg_analysis.bpm              # 심박수
data.ppg_analysis.spo2             # 산소포화도

# EEG 원시 데이터 접근
data.eeg_raw.fp1                   # 왼쪽 전극 값 리스트
data.eeg_raw.fp2                   # 오른쪽 전극 값 리스트
```

### 5-3. 사용 가능한 로봇 함수 (예시)

| 함수 | 설명 |
|------|------|
| `robot.forward()` | 전진 |
| `robot.backward()` | 후진 |
| `robot.turn_left()` | 좌회전 |
| `robot.turn_right()` | 우회전 |
| `robot.stop()` | 정지 |
| `robot.set_speed(value)` | 속도 설정 (0.0 ~ 1.0) |

> 실제 로봇 함수는 수업에서 제공하는 로봇 라이브러리에 따라 다를 수 있습니다.

### 5-4. 실행 방법

```bash
# backend 폴더에서 실행 (서버가 먼저 실행 중이어야 합니다)
cd backend
pip install websockets    # 최초 1회
python3 robot_controller.py
```

---

## 6. API 엔드포인트

### Cloud SSE API (데이터 소스)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId=xxx` | SSE 스트림 구독 |

### Python Backend (localhost:8000)

| Method | URL | 설명 |
|--------|-----|------|
| WebSocket | `ws://localhost:8000/ws` | 실시간 센서 데이터 스트림 |
| GET | `http://localhost:8000/health` | 서버 상태 확인 (SSE 연결 여부, 클라이언트 수) |

#### WebSocket 메시지 타입

| type | 설명 | 시점 |
|------|------|------|
| `snapshot` | 최신 데이터 일괄 전송 | WebSocket 연결 직후 |
| `sensor` | 실시간 센서 데이터 | SSE에서 데이터 수신 시마다 |
| `status` | SSE 연결 상태 변경 | 연결/해제 시 |

---

## 7. 프로젝트 구조

```
sensor-dashboard/
├── backend/
│   ├── server.py              # FastAPI 서버 (SSE 수집 + WebSocket 브로드캐스트)
│   ├── sensor_data.py         # 센서 데이터 타입 정의 (dataclass)
│   └── requirements.txt       # Python 의존성 (fastapi, uvicorn, httpx)
│
├── src/                       # React Frontend 소스
│   ├── main.jsx               # React 진입점
│   ├── App.jsx                # 메인 App 컴포넌트
│   ├── App.css                # App 스타일
│   ├── index.css              # 글로벌 스타일
│   ├── components/
│   │   ├── EegChart.jsx       # EEG 원시 데이터 차트 (fp1, fp2 파형)
│   │   ├── EegAnalysis.jsx    # EEG 분석 지표 시각화
│   │   └── BpmDisplay.jsx     # 심박수(BPM) 표시
│   ├── hooks/
│   │   └── useSensorData.js   # WebSocket 연결 및 센서 데이터 관리 Hook
│   └── assets/                # 이미지 등 정적 자원
│
├── public/                    # 정적 파일 (favicon 등)
├── index.html                 # HTML 템플릿
├── package.json               # Node.js 의존성 및 스크립트
├── vite.config.js             # Vite 설정
├── eslint.config.js           # ESLint 설정
└── README.md                  # 이 문서
```

---

## 8. 문제 해결 (Troubleshooting)

### Backend 서버가 시작되지 않음

```
ModuleNotFoundError: No module named 'fastapi'
```
**해결:** `pip install -r requirements.txt`를 실행했는지 확인하세요. 가상환경을 사용 중이라면 활성화 상태인지 확인하세요.

---

### Frontend에서 데이터가 표시되지 않음

**확인 사항:**
1. Backend 서버가 `http://localhost:8000`에서 실행 중인지 확인
2. `http://localhost:8000/health` 에 접속하여 `sseConnected: true` 인지 확인
3. 브라우저 개발자 도구(F12) Console 탭에서 WebSocket 연결 오류가 없는지 확인

---

### SSE 연결이 계속 끊어짐

```
❌ SSE 연결 끊김: ...
```
**원인:** 네트워크 문제이거나 Cloud SSE 서버가 일시적으로 불안정할 수 있습니다.
**해결:** Backend는 자동으로 3초 후 재연결을 시도합니다. 네트워크 연결 상태를 확인하세요.

---

### WebSocket 연결 실패 (학생 코드)

```
ConnectionRefusedError: [Errno 111] Connection refused
```
**해결:**
1. Backend 서버가 먼저 실행 중이어야 합니다 (`python3 server.py`)
2. `websockets` 패키지가 설치되어 있는지 확인: `pip install websockets`

---

### 신호 품질이 나쁨 (signalQuality 값이 높음)

**해결:**
1. 헤드셋 전극이 이마에 제대로 접촉되어 있는지 확인
2. 전극 부위의 피부가 깨끗한지 확인 (땀, 유분 제거)
3. 헤드셋을 다시 착용한 후 몇 초간 안정을 취한 뒤 데이터를 확인

---

### npm install 실패

```
npm ERR! code ENOENT
```
**해결:** 프로젝트 루트 폴더 (`sensor-dashboard/`)에서 명령어를 실행하고 있는지 확인하세요. `backend/` 폴더가 아닌 상위 폴더에서 실행해야 합니다.

---

## 9. 참고 자료 (References)

| 자료 | 링크 |
|------|------|
| LinkBand SDK 공식 문서 | https://sdk.linkband.store/ |
| LooxidLabs SDK-Android GitHub | https://github.com/LooxidLabs/SDK-Android |
| Android SDK (Maven Central) | `io.github.looxidlabs:SDK-Android` |
| 10-20 International System | https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG) |

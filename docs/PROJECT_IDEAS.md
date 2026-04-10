# BCI 센서 데이터 프로젝트 아이디어

> 뇌파(EEG)와 생체 신호(PPG)를 활용한 학생 프로젝트 가이드
>
> LuxAcademy Sensor Dashboard

---

## 목차

1. [센서 데이터 활용 방안 분석](#1-센서-데이터-활용-방안-분석)
2. [학생 프로젝트 아이디어](#2-학생-프로젝트-아이디어)
3. [데이터 활용 팁](#3-데이터-활용-팁)

---

## 1. 센서 데이터 활용 방안 분석

### 1.1 각 데이터 유형에서 얻을 수 있는 인사이트

#### EEG 원시 데이터 (fp1, fp2)

| 항목 | 설명 | 활용 가능한 인사이트 |
|------|------|---------------------|
| fp1 (왼쪽 전두엽) | 논리적 사고, 언어 처리 담당 영역 | 수학 문제 풀이, 글쓰기 등 논리적 활동 감지 |
| fp2 (오른쪽 전두엽) | 창의적 사고, 공간 인식 담당 영역 | 그림 그리기, 음악 감상 등 창의적 활동 감지 |
| fp1 vs fp2 차이 | 좌뇌/우뇌 활성도 비교 | 현재 어떤 유형의 사고를 하고 있는지 추정 |
| signalQuality | 전극 접촉 상태 | 데이터 신뢰도 판단, 노이즈 필터링 기준 |

#### EEG 분석 데이터

| 지표 | 범위 | 의미 | 활용 예시 |
|------|------|------|----------|
| attention (집중도) | 0~1 | 높을수록 정신적으로 집중 | 집중 상태에서 로봇 전진 |
| focusIndex (초점 지수) | 0~1 | 시각/인지적 주의 집중 | 특정 대상에 시선 고정 감지 |
| relaxationIndex (이완 지수) | 0~1 | 높을수록 편안한 상태 | 명상 앱, 휴식 알림 |
| stressIndex (스트레스 지수) | 0~1 | 높을수록 긴장 상태 | 스트레스 경보, 안전 정지 |
| cognitiveLoad (인지 부하) | 0~1 | 뇌가 처리 중인 정보량 | 학습 난이도 자동 조절 |
| emotionalBalance (감정 균형) | 0~1 | 0.5가 균형, 좌우뇌 활성 비율 | 감정 상태 시각화 |
| meditationLevel (명상 수준) | 0~1 | 깊은 이완/무념 상태 | 명상 훈련 피드백 |
| totalPower (총 파워) | dB | 전체 뇌파 에너지 | 각성 vs 졸림 판별 |

#### PPG 분석 데이터

| 지표 | 의미 | 활용 예시 |
|------|------|----------|
| bpm (심박수) | 분당 심장 박동 수 (보통 60~100) | 운동 강도, 긴장도 측정 |
| spo2 (산소포화도) | 혈중 산소 농도 (정상: 95~100%) | 건강 모니터링, 호흡 훈련 |

#### 가속도 센서 데이터

| 지표 | 의미 | 활용 예시 |
|------|------|----------|
| x, y, z | 3축 가속도 (g 단위) | 머리 기울기/움직임 감지 |
| magnitude | 합성 가속도 | 움직임 강도 판별 |

### 1.2 데이터 조합으로 더 풍부한 응용 만들기

단일 센서 값보다 **여러 센서를 조합**하면 훨씬 정확하고 의미 있는 결과를 얻을 수 있습니다.

| 조합 | 가능한 해석 |
|------|------------|
| attention 높음 + stressIndex 낮음 | "몰입(Flow) 상태" - 이상적인 학습 상태 |
| attention 낮음 + relaxationIndex 높음 | "휴식 상태" - 쉬고 있거나 졸리는 상태 |
| stressIndex 높음 + bpm 높음 | "긴장 상태" - 시험 불안, 발표 긴장 등 |
| cognitiveLoad 높음 + attention 높음 | "도전 상태" - 어려운 문제에 도전 중 |
| relaxationIndex 높음 + meditationLevel 높음 | "명상 상태" - 깊은 이완 달성 |
| emotionalBalance ~0.5 + stressIndex 낮음 | "안정 상태" - 감정적으로 균형 잡힌 상태 |
| 가속도 변화 + attention 변화 | 움직임이 집중에 미치는 영향 분석 |

### 1.3 BCI 기술의 실제 응용 분야

우리가 사용하는 센서 기술은 이미 다양한 산업에서 활용되고 있습니다.

- **의료 (Medical)**: 뇌전증 발작 예측, ADHD 진단 보조, 수면 장애 분석, 뇌졸중 재활 훈련
- **게임 (Gaming)**: 뇌파로 캐릭터 조종, 감정에 따라 변하는 게임 난이도, VR 몰입도 측정
- **교육 (Education)**: 학습 집중도 모니터링, 맞춤형 학습 속도 조절, 시험 불안 감지 및 관리
- **접근성 (Accessibility)**: 전신 마비 환자의 의사소통 보조, 눈 깜빡임/뇌파로 휠체어 제어
- **웰니스 (Wellness)**: 명상 훈련 피드백, 스트레스 관리 앱, 수면 품질 측정
- **자동차 (Automotive)**: 졸음 운전 감지, 운전자 집중도 모니터링

---

## 2. 학생 프로젝트 아이디어

---

### 초급 (Beginner) 프로젝트

> 하나의 센서 값과 간단한 임계값(threshold) 비교만으로 구현할 수 있는 프로젝트

---

#### 프로젝트 1: 마인드 스위치 (Mind Switch)

| 항목 | 내용 |
|------|------|
| **난이도** | 초급 |
| **사용 센서 데이터** | `eeg_analysis.attention` |
| **구현 개요** | 집중도가 일정 수준 이상이면 LED를 켜고, 아래면 끄는 "생각으로 켜는 스위치". 가장 기본적인 BCI 체험 프로젝트입니다. |
| **필요한 추가 하드웨어** | LED 1개 + Arduino (또는 화면 출력으로 대체 가능) |
| **학습 목표** | - WebSocket 데이터 수신 이해 <br> - 임계값(threshold) 기반 제어 개념 <br> - if/else 조건문 활용 |

**힌트 코드:**

```python
# 집중도 임계값 설정
ATTENTION_THRESHOLD = 0.6

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    attention = data.eeg_analysis.attention
    
    if attention > ATTENTION_THRESHOLD:
        # LED 켜기 (또는 화면에 "ON" 출력)
        print(f"[ON] 집중도: {attention:.2f} - LED 켜짐!")
    else:
        # LED 끄기
        print(f"[OFF] 집중도: {attention:.2f} - LED 꺼짐")
```

---

#### 프로젝트 2: 하트비트 DJ (Heartbeat DJ)

| 항목 | 내용 |
|------|------|
| **난이도** | 초급 |
| **사용 센서 데이터** | `ppg_analysis.bpm` |
| **구현 개요** | 심박수에 따라 음악 재생 속도(BPM)를 자동 조절합니다. 심박수가 빠르면 신나는 템포, 느리면 차분한 템포로 바뀝니다. |
| **필요한 추가 하드웨어** | 스피커 (컴퓨터 내장 스피커 가능) |
| **학습 목표** | - PPG 데이터 이해 <br> - 연속적인 값 매핑 (mapping) 개념 <br> - 외부 라이브러리 활용 (pygame 등) |

**힌트 코드:**

```python
# 심박수 범위를 음악 속도로 매핑
BPM_MIN, BPM_MAX = 60, 120       # 예상 심박수 범위
TEMPO_MIN, TEMPO_MAX = 0.5, 2.0  # 음악 재생 배속

def map_value(value, in_min, in_max, out_min, out_max):
    """값을 한 범위에서 다른 범위로 변환"""
    value = max(in_min, min(in_max, value))  # 범위 제한
    return out_min + (value - in_min) * (out_max - out_min) / (in_max - in_min)

def on_sensor_data(data: SensorData):
    if data.ppg_analysis is None:
        return
    
    bpm = data.ppg_analysis.bpm
    tempo = map_value(bpm, BPM_MIN, BPM_MAX, TEMPO_MIN, TEMPO_MAX)
    
    print(f"심박수: {bpm:.0f} BPM -> 음악 속도: {tempo:.1f}x")
    # pygame.mixer.music 등을 사용하여 실제 재생 속도 변경
```

---

#### 프로젝트 3: 졸음 감지 알람 (Sleep Guard)

| 항목 | 내용 |
|------|------|
| **난이도** | 초급 |
| **사용 센서 데이터** | `eeg_analysis.attention`, `eeg_analysis.relaxation_index` |
| **구현 개요** | 집중도가 떨어지고 이완도가 높아지면 졸음 상태로 판단하여 알람을 울립니다. 수업 중 졸음 방지 또는 운전 중 졸음 방지 시뮬레이션에 활용 가능합니다. |
| **필요한 추가 하드웨어** | 부저 또는 스피커 (컴퓨터 내장 가능) |
| **학습 목표** | - 복수 조건 결합 (AND 조건) <br> - 지속 시간 판단 (타이머) 개념 <br> - 경보 시스템 설계 |

**힌트 코드:**

```python
import time

drowsy_start_time = None  # 졸음 시작 시각
DROWSY_DURATION = 5       # 5초 이상 졸면 알람

def on_sensor_data(data: SensorData):
    global drowsy_start_time
    
    if data.eeg_analysis is None:
        return
    
    eeg = data.eeg_analysis
    is_drowsy = eeg.attention < 0.3 and eeg.relaxation_index > 0.7
    
    if is_drowsy:
        if drowsy_start_time is None:
            drowsy_start_time = time.time()
        
        elapsed = time.time() - drowsy_start_time
        if elapsed >= DROWSY_DURATION:
            print("*** 알람! 졸음이 감지되었습니다! ***")
            # 부저 울리기 또는 소리 재생
    else:
        drowsy_start_time = None  # 졸음 해제
        print(f"정상 상태 - 집중: {eeg.attention:.2f}")
```

---

### 중급 (Intermediate) 프로젝트

> 여러 센서를 조합하거나, 시간에 따른 데이터 변화를 분석하는 프로젝트

---

#### 프로젝트 4: 뇌파 미로 탈출 로봇 (Mind Maze Runner)

| 항목 | 내용 |
|------|------|
| **난이도** | 중급 |
| **사용 센서 데이터** | `eeg_analysis.attention`, `eeg_analysis.focus_index`, `eeg_analysis.stress_index` |
| **구현 개요** | 집중도로 로봇 전진/후진을 제어하고, 좌뇌/우뇌 균형(emotionalBalance)으로 좌회전/우회전을 제어합니다. 스트레스가 높아지면 안전 정지합니다. 미로판 위에서 뇌파만으로 로봇을 목적지까지 이동시키세요! |
| **필요한 추가 하드웨어** | 2륜 또는 4륜 로봇 키트, 미로판 (골판지로 제작 가능) |
| **학습 목표** | - 복수 센서 데이터 동시 활용 <br> - 상태 기계(state machine) 설계 <br> - 안전 장치(failsafe) 개념 |

**힌트 코드:**

```python
# 상태 정의
STATE_STOP = "정지"
STATE_FORWARD = "전진"
STATE_LEFT = "좌회전"
STATE_RIGHT = "우회전"

current_state = STATE_STOP

def on_sensor_data(data: SensorData):
    global current_state
    
    if data.eeg_analysis is None:
        return
    
    eeg = data.eeg_analysis
    
    # 안전 우선: 스트레스 높으면 무조건 정지
    if eeg.stress_index > 0.7:
        current_state = STATE_STOP
        stop()
        print("스트레스 감지 - 안전 정지!")
        return
    
    # 집중해야 전진 가능
    if eeg.attention > 0.6:
        # 감정 균형으로 방향 결정 (0.5 기준)
        balance = eeg.emotional_balance
        
        if balance < 0.35:
            current_state = STATE_LEFT
            turn_left()
        elif balance > 0.65:
            current_state = STATE_RIGHT
            turn_right()
        else:
            current_state = STATE_FORWARD
            move_forward()
    else:
        current_state = STATE_STOP
        stop()
    
    print(f"상태: {current_state} | 집중: {eeg.attention:.2f} | "
          f"균형: {eeg.emotional_balance:.2f}")
```

---

#### 프로젝트 5: 스트레스 힐링 램프 (Stress Healing Lamp)

| 항목 | 내용 |
|------|------|
| **난이도** | 중급 |
| **사용 센서 데이터** | `eeg_analysis.stress_index`, `eeg_analysis.relaxation_index`, `ppg_analysis.bpm` |
| **구현 개요** | 스트레스 수준에 따라 LED 색상이 변하는 힐링 램프. 스트레스가 높으면 빨간색, 안정되면 파란색, 이완되면 초록색으로 부드럽게 전환됩니다. 심박수로 LED 깜빡임 속도를 조절하여 호흡 유도(biofeedback) 효과도 줄 수 있습니다. |
| **필요한 추가 하드웨어** | RGB LED 스트립 또는 NeoPixel + Arduino |
| **학습 목표** | - RGB 색상 혼합 이해 <br> - 값의 부드러운 전환 (smoothing/lerp) <br> - Biofeedback 원리 이해 |

**힌트 코드:**

```python
def stress_to_color(stress, relaxation):
    """스트레스/이완 수준을 RGB 색상으로 변환"""
    # 스트레스 높음: 빨간색(255,0,0), 이완 높음: 초록색(0,255,0), 중간: 파란색(0,0,255)
    if stress > 0.6:
        r = int(255 * stress)
        g = int(50 * (1 - stress))
        b = 0
    elif relaxation > 0.6:
        r = 0
        g = int(255 * relaxation)
        b = int(100 * (1 - relaxation))
    else:
        r = 50
        g = 50
        b = int(200 * (1 - stress))
    return (r, g, b)

# 이전 색상 (부드러운 전환을 위해)
prev_color = (0, 0, 0)
SMOOTH_FACTOR = 0.1  # 색상 전환 속도 (0~1, 낮을수록 부드러움)

def lerp(a, b, t):
    """두 값 사이를 부드럽게 보간"""
    return a + (b - a) * t

def on_sensor_data(data: SensorData):
    global prev_color
    
    if data.eeg_analysis is None:
        return
    
    eeg = data.eeg_analysis
    target_color = stress_to_color(eeg.stress_index, eeg.relaxation_index)
    
    # 부드러운 색상 전환
    smooth_color = tuple(
        int(lerp(prev_color[i], target_color[i], SMOOTH_FACTOR))
        for i in range(3)
    )
    prev_color = smooth_color
    
    # 심박수로 깜빡임 간격 설정 (호흡 유도)
    blink_interval = None
    if data.ppg_analysis:
        # 심박수보다 약간 느린 호흡 속도로 깜빡여서 진정 효과
        blink_interval = 60 / max(data.ppg_analysis.bpm * 0.3, 1)
    
    print(f"색상: RGB{smooth_color} | "
          f"스트레스: {eeg.stress_index:.2f} | "
          f"이완: {eeg.relaxation_index:.2f}")
    # 실제로는 Arduino로 RGB 값 전송
```

---

#### 프로젝트 6: 집중력 트레이너 (Focus Trainer)

| 항목 | 내용 |
|------|------|
| **난이도** | 중급 |
| **사용 센서 데이터** | `eeg_analysis.attention`, `eeg_analysis.focus_index`, `eeg_analysis.cognitive_load` |
| **구현 개요** | 게임 형태의 집중력 훈련 프로그램. 화면의 공이 집중하면 위로 올라가고, 집중을 잃으면 아래로 떨어집니다. 목표 높이를 유지하면 점수를 획득합니다. 시간에 따른 집중력 변화 그래프도 기록합니다. |
| **필요한 추가 하드웨어** | 없음 (컴퓨터 화면만 사용) |
| **학습 목표** | - 시계열 데이터 기록 및 시각화 <br> - 게이미피케이션(gamification) 설계 <br> - matplotlib 또는 pygame 활용 |

**힌트 코드:**

```python
import time
from collections import deque

# 게임 상태
ball_height = 50.0         # 공의 높이 (0~100)
score = 0
history = deque(maxlen=300) # 최근 5분 기록 (초당 1회 기준)
GRAVITY = 2.0              # 집중 안 하면 떨어지는 속도
LIFT_POWER = 5.0           # 집중하면 올라가는 속도
TARGET_ZONE = (60, 80)     # 목표 높이 범위

def on_sensor_data(data: SensorData):
    global ball_height, score
    
    if data.eeg_analysis is None:
        return
    
    attention = data.eeg_analysis.attention
    focus = data.eeg_analysis.focus_index
    
    # 집중도와 포커스 지수를 결합
    combined_focus = (attention * 0.7) + (focus * 0.3)
    
    # 공 높이 업데이트
    if combined_focus > 0.5:
        # 집중하면 올라감 (집중도에 비례)
        ball_height += LIFT_POWER * (combined_focus - 0.5)
    else:
        # 집중 안 하면 중력으로 떨어짐
        ball_height -= GRAVITY * (0.5 - combined_focus)
    
    # 높이 범위 제한
    ball_height = max(0, min(100, ball_height))
    
    # 목표 영역에 있으면 점수 획득
    if TARGET_ZONE[0] <= ball_height <= TARGET_ZONE[1]:
        score += 1
        zone_status = "목표 영역!"
    else:
        zone_status = "영역 밖..."
    
    # 기록 저장
    history.append({
        "time": time.time(),
        "attention": attention,
        "height": ball_height,
    })
    
    # 시각화 (간단한 텍스트 바)
    bar = "#" * int(ball_height / 2)
    print(f"[{bar:<50}] 높이: {ball_height:.0f} | "
          f"점수: {score} | {zone_status}")
```

---

### 고급 (Advanced) 프로젝트

> 데이터 분석, 머신러닝, 복합 제어 시스템을 포함하는 프로젝트

---

#### 프로젝트 7: 뇌파 패턴 분류기 (Brain Pattern Classifier)

| 항목 | 내용 |
|------|------|
| **난이도** | 고급 |
| **사용 센서 데이터** | `eeg_analysis` 전체, `eeg_raw` (fp1, fp2) |
| **구현 개요** | 다양한 정신 상태(집중, 이완, 계산, 상상 등)의 뇌파 패턴을 수집하고, 머신러닝 모델을 훈련시켜 현재 어떤 활동을 하고 있는지 자동 분류합니다. scikit-learn의 간단한 분류기로 시작하여 점차 정확도를 높여봅니다. |
| **필요한 추가 하드웨어** | 없음 |
| **학습 목표** | - 데이터 수집 및 라벨링 <br> - Feature engineering (특징 추출) <br> - 머신러닝 분류 모델 (SVM, Random Forest 등) <br> - 모델 평가 (정확도, 혼동행렬) |

**힌트 코드:**

```python
import json
import numpy as np
from collections import deque

# 데이터 수집 모드와 예측 모드 전환
MODE_COLLECT = "수집"
MODE_PREDICT = "예측"
current_mode = MODE_COLLECT
current_label = "집중"  # 수집할 때 어떤 상태인지 지정

# 수집된 데이터
collected_data = []        # [{"features": [...], "label": "집중"}, ...]
raw_buffer = deque(maxlen=250)  # 1초 분량의 원시 데이터

def extract_features(eeg_analysis, raw_buffer):
    """뇌파 데이터에서 분류에 사용할 특징(feature) 추출"""
    features = [
        eeg_analysis.attention,
        eeg_analysis.focus_index,
        eeg_analysis.relaxation_index,
        eeg_analysis.stress_index,
        eeg_analysis.cognitive_load,
        eeg_analysis.emotional_balance,
        eeg_analysis.meditation_level,
        eeg_analysis.total_power,
    ]
    
    # 원시 데이터에서 추가 특징 추출
    if len(raw_buffer) > 0:
        raw_array = np.array(list(raw_buffer))
        features.extend([
            np.mean(raw_array),    # 평균
            np.std(raw_array),     # 표준편차
            np.max(raw_array) - np.min(raw_array),  # 범위
        ])
    
    return features

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    # 원시 데이터 버퍼에 추가
    if data.eeg_raw and data.eeg_raw.fp1:
        raw_buffer.extend(data.eeg_raw.fp1)
    
    features = extract_features(data.eeg_analysis, raw_buffer)
    
    if current_mode == MODE_COLLECT:
        # 데이터 수집
        collected_data.append({
            "features": features,
            "label": current_label
        })
        print(f"[수집 중] {current_label} - {len(collected_data)}개 샘플")
    
    elif current_mode == MODE_PREDICT:
        # 학습된 모델로 예측 (train_model() 호출 후 사용)
        # prediction = model.predict([features])
        # print(f"[예측] 현재 상태: {prediction[0]}")
        pass

def train_model():
    """수집된 데이터로 분류 모델 학습"""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score
    
    X = [d["features"] for d in collected_data]
    y = [d["label"] for d in collected_data]
    
    model = RandomForestClassifier(n_estimators=100)
    scores = cross_val_score(model, X, y, cv=5)
    print(f"교차검증 정확도: {scores.mean():.1%} (+/- {scores.std():.1%})")
    
    model.fit(X, y)  # 전체 데이터로 최종 학습
    return model
```

---

#### 프로젝트 8: BCI 게임 컨트롤러 (Mind Game Controller)

| 항목 | 내용 |
|------|------|
| **난이도** | 고급 |
| **사용 센서 데이터** | `eeg_analysis` 전체, `ppg_analysis.bpm`, 가속도 센서 (x, y, z) |
| **구현 개요** | 뇌파와 머리 기울기로 게임을 조종하는 컨트롤러. 집중도로 "공격/가속", 이완으로 "방어/감속", 머리 기울기로 "방향 전환", 심박수에 따라 게임 난이도가 자동 조절됩니다. 키보드 입력을 에뮬레이션하여 기존 게임에도 연결 가능합니다. |
| **필요한 추가 하드웨어** | 없음 (가속도 센서는 BCI 헤드셋에 내장) |
| **학습 목표** | - 복합 입력 처리 및 매핑 <br> - 키보드 에뮬레이션 (pynput 등) <br> - 적응형 난이도 시스템 설계 <br> - 실시간 데이터 처리 최적화 |

**힌트 코드:**

```python
from collections import deque

# 게임 조작 매핑
class GameController:
    def __init__(self):
        self.bpm_history = deque(maxlen=30)
        self.baseline_bpm = 75      # 개인 평균 심박수 (캘리브레이션 필요)
        self.difficulty = 1.0       # 현재 난이도 (0.5 ~ 2.0)
        self.action_cooldown = 0    # 연속 입력 방지 타이머
    
    def update_difficulty(self, bpm):
        """심박수 기반 난이도 자동 조절"""
        self.bpm_history.append(bpm)
        if len(self.bpm_history) < 10:
            return
        
        avg_bpm = sum(self.bpm_history) / len(self.bpm_history)
        bpm_diff = avg_bpm - self.baseline_bpm
        
        if bpm_diff > 20:
            # 심박수 너무 높음 -> 난이도 낮추기 (쉬게 해주기)
            self.difficulty = max(0.5, self.difficulty - 0.05)
        elif bpm_diff < 5:
            # 심박수 안정 -> 난이도 올리기 (도전 유도)
            self.difficulty = min(2.0, self.difficulty + 0.02)
    
    def get_action(self, eeg, accel=None):
        """뇌파 + 가속도 -> 게임 액션 결정"""
        actions = []
        
        # 집중도 -> 공격/가속
        if eeg.attention > 0.7:
            actions.append("ATTACK" if eeg.attention > 0.85 else "ACCELERATE")
        
        # 이완도 -> 방어/감속
        if eeg.relaxation_index > 0.6:
            actions.append("DEFEND")
        
        # 가속도(머리 기울기) -> 방향
        if accel:
            if accel["x"] > 0.3:
                actions.append("RIGHT")
            elif accel["x"] < -0.3:
                actions.append("LEFT")
            if accel["y"] > 0.3:
                actions.append("UP")
            elif accel["y"] < -0.3:
                actions.append("DOWN")
        
        return actions

controller = GameController()

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    # 난이도 업데이트
    if data.ppg_analysis:
        controller.update_difficulty(data.ppg_analysis.bpm)
    
    # 가속도 데이터 (있으면)
    accel = None  # 가속도 데이터 파싱 필요
    
    # 게임 액션 결정
    actions = controller.get_action(data.eeg_analysis, accel)
    
    if actions:
        print(f"[게임] 액션: {', '.join(actions)} | "
              f"난이도: {controller.difficulty:.1f}")
        # pynput 등으로 실제 키보드 입력 전송
```

---

#### 프로젝트 9: 학습 효율 분석 대시보드 (Study Efficiency Dashboard)

| 항목 | 내용 |
|------|------|
| **난이도** | 고급 |
| **사용 센서 데이터** | `eeg_analysis` 전체, `ppg_analysis` 전체 |
| **구현 개요** | 공부하는 동안의 뇌파/심박 데이터를 기록하고, 언제 집중이 잘 되었는지, 언제 피로해졌는지를 시간대별로 분석합니다. "몰입(flow) 상태" 감지, 최적 학습 시간대 추천, 휴식 타이밍 알림 기능을 포함합니다. 웹 대시보드에서 결과를 시각화합니다. |
| **필요한 추가 하드웨어** | 없음 |
| **학습 목표** | - 시계열 데이터 저장 및 분석 <br> - 통계 지표 계산 (평균, 추세, 이동평균) <br> - 웹 시각화 (Chart.js, Plotly 등) <br> - Flow 상태 이론 이해 |

**힌트 코드:**

```python
import time
import json
from collections import deque

class StudySession:
    def __init__(self):
        self.start_time = time.time()
        self.data_log = []              # 전체 기록
        self.attention_window = deque(maxlen=60)  # 최근 1분 이동평균
        self.flow_count = 0             # 몰입 상태 누적 시간
        self.fatigue_alerts = 0         # 피로 알림 횟수
    
    def detect_flow_state(self, eeg):
        """몰입(Flow) 상태 감지: 높은 집중 + 낮은 스트레스 + 적절한 인지부하"""
        return (eeg.attention > 0.65 and 
                eeg.stress_index < 0.4 and 
                0.3 < eeg.cognitive_load < 0.7)
    
    def detect_fatigue(self, eeg, bpm=None):
        """피로 감지: 집중 저하 + 이완 증가 (+ 심박 변화)"""
        attention_avg = (sum(self.attention_window) / len(self.attention_window)
                        if self.attention_window else 0)
        return (attention_avg < 0.35 and 
                eeg.relaxation_index > 0.6)
    
    def get_study_stats(self):
        """현재 학습 통계 반환"""
        elapsed = time.time() - self.start_time
        return {
            "총_학습시간_분": elapsed / 60,
            "몰입시간_분": self.flow_count / 60,
            "몰입비율": self.flow_count / max(elapsed, 1),
            "평균_집중도": (sum(d["attention"] for d in self.data_log) / 
                          max(len(self.data_log), 1)),
            "피로_알림_횟수": self.fatigue_alerts,
        }

session = StudySession()

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    eeg = data.eeg_analysis
    bpm = data.ppg_analysis.bpm if data.ppg_analysis else None
    
    # 기록 저장
    record = {
        "time": time.time(),
        "attention": eeg.attention,
        "stress": eeg.stress_index,
        "cognitive_load": eeg.cognitive_load,
        "bpm": bpm,
    }
    session.data_log.append(record)
    session.attention_window.append(eeg.attention)
    
    # 몰입 상태 체크
    if session.detect_flow_state(eeg):
        session.flow_count += 1
        print("--- FLOW 상태! 잘하고 있어요 ---")
    
    # 피로 감지
    if session.detect_fatigue(eeg, bpm):
        session.fatigue_alerts += 1
        print("*** 피로 감지! 5분 휴식을 추천합니다 ***")
    
    # 5분마다 통계 출력
    if len(session.data_log) % 300 == 0:
        stats = session.get_study_stats()
        print(f"\n=== 학습 통계 ===")
        for key, value in stats.items():
            print(f"  {key}: {value:.2f}")

    # JSON으로 저장하여 웹 대시보드에서 시각화 가능
    # with open("study_log.json", "w") as f:
    #     json.dump(session.data_log, f)
```

---

#### 프로젝트 10: 감정 반응 음악 생성기 (Emotion Music Generator)

| 항목 | 내용 |
|------|------|
| **난이도** | 고급 |
| **사용 센서 데이터** | `eeg_analysis.emotional_balance`, `eeg_analysis.stress_index`, `eeg_analysis.relaxation_index`, `ppg_analysis.bpm` |
| **구현 개요** | 현재 감정 상태에 반응하여 실시간으로 음악을 생성합니다. 감정 균형으로 장조/단조를 결정하고, 스트레스로 불협화음 정도를 조절하며, 이완도로 템포를, 심박수로 리듬 패턴을 만듭니다. MIDI를 활용하여 실제로 들을 수 있는 음악을 만들어봅니다. |
| **필요한 추가 하드웨어** | 없음 (소프트웨어 신디사이저 사용) |
| **학습 목표** | - 감정 모델링 (Valence-Arousal 모델) <br> - MIDI 프로토콜 이해 <br> - 음악 이론 기초 (음계, 화음, 리듬) <br> - 실시간 생성(generative) 시스템 설계 |

**힌트 코드:**

```python
import random

# 음계 정의
MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]  # 장조 (밝은 느낌)
MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]  # 단조 (어두운 느낌)

class EmotionMusicGenerator:
    def __init__(self, base_note=60):  # 60 = C4 (가운데 도)
        self.base_note = base_note
        self.current_scale = MAJOR_SCALE
        self.tempo_bpm = 120
        self.note_sequence = []
    
    def update_from_brain(self, eeg, bpm=None):
        """뇌파 데이터로 음악 파라미터 업데이트"""
        # 감정 균형 -> 장조/단조
        if eeg.emotional_balance > 0.55:
            self.current_scale = MAJOR_SCALE
        else:
            self.current_scale = MINOR_SCALE
        
        # 이완도 -> 템포 (이완하면 느리게)
        self.tempo_bpm = int(60 + (1 - eeg.relaxation_index) * 120)
        
        # 심박수 -> 리듬 밀도
        if bpm:
            self.tempo_bpm = int(self.tempo_bpm * 0.7 + bpm * 0.3)
        
        return self.generate_next_notes(eeg)
    
    def generate_next_notes(self, eeg):
        """다음에 재생할 음표 생성"""
        scale = self.current_scale
        notes = []
        
        # 집중도 높으면 -> 상승 멜로디, 낮으면 -> 하강 멜로디
        direction = 1 if eeg.attention > 0.5 else -1
        
        # 인지 부하 높으면 -> 복잡한 리듬 (음표 많이)
        num_notes = 2 + int(eeg.cognitive_load * 6)
        
        current_idx = random.randint(0, len(scale) - 1)
        for _ in range(num_notes):
            note = self.base_note + scale[current_idx % len(scale)]
            # 스트레스 높으면 반음 어긋남 추가 (불협화음)
            if eeg.stress_index > 0.6 and random.random() < 0.3:
                note += random.choice([-1, 1])
            notes.append(note)
            current_idx += direction
        
        return {
            "notes": notes,
            "tempo": self.tempo_bpm,
            "scale": "장조" if self.current_scale == MAJOR_SCALE else "단조",
        }

generator = EmotionMusicGenerator()

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    bpm = data.ppg_analysis.bpm if data.ppg_analysis else None
    result = generator.update_from_brain(data.eeg_analysis, bpm)
    
    note_names = ["C", "C#", "D", "D#", "E", "F", 
                  "F#", "G", "G#", "A", "A#", "B"]
    melody = [note_names[n % 12] for n in result["notes"]]
    
    print(f"[음악] {result['scale']} | 템포: {result['tempo']} BPM | "
          f"멜로디: {' '.join(melody)}")
    # 실제 MIDI 출력: mido, pygame.midi, 또는 fluidsynth 활용
```

---

## 3. 데이터 활용 팁

### 3.1 노이즈 필터링 (Noise Filtering)

BCI 센서 데이터는 근육 움직임, 전자기 간섭 등으로 노이즈가 많습니다. 안정적인 프로젝트를 위해 반드시 필터링이 필요합니다.

#### signalQuality 확인

```python
def on_sensor_data(data: SensorData):
    # 신호 품질이 나쁘면 데이터를 무시
    if data.eeg_raw and data.eeg_raw.signal_quality > 50:
        print("신호 불량 - 전극 위치를 확인하세요")
        return  # 이 데이터는 사용하지 않음
    
    # 신호가 좋을 때만 처리
    process_data(data)
```

#### 이동 평균 (Moving Average)

```python
from collections import deque

# 최근 N개 값의 평균을 사용 (튀는 값 완화)
attention_buffer = deque(maxlen=10)

def get_smooth_attention(raw_attention):
    attention_buffer.append(raw_attention)
    return sum(attention_buffer) / len(attention_buffer)
```

#### 지수 이동 평균 (Exponential Moving Average)

```python
# 더 반응적인 스무딩 - 최근 값에 더 큰 가중치
smooth_value = 0.0
ALPHA = 0.3  # 0에 가까울수록 부드럽고, 1에 가까울수록 민감

def exponential_smooth(new_value):
    global smooth_value
    smooth_value = ALPHA * new_value + (1 - ALPHA) * smooth_value
    return smooth_value
```

### 3.2 복합 지표 활용 (Combining Multiple Metrics)

단일 값보다 여러 값을 조합하면 더 정확한 판단이 가능합니다.

#### 가중 평균으로 종합 점수 만들기

```python
def calculate_engagement_score(eeg):
    """몰입도 종합 점수 계산"""
    score = (
        eeg.attention * 0.4 +          # 집중도 (40%)
        eeg.focus_index * 0.2 +        # 포커스 (20%)
        (1 - eeg.stress_index) * 0.2 + # 스트레스 낮음 (20%)
        eeg.cognitive_load * 0.2       # 적절한 인지부하 (20%)
    )
    return score
```

#### 상태 분류기 만들기

```python
def classify_state(eeg, bpm=None):
    """현재 정신 상태를 분류"""
    if eeg.attention > 0.7 and eeg.stress_index < 0.3:
        return "몰입 (Flow)"
    elif eeg.stress_index > 0.7:
        return "긴장 (Stressed)"
    elif eeg.relaxation_index > 0.7 and eeg.attention < 0.3:
        return "졸림 (Drowsy)"
    elif eeg.relaxation_index > 0.6 and eeg.meditation_level > 0.5:
        return "명상 (Meditative)"
    elif eeg.cognitive_load > 0.7:
        return "과부하 (Overloaded)"
    else:
        return "보통 (Normal)"
```

### 3.3 결측 데이터 처리 (Handling Missing Data)

PPG 센서나 가속도 센서는 항상 사용 가능하지 않을 수 있습니다. 안전하게 처리하는 방법을 익혀두세요.

```python
def on_sensor_data(data: SensorData):
    # 항상 None 체크를 먼저!
    if data.eeg_analysis is None:
        return  # EEG 없으면 아무것도 못함
    
    eeg = data.eeg_analysis
    
    # PPG는 선택적으로 사용
    bpm = None
    if data.ppg_analysis is not None:
        bpm = data.ppg_analysis.bpm
    
    # bpm이 없어도 동작하도록 설계
    if bpm is not None:
        print(f"심박수: {bpm:.0f} BPM")
    else:
        print("심박수: 측정 불가 (PPG 센서 미연결)")
    
    # 기본값(fallback)을 사용하는 방법
    bpm_for_calc = bpm if bpm is not None else 75  # 평균 심박수를 기본값으로
```

### 3.4 개인차 캘리브레이션 (Individual Calibration)

뇌파 신호는 사람마다 크게 다릅니다. 고정된 임계값 대신 개인별 기준선(baseline)을 측정하면 정확도가 크게 향상됩니다.

```python
from collections import deque

class PersonalCalibrator:
    """사용 전 30초간 편안히 앉아서 기준값 측정"""
    
    def __init__(self, calibration_seconds=30):
        self.calibration_time = calibration_seconds
        self.samples = []
        self.baseline = None  # 캘리브레이션 완료 후 설정됨
        self.is_calibrated = False
    
    def add_sample(self, eeg):
        """캘리브레이션 중 데이터 수집"""
        self.samples.append({
            "attention": eeg.attention,
            "stress": eeg.stress_index,
            "relaxation": eeg.relaxation_index,
        })
        
        # 충분한 샘플이 모이면 기준값 계산
        if len(self.samples) >= self.calibration_time * 4:  # 초당 약 4회
            self.baseline = {
                key: sum(s[key] for s in self.samples) / len(self.samples)
                for key in self.samples[0].keys()
            }
            self.is_calibrated = True
            print(f"캘리브레이션 완료! 기준값: {self.baseline}")
    
    def get_relative_value(self, metric_name, current_value):
        """기준값 대비 현재 값 반환 (기준값 = 0)"""
        if not self.is_calibrated:
            return current_value  # 캘리브레이션 전에는 원시값 그대로
        return current_value - self.baseline.get(metric_name, 0)

calibrator = PersonalCalibrator(calibration_seconds=30)

def on_sensor_data(data: SensorData):
    if data.eeg_analysis is None:
        return
    
    eeg = data.eeg_analysis
    
    if not calibrator.is_calibrated:
        calibrator.add_sample(eeg)
        remaining = calibrator.calibration_time - len(calibrator.samples) // 4
        print(f"캘리브레이션 중... 편안히 앉아 계세요 ({remaining}초 남음)")
        return
    
    # 캘리브레이션 완료 후: 기준값 대비 상대적 변화 사용
    relative_attention = calibrator.get_relative_value("attention", eeg.attention)
    
    # 기준값보다 0.2 이상 높아지면 "집중"으로 판단
    if relative_attention > 0.2:
        print(f"집중 중! (기준 대비 +{relative_attention:.2f})")
    else:
        print(f"보통 상태 (기준 대비 {relative_attention:+.2f})")
```

### 3.5 디버깅 팁

프로젝트를 개발할 때 유용한 디버깅 방법입니다.

```python
import time

# 1. 모든 센서 값을 한눈에 보기
def debug_print(data: SensorData):
    """현재 모든 센서 값을 보기 좋게 출력"""
    print(f"\n{'='*50}")
    print(f"시각: {time.strftime('%H:%M:%S')}")
    
    if data.eeg_analysis:
        eeg = data.eeg_analysis
        print(f"  집중: {eeg.attention:.2f} | 포커스: {eeg.focus_index:.2f}")
        print(f"  이완: {eeg.relaxation_index:.2f} | 명상: {eeg.meditation_level:.2f}")
        print(f"  스트레스: {eeg.stress_index:.2f} | 인지부하: {eeg.cognitive_load:.2f}")
        print(f"  감정균형: {eeg.emotional_balance:.2f} | 총파워: {eeg.total_power:.1f}")
    
    if data.ppg_analysis:
        ppg = data.ppg_analysis
        spo2 = f"{ppg.spo2:.1f}%" if ppg.spo2 else "N/A"
        print(f"  심박: {ppg.bpm:.0f} BPM | SpO2: {spo2}")
    
    if data.eeg_raw:
        raw = data.eeg_raw
        print(f"  신호품질: {raw.signal_quality} | 샘플수: {raw.sample_count}")

# 2. CSV 파일로 데이터 저장 (나중에 분석용)
def save_to_csv(data: SensorData, filename="sensor_log.csv"):
    """센서 데이터를 CSV 파일에 한 줄씩 추가"""
    import csv, os
    
    file_exists = os.path.exists(filename)
    with open(filename, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow([
                "timestamp", "attention", "stress", "relaxation",
                "cognitive_load", "bpm"
            ])
        
        eeg = data.eeg_analysis
        bpm = data.ppg_analysis.bpm if data.ppg_analysis else ""
        if eeg:
            writer.writerow([
                time.time(), eeg.attention, eeg.stress_index,
                eeg.relaxation_index, eeg.cognitive_load, bpm
            ])
```

---

## 부록: 프로젝트 난이도별 요약

| # | 프로젝트 이름 | 난이도 | 핵심 센서 | 주요 학습 내용 |
|---|-------------|--------|----------|--------------|
| 1 | 마인드 스위치 | 초급 | attention | 임계값 제어, 조건문 |
| 2 | 하트비트 DJ | 초급 | bpm | 값 매핑, 외부 라이브러리 |
| 3 | 졸음 감지 알람 | 초급 | attention + relaxation | 복수 조건, 타이머 |
| 4 | 뇌파 미로 탈출 로봇 | 중급 | attention + balance + stress | 상태 기계, 안전 장치 |
| 5 | 스트레스 힐링 램프 | 중급 | stress + relaxation + bpm | RGB 색상, 보간, biofeedback |
| 6 | 집중력 트레이너 | 중급 | attention + focus + cognitive_load | 시계열, 게이미피케이션 |
| 7 | 뇌파 패턴 분류기 | 고급 | eeg_analysis + eeg_raw 전체 | ML 분류, feature engineering |
| 8 | BCI 게임 컨트롤러 | 고급 | eeg_analysis + bpm + 가속도 | 복합 입력, 적응형 난이도 |
| 9 | 학습 효율 대시보드 | 고급 | eeg_analysis + ppg 전체 | 통계 분석, 웹 시각화, Flow |
| 10 | 감정 반응 음악 생성기 | 고급 | balance + stress + relaxation + bpm | MIDI, 음악 이론, 생성 시스템 |

---

> **시작이 반이다!** 초급 프로젝트부터 하나씩 도전해보세요.
> 작은 성공 경험이 쌓이면, 어느새 뇌파로 세상을 제어하는 자신을 발견하게 될 것입니다.
>
> 질문이나 아이디어가 있으면 언제든 공유해주세요!

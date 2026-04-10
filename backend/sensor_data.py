"""
센서 데이터 타입 정의 (Sensor Data Type Definitions)

EEG(뇌파), PPG(맥박) 센서에서 수집되는 데이터의 구조를 정의합니다.
학생들이 센서 데이터를 쉽게 이해하고 사용할 수 있도록 만든 파일입니다.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class EegRaw:
    """
    EEG 원시 데이터 (Raw EEG Data)

    뇌파 센서에서 직접 측정된 전기 신호입니다.
    fp1, fp2는 이마 왼쪽/오른쪽 전극의 측정값입니다.
    """

    fp1: List[float] = field(default_factory=list)
    """이마 왼쪽 전극 값 (Left forehead electrode values)"""

    fp2: List[float] = field(default_factory=list)
    """이마 오른쪽 전극 값 (Right forehead electrode values)"""

    signal_quality: int = 0
    """신호 품질 (Signal quality) - 0이 가장 좋음"""

    sample_count: int = 0
    """샘플 개수 (Number of samples in this batch)"""


@dataclass
class EegAnalysis:
    """
    EEG 분석 결과 (EEG Analysis Results)

    뇌파 원시 데이터를 분석하여 계산된 지표들입니다.
    모든 값은 0.0 ~ 1.0 사이입니다 (total_power 제외).
    """

    attention: float = 0.0
    """집중도 (Attention level) - 높을수록 집중하고 있음"""

    focus_index: float = 0.0
    """포커스 지수 (Focus index) - 주의 집중 정도"""

    relaxation_index: float = 0.0
    """이완 지수 (Relaxation index) - 높을수록 편안한 상태"""

    stress_index: float = 0.0
    """스트레스 지수 (Stress index) - 높을수록 스트레스 상태"""

    cognitive_load: float = 0.0
    """인지 부하 (Cognitive load) - 높을수록 뇌가 바쁨"""

    emotional_balance: float = 0.0
    """감정 균형 (Emotional balance) - 0.5가 균형 상태"""

    meditation_level: float = 0.0
    """명상 수준 (Meditation level) - 높을수록 명상 상태"""

    total_power: float = 0.0
    """전체 뇌파 파워 (Total brainwave power)"""


@dataclass
class PpgAnalysis:
    """
    PPG 분석 결과 (PPG Analysis Results)

    광용적맥파 센서로 측정한 심박수와 산소포화도입니다.
    """

    bpm: float = 0.0
    """심박수 (Heart rate in beats per minute)"""

    spo2: Optional[float] = None
    """산소포화도 (Blood oxygen saturation, %) - 없을 수 있음"""


@dataclass
class SensorData:
    """
    통합 센서 데이터 (Combined Sensor Data)

    서버에서 받는 모든 센서 데이터를 하나로 묶은 것입니다.
    eeg_raw, eeg_analysis, ppg_analysis 중 일부만 있을 수 있습니다.
    """

    timestamp: int = 0
    """데이터 수집 시각 (Unix timestamp in milliseconds)"""

    device_id: str = ""
    """센서 장치 ID (Sensor device identifier)"""

    eeg_raw: Optional[EegRaw] = None
    """EEG 원시 데이터 (Raw EEG data, may be None)"""

    eeg_analysis: Optional[EegAnalysis] = None
    """EEG 분석 결과 (EEG analysis results, may be None)"""

    ppg_analysis: Optional[PpgAnalysis] = None
    """PPG 분석 결과 (PPG analysis results, may be None)"""


def from_dict(data: dict) -> SensorData:
    """
    딕셔너리(dict)를 SensorData 객체로 변환합니다.
    서버에서 받은 JSON 데이터를 파이썬 객체로 바꿀 때 사용합니다.

    Convert a dictionary (from JSON) into a SensorData object.
    """
    sensor = SensorData(
        timestamp=data.get("timestamp", 0),
        device_id=data.get("deviceId", ""),
    )

    eeg_raw = data.get("eegRaw")
    if eeg_raw:
        sensor.eeg_raw = EegRaw(
            fp1=eeg_raw.get("fp1", []),
            fp2=eeg_raw.get("fp2", []),
            signal_quality=eeg_raw.get("signalQuality", 0),
            sample_count=eeg_raw.get("sampleCount", 0),
        )

    eeg_analysis = data.get("eegAnalysis")
    if eeg_analysis:
        sensor.eeg_analysis = EegAnalysis(
            attention=eeg_analysis.get("attention", 0),
            focus_index=eeg_analysis.get("focusIndex", 0),
            relaxation_index=eeg_analysis.get("relaxationIndex", 0),
            stress_index=eeg_analysis.get("stressIndex", 0),
            cognitive_load=eeg_analysis.get("cognitiveLoad", 0),
            emotional_balance=eeg_analysis.get("emotionalBalance", 0),
            meditation_level=eeg_analysis.get("meditationLevel", 0),
            total_power=eeg_analysis.get("totalPower", 0),
        )

    ppg_analysis = data.get("ppgAnalysis")
    if ppg_analysis:
        sensor.ppg_analysis = PpgAnalysis(
            bpm=ppg_analysis.get("bpm", 0),
            spo2=ppg_analysis.get("spo2"),
        )

    return sensor

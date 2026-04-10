"""
예제 컨트롤러 (Example Controller)

이 파일은 robot_controller.py를 어떻게 작성하면 되는지 보여주는 예제입니다.
직접 실행할 수도 있고, 참고만 해도 됩니다.

사용법:
    python3 example_controller.py
"""

import json
import time

from sensor_data import SensorData, from_dict

SERVER_URL = "ws://localhost:8000/ws"


# ── 로봇 제어 함수 (robot_controller.py와 동일) ──

def move_forward():
    print("[로봇] >>> 앞으로 이동!")


def move_backward():
    print("[로봇] <<< 뒤로 이동!")


def turn_left():
    print("[로봇] <== 왼쪽 회전!")


def turn_right():
    print("[로봇] ==> 오른쪽 회전!")


def stop():
    print("[로봇] [■] 정지!")


def slow_down():
    """속도 줄이기 (Slow down) — 예제 전용 함수"""
    print("[로봇] ... 속도 줄이기!")


# ── 예제: 센서 데이터에 따라 로봇 제어 ──

def on_sensor_data(data: SensorData):
    """
    예제 로직:
    1. 집중도(attention) > 0.7 이면 → 앞으로 이동
    2. 스트레스(stress) > 0.5 이면 → 정지
    3. 이완도(relaxation) > 0.6 이면 → 속도 줄이기
    4. 심박수(bpm)도 화면에 출력
    """

    # EEG 분석 데이터가 있을 때
    if data.eeg_analysis:
        eeg = data.eeg_analysis

        # 현재 상태를 화면에 출력
        print(f"[뇌파] 집중: {eeg.attention:.2f} | "
              f"스트레스: {eeg.stress_index:.2f} | "
              f"이완: {eeg.relaxation_index:.2f}")

        # 스트레스가 높으면 일단 정지! (안전 우선)
        if eeg.stress_index > 0.5:
            stop()

        # 집중도가 높으면 앞으로 이동
        elif eeg.attention > 0.7:
            move_forward()

        # 이완도가 높으면 속도 줄이기
        elif eeg.relaxation_index > 0.6:
            slow_down()

    # PPG 분석 데이터가 있을 때
    if data.ppg_analysis:
        ppg = data.ppg_analysis
        spo2_text = f" | SpO2: {ppg.spo2:.1f}%" if ppg.spo2 else ""
        print(f"[심박] BPM: {ppg.bpm:.0f}{spo2_text}")


# ── 서버 연결 (robot_controller.py와 동일한 구조) ──

def connect_and_run():
    try:
        import websocket
    except ImportError:
        print("오류: websocket-client 패키지가 필요합니다.")
        print("설치: pip install websocket-client")
        return

    print(f"[예제 컨트롤러] 서버에 연결 중... ({SERVER_URL})")

    def on_message(ws, message):
        data_dict = json.loads(message)
        if data_dict.get("type") == "sensor":
            sensor_data = from_dict(data_dict)
            on_sensor_data(sensor_data)

    def on_open(ws):
        print("[예제 컨트롤러] 서버 연결 성공!")

    def on_error(ws, error):
        print(f"[예제 컨트롤러] 연결 오류: {error}")

    def on_close(ws, close_status, close_msg):
        print("[예제 컨트롤러] 서버 연결이 끊어졌습니다.")

    while True:
        try:
            ws = websocket.WebSocketApp(
                SERVER_URL,
                on_message=on_message,
                on_open=on_open,
                on_error=on_error,
                on_close=on_close,
            )
            ws.run_forever()
        except KeyboardInterrupt:
            print("\n프로그램을 종료합니다.")
            break
        except Exception as e:
            print(f"연결 실패: {e} — 3초 후 재시도...")
            time.sleep(3)


if __name__ == "__main__":
    connect_and_run()

"""
로봇 컨트롤러 — 학생 엔트리 포인트 (Robot Controller — Student Entry Point)

이 파일에서 센서 데이터를 받아 로봇을 제어하는 코드를 작성합니다.
아래 on_sensor_data() 함수 안에 여러분의 코드를 작성하세요!

사용법:
    python3 robot_controller.py
"""

import json
import time

from sensor_data import SensorData, from_dict

# ── 서버 주소 설정 ──
# 서버가 같은 컴퓨터에서 돌고 있으면 이대로 두세요
SERVER_URL = "ws://localhost:8000/ws"


# ============================================================
# 로봇 제어 함수들 (Robot Control Functions)
# 지금은 화면에 출력만 합니다. 나중에 실제 하드웨어 코드로 바꿀 거예요.
# ============================================================

def move_forward():
    """앞으로 이동 (Move forward)"""
    print("[로봇] >>> 앞으로 이동!")


def move_backward():
    """뒤로 이동 (Move backward)"""
    print("[로봇] <<< 뒤로 이동!")


def turn_left():
    """왼쪽으로 회전 (Turn left)"""
    print("[로봇] <== 왼쪽 회전!")


def turn_right():
    """오른쪽으로 회전 (Turn right)"""
    print("[로봇] ==> 오른쪽 회전!")


def stop():
    """정지 (Stop)"""
    print("[로봇] [■] 정지!")


# ============================================================
# ★★★ 여기에 코드를 작성하세요! (Write your code here!) ★★★
# ============================================================

def on_sensor_data(data: SensorData):
    """
    센서 데이터가 올 때마다 이 함수가 호출됩니다.
    This function is called every time new sensor data arrives.

    사용 가능한 데이터:
        data.eeg_analysis.attention      - 집중도 (0.0 ~ 1.0)
        data.eeg_analysis.stress_index   - 스트레스 (0.0 ~ 1.0)
        data.eeg_analysis.relaxation_index - 이완도 (0.0 ~ 1.0)
        data.ppg_analysis.bpm            - 심박수
        (자세한 내용은 sensor_data.py를 참고하세요)

    사용 가능한 로봇 명령:
        move_forward()   - 앞으로
        move_backward()  - 뒤로
        turn_left()      - 왼쪽
        turn_right()     - 오른쪽
        stop()           - 정지

    예시:
        if data.eeg_analysis and data.eeg_analysis.attention > 0.7:
            move_forward()
    """

    # ▼▼▼ 아래에 여러분의 코드를 작성하세요 ▼▼▼
    # (Write your code below this line)

    pass  # ← 이 줄을 지우고 코드를 작성하세요!

    # ▲▲▲ 위에 여러분의 코드를 작성하세요 ▲▲▲


# ============================================================
# 서버 연결 코드 (아래는 수정하지 않아도 됩니다)
# ============================================================

def connect_and_run():
    """WebSocket 서버에 연결해서 센서 데이터를 받기 시작합니다."""
    try:
        import websocket
    except ImportError:
        print("오류: websocket-client 패키지가 필요합니다.")
        print("설치: pip install websocket-client")
        return

    print(f"서버에 연결 중... ({SERVER_URL})")

    def on_message(ws, message):
        data_dict = json.loads(message)
        # "sensor" 타입 메시지만 처리
        if data_dict.get("type") == "sensor":
            sensor_data = from_dict(data_dict)
            on_sensor_data(sensor_data)

    def on_open(ws):
        print("서버 연결 성공! 센서 데이터를 기다리는 중...")

    def on_error(ws, error):
        print(f"연결 오류: {error}")

    def on_close(ws, close_status, close_msg):
        print("서버 연결이 끊어졌습니다.")

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

"""
센서 데이터 수집 서버 (Sensor Data Collection Server)

- SSE API에서 데이터 수집 + 파싱
- WebSocket으로 React 프론트엔드에 전달
- REST API로 최신 센서 데이터 조회 가능 (GET /api/latest)
- 나중에 하드웨어 직결 시 collector만 교체하면 됨

이 파일은 학생이 수정할 필요 없습니다.
"""

import asyncio
import json
import importlib
from contextlib import asynccontextmanager
from typing import Optional, Set

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from sensor_data import SensorData, from_dict as sensor_from_dict

# ── 설정 ──
SSE_URL = "https://broadcast-server-506664317461.us-central1.run.app/subscribe"
DEVICE_ID = "YQqqfXyPphgeUZ8BqSYDww=="

# ── 상태 ──
connected_clients: Set[WebSocket] = set()
latest_data = {
    "eegRaw": None,
    "eegAnalysis": None,
    "ppgAnalysis": None,
    "connected": False,
}


# ── SSE 수집기 (나중에 하드웨어 수집기로 교체) ──
async def sse_collector():
    """SSE 스트림에서 데이터를 수집하고 파싱하여 WebSocket 클라이언트에 브로드캐스트"""
    while True:
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "GET", SSE_URL, params={"deviceId": DEVICE_ID}
                ) as response:
                    latest_data["connected"] = True
                    await broadcast({"type": "status", "connected": True})
                    print(f"✅ SSE 연결됨 (device: {DEVICE_ID})")

                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line or not line.startswith("data: "):
                                continue

                            raw = json.loads(line[6:])

                            # 연결 확인 메시지 스킵
                            if raw.get("type") == "connected":
                                continue

                            parsed = parse_sensor_data(raw)
                            if parsed:
                                await broadcast(parsed)

        except Exception as e:
            print(f"❌ SSE 연결 끊김: {e}")
            latest_data["connected"] = False
            await broadcast({"type": "status", "connected": False})
            await asyncio.sleep(3)


def parse_sensor_data(raw: dict) -> Optional[dict]:
    """센서 원시 데이터를 프론트엔드용으로 파싱"""
    payload = raw.get("payload")
    if not payload:
        return None

    result = {
        "type": "sensor",
        "timestamp": raw.get("timestamp"),
        "deviceId": raw.get("deviceId"),
    }

    # EEG Raw → fp1, fp2 배열로 변환
    if "eegRaw" in payload:
        samples = payload["eegRaw"]
        result["eegRaw"] = {
            "fp1": [s["fp1"] for s in samples],
            "fp2": [s["fp2"] for s in samples],
            "signalQuality": samples[0].get("signalQuality", 0) if samples else 0,
            "sampleCount": len(samples),
        }
        latest_data["eegRaw"] = result["eegRaw"]

    # EEG Analysis → 주요 지표만 추출
    if "eegAnalysis" in payload:
        analysis = payload["eegAnalysis"]
        result["eegAnalysis"] = {
            "attention": analysis.get("attention", 0),
            "focusIndex": analysis.get("focusIndex", 0),
            "relaxationIndex": analysis.get("relaxationIndex", 0),
            "stressIndex": analysis.get("stressIndex", 0),
            "cognitiveLoad": analysis.get("cognitiveLoad", 0),
            "emotionalBalance": analysis.get("emotionalBalance", 0),
            "meditationLevel": analysis.get("meditationLevel", 0),
            "totalPower": analysis.get("totalPower", 0),
        }
        latest_data["eegAnalysis"] = result["eegAnalysis"]

    # PPG Analysis → BPM 추출
    if "ppgAnalysis" in payload:
        ppg = payload["ppgAnalysis"]
        result["ppgAnalysis"] = {
            "bpm": ppg.get("bpm", 0),
            "spo2": ppg.get("spo2"),
        }
        latest_data["ppgAnalysis"] = result["ppgAnalysis"]

    # robot_controller 콜백 호출 (선택적)
    _notify_robot_controller(result)

    return result


def _notify_robot_controller(parsed: Optional[dict]):
    """robot_controller의 on_sensor_data 콜백을 호출합니다 (로드 실패 시 무시)."""
    if parsed is None:
        return
    try:
        mod = importlib.import_module("robot_controller")
        callback = getattr(mod, "on_sensor_data", None)
        if callback:
            sensor_data = sensor_from_dict(parsed)
            callback(sensor_data)
    except Exception:
        # robot_controller가 없거나 에러가 나도 서버는 계속 동작
        pass


async def broadcast(data: dict):
    """연결된 모든 WebSocket 클라이언트에 데이터 전송"""
    if not connected_clients:
        return
    message = json.dumps(data)
    disconnected = []
    for ws in connected_clients:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        connected_clients.discard(ws)


# ── FastAPI 앱 ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(sse_collector())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.add(ws)
    print(f"🔌 클라이언트 연결 ({len(connected_clients)}명)")

    # 최신 데이터 즉시 전송
    await ws.send_text(json.dumps({
        "type": "snapshot",
        "connected": latest_data["connected"],
        "eegAnalysis": latest_data["eegAnalysis"],
        "ppgAnalysis": latest_data["ppgAnalysis"],
    }))

    try:
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        connected_clients.discard(ws)
        print(f"🔌 클라이언트 해제 ({len(connected_clients)}명)")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "sseConnected": latest_data["connected"],
        "clients": len(connected_clients),
    }


@app.get("/api/latest")
async def api_latest():
    """
    최신 센서 데이터를 JSON으로 반환합니다.
    WebSocket 대신 단순 HTTP 요청으로 데이터를 가져올 때 사용합니다.

    Returns the latest sensor data as JSON.
    Use this if you prefer polling over WebSocket.
    """
    return {
        "connected": latest_data["connected"],
        "eegRaw": latest_data["eegRaw"],
        "eegAnalysis": latest_data["eegAnalysis"],
        "ppgAnalysis": latest_data["ppgAnalysis"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

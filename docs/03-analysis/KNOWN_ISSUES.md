# Known Issues — Audit @ checkpoint-pacing-v1

세 개의 분석 에이전트(code-analyzer, Explore, general-purpose)가 병렬로 진행한 정밀 감사 결과.

수집 시점: `checkpoint-pacing-v1` 태그 직전. Frame-paced sample drainer + 증분 SQI + appendCap + linkband band power 매칭이 적용된 상태.

---

## 🚨 Critical: 데이터 영구 정지 가능 케이스 (사용자 보고: "데이터가 끊기지 않아야" 위반)

### C1. Priming Lock — 14샘플 버스트로 영구 freeze
**`src/hooks/useSSEConnection.ts:115-119`**

```ts
if (!state.primed) {
  if (queue.length < target * PREBUFFER_RATIO) return []
  state.primed = true
  state.acc = 0
}
```

- `PPG_TARGET_BUF=75` × `PREBUFFER_RATIO=0.2` = **15 샘플** 필요
- 디바이스가 14 샘플 패킷 + 200ms 이상 갭 → primed 영원히 false
- `IDLE_RESYNC`는 `acc`만 리셋하고 `primed`는 안 건드림
- **재현 가능, reconnect만이 회복 수단**

**Fix 방향**: IDLE_RESYNC 시 `state.primed`도 리셋하거나, 빈 큐가 N프레임 지속되면 prime 강제 해제.

---

### C2. JSON.parse 손상 패킷이 onmessage 핸들러 살해
**`src/hooks/useSSEConnection.ts:336`**

```ts
es.onmessage = (event) => {
  const data: SSEMessage = JSON.parse(event.data)  // try/catch 없음
  ...
}
```

- 네트워크가 패킷 중간에 자르면 SyntaxError throw
- 핸들러 사망. EventSource는 자동 reconnect 안 함 (브라우저별 다름).
- **"Connected" 표시 그대로지만 데이터 안 옴 — 사용자가 알 길 없음**

**Fix 방향**: `try { ... } catch (e) { console.warn('malformed SSE', e) }` 래핑.

---

### C3. Frame loop이 throw하면 영구 정지
**`src/hooks/useSSEConnection.ts:222`**

```ts
function frameLoop(now: number) {
  // ... 본체 ...
  rafId = requestAnimationFrame(frameLoop)  // 끝에서 재예약
}
```

- 본체 어디든 throw → 마지막 줄의 재예약 못 함
- `rafId`는 **이전 프레임 ID 그대로** → `ensureFrameLoop()`가 `rafId !== null` 체크에 걸려 재시작 안 함
- **차트 침묵 freeze**

**Fix 방향**: `try/finally`로 래핑, finally에서 `rafId = null` 후 재예약.

---

### C4. SQI 함수 OOB read → NaN 오염
**`src/lib/sensors/eegAdapter.ts:30-43`, `src/lib/sensors/ppgAdapter.ts:47-65`**

증분 SQI 함수 `appendEegSqiIncremental` / `appendSqiIncremental`이 버퍼 < window 크기일 때 `filteredVals[j]` 접근 → undefined → NaN.

- EEG: 첫 ~0.5초 (125 샘플 미만)에 NaN
- PPG: 첫 ~0.5초 (25 샘플 미만)에 NaN
- NaN이 mean/var/sum 전파 → SQI 값 NaN
- 이후 차트/평균 지표에 NaN 잔존

**Fix 방향**: 함수 진입부에 `if (filteredVals.length < WINDOW) return prevSqi` 가드.

---

### C5. EventSource CONNECTING 상태 무시
**`src/hooks/useSSEConnection.ts:346-351`**

```ts
es.onerror = () => {
  if (es.readyState === EventSource.CLOSED) {
    setConnected(false)
    setError('Connection lost. ...')
  }
  // CONNECTING 시 아무것도 안 함
}
```

- 서버가 응답만 받고 침묵 → CONNECTING 상태에서 무한 대기
- 사용자에게 알림 없음 (connected = true 표시 유지)

**Fix 방향**: 일정 시간 내 데이터 없으면 timeout 처리, CONNECTING 도 사용자에게 표시.

---

## 🐛 Critical: 데이터 정확성 침해

### C6. BandPower 정규화 — dB를 선형 비율로 처리
**`src/components/eeg/BandPowerCards.tsx:60-67`**

`computeEegPower`가 반환하는 ch1Db/ch2Db는 **dB 값(음수일 수 있음)**.

```ts
const maxPower = Math.max(...results.map((r) => Math.max(r.ch1, r.ch2)), 1)
return results.map((r) => ({
  normalizedCh1: (r.ch1 / maxPower) * 100,  // ← dB / dB는 무의미
  ...
}))
```

- max가 1로 floor되면 모든 normalized 값이 음수 또는 무의미
- 막대 높이 `style={{ height: 'NN%' }}`가 깨짐

**Fix 방향**: linear power로 정규화하거나 (ch1Linear/ch2Linear 사용), dB 값에 일정 오프셋 추가 후 0-1 범위로 매핑.

---

### C7. PPG LeadOff 배너가 EEG 데이터 표시
**`src/components/ppg/PPGLeadOffBanner.tsx:1-11`**

`PPGLeadOffBanner`가 `LeadOffBanner` (EEG 컴포넌트)를 그대로 래핑.
`LeadOffBanner`는 `useEegStore`의 `rawLeadOff` / `analysis.ch*LeadOff` 구독.

- PPG 영역에서 EEG 전극 상태가 표시됨
- "FP1 off" 배너가 PPG 섹션에 뜨는 식

**Fix 방향**: PPG 전용 LeadOff 데이터 경로 만들거나 (PPG도 leadOff 정보 있음 — `ppgRaw[i].leadOff`), 배너를 PPG 도메인에서 분리.

---

## 🔧 Medium: 운영/Lifecycle

### M1. Held PPG 샘플이 SQI window 왜곡
**`src/hooks/useSSEConnection.ts:153-160`**

Hold-last-sample은 최대 800ms 동안 동일 샘플을 복제해 PPG 스토어로 들어감 → SQI window(25샘플) 분산이 0 → 침묵인데 **SQI 100% 표시**.

**Fix 방향**: 합성 샘플에 플래그 달아 SQI 계산 시 제외, 또는 SQI 계산을 해당 구간 동안 동결.

---

### M2. HMR dispose가 sensor store는 안 비움
**`src/hooks/useSSEConnection.ts:262-273`**

dispose 시 connectionStore + rafId만 정리. EEG/PPG/ACC 스토어는 옛 데이터 잔존.
사용자가 reconnect 안 하면 stale 데이터 차트 표시 + connected=false.

**Fix 방향**: dispose에서 `resetAllSlices()` 호출.

---

### M3. BandPower/PowerSpectrum rAF 루프가 disconnect 후에도 계속 돔
**`src/components/eeg/PowerSpectrumChart.tsx:36-71`, `src/components/eeg/BandPowerCards.tsx:39-78`**

자체 rAF 루프가 `connected` 상태 무관하게 매 프레임 store 폴링 + EMA + Morlet/DFT 계산.

- 디스커넥트 후에도 CPU 낭비
- PowerSpectrumChart는 EMA가 마지막 freeze된 spectrum으로 계속 수렴

**Fix 방향**: `useConnectionStore.getState().connected` 체크 후 tick 빠져나가기.

---

### M4. BaseChart `option` prop이 mount 시 한 번만 적용
**`src/lib/charts/BaseChart.tsx:19-32`**

`useEffect([], () => chart.setOption(option))` — 부모가 option 객체 바꿔도 적용 안 됨.
지금은 모든 사용처가 useMemo로 stable한 option 만들어 운 좋게 안 터짐. 향후 동적 option 시 silently fail.

**Fix 방향**: option을 effect deps에 추가하거나, 명시적으로 `notMerge: true`로 매번 setOption.

---

### M5. connectionStore.setConnected가 error 필드 클로버
**`src/stores/connectionStore.ts:24`**

```ts
set({ connected, error: connected ? null : undefined })
```

- `error` 타입은 `string | null`인데 `undefined` 강제 → 타입 위반
- 직전에 setError로 설정한 메시지가 setConnected(false)로 덮임

**Fix 방향**: `error: connected ? null : get().error` 또는 setConnected가 error를 안 건드림.

---

## 🐍 Backend (server.py)

### B1. signalQuality를 첫 샘플만 읽음
**`backend/server.py:97`**

```python
"signalQuality": samples[0].get("signalQuality", 0) if samples else 0,
```

- 패킷 내 다른 샘플의 SQI 손실
- robot_controller로 가는 SQI가 잘못/오래된 값

---

### B2. SSE task cancel 후 await 없음
**`backend/server.py:170-171`**

```python
task.cancel()
yield
```

- httpx AsyncClient의 streaming connection이 정리될 시간 없음
- `--reload` 개발 모드에서 connection leak 가능

---

### B3. HTTP 응답 받자마자 connected=true (404여도)
**`backend/server.py:46-49`**

httpx는 기본적으로 4xx/5xx에 raise 안 함. 404 응답 본문이 와도 `latest_data["connected"] = True`로 설정됨.

---

## 🛠 Build/Tooling

### T1. ESLint가 TS 파일을 lint하지 않음
**`eslint.config.js:10`**

```js
files: ['**/*.{js,jsx}']
```

- 전체 src/는 TypeScript이므로 **ESLint 사실상 비활성**
- `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`, `no-unused-vars` 무력화
- 수많은 hook deps 버그가 lint에 안 잡힘

**Fix 방향**: `files: ['**/*.{js,jsx,ts,tsx}']`

---

### T2. tsconfig 단일, vite/client 타입 누락
**`tsconfig.json`**

`import.meta.hot` 타입이 없어서 `useSSEConnection.ts:262`에서 manual cast 사용. `import.meta.env` 등 다른 Vite 글로벌도 implicit any.

**Fix 방향**: `tsconfig.app.json` / `tsconfig.node.json` 분리, `vite/client` 타입 추가.

---

## 🕐 장시간 런타임 위험

### L1. sampleIndex 정밀도 손실
**`src/lib/sensors/{eeg,ppg,acc}Adapter.ts`**

EEG 250Hz로 24/7 운영 시 약 **8개월 후** `sampleIndex`가 `Number.MAX_SAFE_INTEGER` (2^53−1) 근접 → 정수 정밀도 손실 시작.

- 차트 x축 / 데이터 dedup 등에서 값 오차 발생 가능
- 즉시 freeze되진 않지만 데이터 corruption 위험

**Fix 방향**: 주기적으로 sampleIndex를 0으로 리셋, 또는 BigInt 사용.

---

## ✅ Safe (확인된 정상 부분)

- `appendCap` 모든 분기 수학적으로 정확
- `Math.floor(acc)` drain rate 평균 정확 (linkband 매칭 검증 PASS — `scripts/verify-bandpower.mjs` 0.0000 dB diff)
- HOLD_MAX_MS cap이 fake data 무한 흐름 방지
- biquad / Morlet 계산 0 오차

---

## 우선순위 제안

| 순서 | 항목 | 사유 |
|------|------|------|
| 1 | C1 (priming lock) | 영구 freeze, 재현 가능, 매우 빈도 높음 |
| 2 | C3 (frame loop throw) | 영구 freeze, 한 번 발생 시 회복 불가 |
| 3 | C2 (JSON crash) | 영구 freeze, 사용자 알림 없음 |
| 4 | C4 (NaN poisoning) | 데이터 corruption, 첫 0.5초마다 발생 |
| 5 | C6 (BandPower 정규화) | UI 깨짐, 매우 가시적 |
| 6 | C7 (PPG LeadOff) | 잘못된 정보 노출 |
| 7 | C5 (CONNECTING 무시) | 사용자 알림 부재 |
| 8 | T1 (ESLint TS) | 앞으로 더 많은 버그 자동 검출 |
| 9 | M1-M5 | 안정화 단계 |
| 10 | B1-B3, L1 | 백엔드/장기 |

---

분석 도구: `bkit:code-analyzer`, `Explore` (very thorough), `general-purpose` 에이전트 병렬 실행.
검증 도구: `scripts/verify-bandpower.mjs` (linkband 알고리즘 직접 복제 vs 우리 구현, 0.0000 dB 일치).

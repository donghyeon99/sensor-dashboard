# 발표 Q&A 가이드 — 예상 질문 & 모범 답변

> 발표 중 청중이 화면을 보며 *"이건 어디 코드에 어떻게 구현했어요?"* 라고 물을 때 답하기 위한 자료.
> 답변은 **공손체로 작성** (실제 발표 시 그대로 말할 수 있도록).
> 각 답변 끝에 📍 **해당 코드 위치**를 적어두었으니, 자신 없으면 그 파일을 펼쳐 보여주면 됨.

---

## 📋 카테고리

1. [화면 / UI 동작](#1-화면--ui-동작)
2. [데이터 수신 & 연결](#2-데이터-수신--연결)
3. [신호처리 (필터링)](#3-신호처리-필터링)
4. [신호 품질 (SQI)](#4-신호-품질-sqi)
5. [주파수 분석 & 분석 지표](#5-주파수-분석--분석-지표)
6. [차트 렌더링](#6-차트-렌더링)
7. [상태 관리 & 데이터 흐름](#7-상태-관리--데이터-흐름)
8. [센서별 차이 (EEG / PPG / ACC)](#8-센서별-차이)
9. [기술 선택 & 배포](#9-기술-선택--배포)
10. [협업 & 어려웠던 점](#10-협업--어려웠던-점)

---

## 1. 화면 / UI 동작

### Q1. "Connect" 버튼을 누르면 무슨 일이 일어나나요?

**A.** 우측 상단 Connect 버튼을 누르면 SSE URL을 입력할 수 있는 패널이 펼쳐집니다. URL을 입력하고 Connect를 누르면 브라우저가 그 주소로 SSE 연결을 시도하고, 성공하면 버튼이 빨간색 "Connect"에서 청록색 "Connected"로 바뀌면서 차트가 흐르기 시작합니다.
📍 `src/components/connect/ConnectPanel.tsx` — UI / `src/hooks/useSSEConnection.ts:connect()` — 실제 연결 로직

---

### Q2. 새로고침해도 마지막에 입력한 URL이 남아있던데 어떻게 한 건가요?

**A.** 브라우저의 `localStorage`에 마지막 URL을 저장합니다. 페이지가 다시 로드될 때 `localStorage.getItem('sensor-dashboard:last-sse-url')`로 꺼내서 입력창의 초깃값으로 넣습니다.
📍 `src/components/connect/ConnectPanel.tsx` — `STORAGE_KEY` 상수와 `useState` 초깃값

---

### Q3. EEG / PPG / ACC 탭은 어떻게 전환되나요?

**A.** Radix UI의 Tabs 컴포넌트를 사용하고, 현재 탭은 React `useState`로 관리합니다. 탭 값(`'eeg' | 'ppg' | 'acc'`)에 따라 해당 Visualizer 컴포넌트만 렌더링하는 구조입니다.
📍 `src/App.tsx` — `useState('eeg')`와 조건부 렌더링

---

### Q4. 헤더에 있는 버전 정보(`v0.2.0 · abc123`)는 어디서 가져오나요?

**A.** Vite 빌드 시점에 `package.json`의 버전과 git의 SHA(커밋 해시), 태그를 읽어서 `__APP_VERSION__` 같은 전역 상수로 주입합니다. 빌드할 때마다 자동으로 최신 정보가 박힙니다.
📍 `vite.config.ts` — `gitInfo()` 함수와 `define` 옵션 / `src/components/layout/Header.tsx` — 표시 부분

---

### Q5. 전극이 떨어졌을 때 빨간 배너가 뜨던데, 어떻게 감지하나요?

**A.** 서버에서 보내는 raw 샘플에 `leadOff: { ch1, ch2 }` 필드가 있습니다. 이 값이 `true`로 들어오면 분석 지표나 차트 위에 LeadOffBanner 컴포넌트가 자동으로 나타나서 "전극을 다시 부착하라"는 메시지를 보여줍니다.
📍 `src/components/eeg/LeadOffBanner.tsx`, `src/components/ppg/PPGLeadOffBanner.tsx`

---

### Q6. ACC 탭의 X축은 빨간색, Y축은 초록색, Z축은 파란색이던데 색은 어디서 정하나요?

**A.** 각 차트 컴포넌트 안에서 ECharts 옵션의 `color` 속성으로 지정합니다. 일관성을 위해 Tailwind CSS 변수(`--color-coral`, `--color-teal` 등)도 함께 사용합니다.
📍 `src/components/acc/AccRawChart.tsx` / `src/lib/charts/optionBuilders.ts`

---

## 2. 데이터 수신 & 연결

### Q7. 데이터는 어디서 어떻게 들어오나요?

**A.** 외부 GCP에 있는 Broadcast Server라는 SSE 서버에서 받습니다. 브라우저 내장 `EventSource` API로 그 주소를 한 번 구독해두면, 서버가 새 데이터를 만들 때마다 JSON 형태로 푸시해줍니다.
📍 `src/hooks/useSSEConnection.ts` — `new EventSource(sseUrl)` 부분

---

### Q8. 받은 데이터는 어디에 저장되나요?

**A.** Zustand라는 상태 관리 라이브러리로 만든 도메인별 저장소(eegStore / ppgStore / accStore / batteryStore)에 저장합니다. 각 저장소는 raw 버퍼, 필터링된 버퍼, 분석 지표, 신호 품질 등을 따로 관리합니다.
📍 `src/stores/slices/` 폴더 전체

---

### Q9. 데이터가 한참 안 오면 화면에 어떻게 표시되나요?

**A.** SSE 연결은 살아있는데 5초 이상 데이터가 없으면 워치독(watchdog)이 작동해서 *"No data for Xs. SSE may be stalled."* 라는 경고 메시지를 표시합니다. `setInterval`로 매초 체크합니다.
📍 `src/hooks/useSSEConnection.ts` — `STALL_MS = 5000`과 watchdog 부분

---

### Q10. 연결이 끊겼다가 다시 살아나면 차트는 어떻게 되나요?

**A.** EventSource는 자동 재연결을 시도합니다. 재연결 중엔 "Reconnecting to SSE…" 메시지가 뜨고, 재연결 성공 시 새 데이터부터 다시 그려집니다. 기존에 그려져있던 데이터는 버퍼에 남아있다가 시간이 지나면 자연스럽게 밀려나갑니다.
📍 `src/hooks/useSSEConnection.ts` — `es.onerror` 핸들러

---

## 3. 신호처리 (필터링)

### Q11. EEG 노이즈는 어떻게 제거하나요?

**A.** 세 단계 필터를 거칩니다. ① 60Hz 노치 필터로 콘센트 전력선 노이즈 제거, ② 1Hz 하이패스로 천천히 흐르는 기저선(DC 드리프트) 제거, ③ 45Hz 로우패스로 뇌파와 무관한 고주파 잡음 제거. 모두 Biquad라는 표준 디지털 필터로 구현했습니다.
📍 `src/lib/dsp/eegPipeline.ts:processEegSample()` — 3단 필터 체인

---

### Q12. 왜 하필 60Hz를 제거하나요?

**A.** 한국과 미국의 콘센트 전기가 60Hz 주파수로 진동하기 때문에, 모든 전자기기 주변에서 60Hz 노이즈가 미세하게 유입됩니다. 뇌파는 신호 자체가 매우 작아서(수 마이크로볼트 수준) 이 60Hz가 그대로 섞이면 신호를 가립니다. 그래서 노치 필터로 60Hz만 콕 집어서 제거합니다.

---

### Q13. Biquad 필터가 뭔가요?

**A.** 2차(second-order) 디지털 필터의 한 종류로, 같은 수식 틀에서 계수만 바꾸면 노치·하이패스·로우패스·밴드패스를 모두 만들 수 있는 표준 구조입니다. RBJ Audio EQ Cookbook이라는 오디오 업계 표준 레시피를 참고해 구현했습니다.
📍 `src/lib/dsp/biquad.ts` — `notchCoefs`, `highpassCoefs`, `lowpassCoefs`, `processBiquad`

---

### Q14. PPG 필터는 EEG와 어떻게 다른가요?

**A.** PPG는 0.5Hz 하이패스와 5Hz 로우패스만 거칩니다. 심박수가 보통 분당 30~180 사이라 주파수로는 0.5~3Hz 정도이므로, 그 대역만 통과시키는 밴드패스 형태입니다. 60Hz 노치는 PPG 샘플레이트(50Hz)가 60Hz보다 낮아서 필요 없습니다.
📍 `src/lib/dsp/ppgPipeline.ts:processPpgSample()`

---

### Q15. ACC는 왜 필터를 안 쓰나요?

**A.** 가속도는 그 자체가 의미 있는 raw 값이라 필터링이 별로 필요 없습니다. 다만 X·Y·Z 세 축의 크기를 합치는 magnitude(`√x²+y²+z²`) 계산만 추가합니다. 이 값이 1g 근처면 정지, 더 크면 움직임으로 해석합니다.
📍 `src/lib/sensors/accAdapter.ts:ingestAccRaw()` — magnitude 계산

---

### Q16. 필터를 거치면 처음에 신호가 0으로 나오던데 왜 그런가요?

**A.** 디지털 필터는 안정화되기까지 일정 시간(과도 응답, transient)이 필요합니다. 그동안 출력값을 그대로 쓰면 큰 진폭의 인공 신호가 차트에 튀어 보이므로, EEG는 처음 250샘플(약 1초), PPG는 처음 150샘플(약 3초)의 출력을 0으로 마스킹합니다.
📍 `src/lib/dsp/eegPipeline.ts` — `EEG_TRANSIENT_SAMPLES = 250` / `ppgPipeline.ts` — `PPG_TRANSIENT_SAMPLES = 150`

---

## 4. 신호 품질 (SQI)

### Q17. 신호 품질 점수(SQI)는 어떻게 계산하나요?

**A.** 필터링된 신호에 슬라이딩 윈도우를 씌워서 그 구간의 진폭이 임계치를 얼마나 벗어나는지 계산합니다. 진폭이 작고 안정적이면 100%, 임계치를 초과할수록 점수가 떨어집니다. EEG는 진폭(70%)과 분산(30%)을 가중 평균합니다.
📍 `src/lib/sensors/eegAdapter.ts:appendEegSqiIncremental()` / `ppgAdapter.ts:appendSqiIncremental()`

---

### Q18. 매 프레임마다 윈도우 전체를 다시 계산하면 느리지 않나요?

**A.** 그래서 **증분 계산(incremental)** 방식을 씁니다. 새로 들어온 샘플과 겹치는 윈도우 위치만 다시 계산하고, 이미 계산이 끝난 옛날 샘플의 SQI는 그대로 둡니다. 덕분에 매 프레임 연산량이 일정하게 유지됩니다.
📍 동일 파일 — `firstWinStart`, `lastWinStart` 계산 부분

---

## 5. 주파수 분석 & 분석 지표

### Q19. 뇌파 대역별 파워는 어떻게 계산하나요?

**A.** Delta(1–4Hz), Theta(4–8Hz), Alpha(8–13Hz), Beta(13–30Hz), Gamma(30–45Hz) 다섯 대역마다 따로 계산합니다. 각 대역에 대해 raw EEG에 추가 Biquad 필터를 적용한 뒤, Morlet 웨이블릿이라는 수학 기법으로 그 대역의 에너지를 구하고 dB로 환산합니다.
📍 `src/lib/dsp/spectrum.ts:computeBandPower()` / `computeEegPower()`

---

### Q20. Morlet 웨이블릿이 뭔가요?

**A.** 특정 주파수에 맞춰진 작은 파형(웨이블릿)을 신호와 곱해서 그 주파수가 얼마나 강하게 들어있는지 측정하는 방법입니다. Fourier 변환과 비슷하지만 시간 분해능이 좋아서 짧은 신호에서도 주파수별 에너지를 추정할 수 있습니다. 수학 구현은 Claude의 도움을 받았습니다.
📍 `src/lib/dsp/spectrum.ts:morletPowerDb()`

---

### Q21. 파워 스펙트럼 차트는 어떻게 그리는 건가요?

**A.** 1Hz부터 45Hz까지 1Hz 단위로 DFT(이산 푸리에 변환)를 돌려서 각 주파수의 파워를 구합니다. 그 결과를 ECharts에 점으로 찍으면 주파수별 분포 곡선이 그려집니다.
📍 `src/lib/dsp/spectrum.ts:computeSpectrum()` / `src/components/eeg/PowerSpectrumChart.tsx`

---

### Q22. 집중도, 이완도, 스트레스 같은 지표는 누가 계산하나요?

**A.** 이 값들은 **서버에서 이미 계산해서 보내줍니다**. 프론트엔드는 `eegAnalysis` 필드로 받은 값을 정규화(타입 변환)만 한 뒤 카드에 표시합니다.
📍 `src/lib/sensors/eegAdapter.ts:normalizeEegAnalysis()` — 정규화만 함 / `src/components/eeg/IndexCards.tsx` — 카드 표시

---

### Q23. BPM(심박수)은 어떻게 계산하나요?

**A.** BPM도 서버가 계산해서 `ppgAnalysis.bpm` 필드로 보내줍니다. 프론트엔드는 받은 값을 PPG 카드에 띄우고, 시간에 따른 변화를 BPM 트렌드 차트에도 점으로 누적합니다.
📍 `src/lib/sensors/ppgAdapter.ts:ingestPpgHistoryFromAnalysis()` — 히스토리 누적

---

### Q24. ACC의 "정지/움직임" 같은 활동 상태는 어떻게 판단하나요?

**A.** 이것도 서버 계산값입니다. `accAnalysis.activityState` 필드로 'stationary' / 'moving' 같은 문자열이 들어오고, intensity / stability / avgMovement 같은 숫자도 같이 옵니다. 프론트엔드는 이걸 받아서 MotionCards에 표시만 합니다.
📍 `src/lib/sensors/accAdapter.ts:normalizeAccAnalysis()` / `src/components/acc/MotionCards.tsx`

---

## 6. 차트 렌더링

### Q25. 차트 라이브러리는 뭘 쓰나요?

**A.** Apache ECharts 6.x를 씁니다. 막대·선·산점도 등 표준 차트 외에도 실시간 스트리밍에 강하고, Canvas 렌더러를 써서 대량의 데이터 포인트도 빠르게 그릴 수 있습니다.
📍 `src/lib/charts/echartsRegistry.ts` — 사용 모듈만 골라서 등록

---

### Q26. 차트가 매 프레임마다 다시 그려지는데 안 느리나요?

**A.** 두 가지 최적화가 있습니다. ① 차트마다 React 컴포넌트를 다시 만들지 않고, ECharts의 `setOption({ series: [{ data }] })` 메서드로 데이터만 갱신합니다. ② EEG처럼 점이 많은 차트는 `sampling: 'lttb'` 옵션으로 시각적으로 의미 있는 점만 골라 그리도록 합니다.
📍 `src/lib/charts/BaseChart.tsx` — 공통 수명주기 / `src/components/eeg/RawDataChart.tsx` — `sampling: 'lttb'`

---

### Q27. 차트 크기를 줄이거나 키우면 어떻게 되나요?

**A.** `BaseChart`가 `window.addEventListener('resize')`로 윈도우 리사이즈를 감지해서 ECharts 인스턴스의 `resize()` 메서드를 호출합니다. 덕분에 화면 크기가 변해도 차트가 자동으로 따라 늘어납니다.
📍 `src/lib/charts/BaseChart.tsx` — `handleResize`

---

## 7. 상태 관리 & 데이터 흐름

### Q28. 받은 데이터가 화면에 그려지기까지 어떤 단계를 거치나요?

**A.** 5단계입니다. ① SSE로 수신 → ② 페이싱 큐에 적재 → ③ 어댑터에서 필터링·SQI 계산 → ④ Zustand 저장소에 저장 → ⑤ 저장소를 구독하던 React 컴포넌트가 자동으로 다시 렌더링되며 ECharts에 새 데이터 전달.
📍 흐름 자체는 `CODE_GUIDE.md`의 섹션 2 다이어그램 참고

---

### Q29. 왜 Zustand를 골랐나요? Redux는 왜 안 썼나요?

**A.** Redux는 액션·리듀서·디스패치 같은 보일러플레이트 코드가 많아서 작은 프로젝트엔 부담입니다. Zustand는 `create((set) => ({ ... }))` 한 줄로 저장소를 만들 수 있고, 컴포넌트 바깥(예: 프레임 페이서)에서 `useEegStore.getState().ingestRaw(...)`처럼 직접 접근할 수 있어서 실시간 데이터 처리에 더 적합합니다.
📍 `src/stores/slices/eegStore.ts` 등 — 코드량 비교용

---

### Q30. 페이싱이 정확히 어떻게 작동하나요?

**A.** 받은 raw 샘플을 곧바로 차트에 넣지 않고 큐(FIFO 버퍼)에 쌓습니다. 그리고 `requestAnimationFrame`으로 매 프레임(초당 약 60번)마다 실행되는 루프에서, 경과 시간 × 샘플레이트만큼만 큐에서 꺼내 저장소로 보냅니다. 그래서 SSE가 한꺼번에 14개를 던져도 차트에는 일정 속도로 흘러갑니다.
📍 `src/hooks/useSSEConnection.ts` — `frameLoop()`, `drainQueue()`

---

## 8. 센서별 차이

### Q31. EEG는 채널이 두 개(FP1, FP2)인데 PPG·ACC는 왜 다른가요?

**A.** EEG는 좌뇌(FP1)와 우뇌(FP2) 활동을 따로 측정해야 의미가 있어서 2채널입니다. PPG는 IR(적외선)과 Red(붉은빛) LED 두 개를 쓰지만 둘 다 같은 손가락/이마 부위 측정이라 합쳐서 한 신호로 봅니다. ACC는 본질적으로 X/Y/Z 세 축이 필요한 3차원 측정입니다.

---

### Q32. 샘플레이트가 센서마다 다른 이유는?

**A.** 측정하려는 신호의 빠르기가 다르기 때문입니다. 뇌파는 빠른 변화(45Hz까지)를 보려면 250Hz가 필요하고, 심박은 분당 30~180회 수준이라 50Hz면 충분합니다. 가속도도 30Hz면 사람의 일상 움직임을 충분히 잡습니다. 샘플레이트가 높을수록 데이터 양이 늘어나니 필요한 만큼만 씁니다.
📍 `src/lib/dsp/eegPipeline.ts:EEG_SAMPLE_RATE = 250` 등

---

### Q33. PPG / ACC 분석 지표는 왜 프론트에서 직접 계산 안 하나요?

**A.** BPM이나 HRV(심박변이도)는 피크 검출, R-R 간격 분석 같은 복잡한 알고리즘이 필요한데, 이미 LinkBand 서버에서 검증된 알고리즘으로 계산해서 보내주기 때문에 굳이 프론트에서 다시 만들 필요가 없습니다. EEG의 대역별 파워는 서버가 보내주는 형식이 우리가 원하는 시각화에 안 맞아서 직접 다시 계산했습니다.

---

## 9. 기술 선택 & 배포

### Q34. SSE 대신 WebSocket을 쓰지 않은 이유는?

**A.** 우리가 받는 데이터는 **서버 → 브라우저 한 방향**만 필요합니다. WebSocket은 양방향 통신이라 더 복잡하고, 별도 라이브러리가 필요한 경우도 많습니다. SSE는 일반 HTTP를 사용하고 브라우저에 `EventSource`가 내장돼있어서 한 줄로 구독할 수 있습니다. 또 자동 재연결도 기본 제공됩니다.

---

### Q35. React 19를 쓰는 특별한 이유가 있나요?

**A.** 최신 안정 버전이라 골랐습니다. 19에서 추가된 기능을 적극적으로 쓰진 않았지만, Concurrent Features와 Strict Mode의 동작 개선이 실시간 렌더링에 유리합니다.
📍 `package.json` — `"react": "^19.2.4"`

---

### Q36. 배포는 어떻게 하나요?

**A.** Vercel + GitHub 연동입니다. Vercel에 GitHub 저장소를 연결해두면, `git push`만으로 자동 빌드·배포됩니다. `vercel.json`에 빌드 명령(`npm run build`)과 결과물 폴더(`dist`)만 적어두면 끝입니다.
📍 `vercel.json` (5줄)

---

### Q37. 코드 한 줄 바꾸면 사이트에 언제 반영되나요?

**A.** GitHub에 push한 순간 Vercel이 감지해서 빌드를 시작하고, 보통 30초~1분 안에 새 버전이 배포됩니다. 헤더의 버전 번호와 git SHA가 바뀐 걸로 확인할 수 있습니다.

---

### Q38. 다크 모드 같은 건가요? 색깔이 어두운데.

**A.** 의도적으로 어두운 톤을 기본으로 했습니다. 차트의 가는 선이나 색이 잘 보이도록 다크 테마가 더 적합하다고 판단했습니다. Tailwind CSS의 디자인 토큰을 `src/index.css`의 `@theme` 블록에서 관리합니다.
📍 `src/index.css`

---

## 10. 협업 & 어려웠던 점

### Q39. AI(Claude)는 어디까지 도왔나요?

**A.** 수학적으로 복잡한 부분 — Biquad 필터 수식, DFT, Morlet 웨이블릿, SQI의 증분 계산 같은 알고리즘 구현은 Claude의 도움을 받았습니다. 반면 **전체 구조 설계(5단계 파이프라인), 어떤 차트를 어디에 배치할지, 어떤 지표를 강조할지, 배포 환경 구성**은 모두 저희가 직접 결정했습니다.

---

### Q40. 가장 어려웠던 부분은 뭔가요?

**A.** **페이싱**입니다. 처음엔 받은 데이터를 그냥 차트에 넣었더니 "와르르 → 멈춤 → 와르르" 식으로 끊겨 보였습니다. 원인을 분석해보니 SSE가 데이터를 불규칙한 묶음으로 보내는 게 문제였습니다. 큐에 쌓아두고 `requestAnimationFrame`으로 일정 속도로 꺼내는 구조를 만들고, 짧은 공백엔 마지막 샘플을 반복하는 hold-last 기법까지 추가하니 매끄럽게 흘러가게 됐습니다.
📍 `src/hooks/useSSEConnection.ts` — `drainQueue()`의 hold-last 로직

---

### Q41. 만약 새 센서를 추가하라면 어떻게 하시겠어요?

**A.** 같은 패턴을 따라 4개 파일을 추가하면 됩니다. ① `types/sensor.ts`에 타입 정의, ② `lib/sensors/xxxAdapter.ts`에 어댑터, ③ `stores/slices/xxxStore.ts`에 저장소, ④ `useSSEConnection.ts`의 `frameLoop`에 큐와 drain 한 줄 추가. 차트 컴포넌트는 `BaseChart`를 재사용해서 빠르게 만들 수 있습니다.

---

### Q42. 이 프로젝트에서 가장 자랑하고 싶은 부분은?

**A.** 두 가지입니다. ① 페이싱으로 매끄러운 실시간 차트를 구현한 것 — 단순히 데이터를 받아서 그리는 게 아니라 "어떻게 보여줄까"까지 고민했다는 점. ② 5단계 파이프라인이 깔끔히 분리돼있어서 새 센서가 추가돼도 같은 구조로 확장 가능하다는 점입니다.

---

## 💡 답변 시 팁

- **질문에 자신이 없으면**: "이 부분은 코드를 보면서 설명드릴게요"라고 말하고 해당 파일을 열어서 보여주면 됨. 모든 답변에 📍 코드 위치를 적어둔 이유.
- **수학적인 질문에 막히면**: "이 부분의 알고리즘 구현은 Claude의 도움을 받았는데, 전체 흐름은 이렇습니다"로 솔직하게 말한 뒤 흐름만 설명하기.
- **모르는 질문이 나오면**: "그 부분은 미처 살펴보지 못했는데, 확인하고 답변드리겠습니다"가 정답. 추측해서 답하지 않기.

---

# 📝 부록: Claude 협업 실제 사례

> *"AI가 다 해준 거 아니에요?"* 라는 질문에 대비해, **누가 무엇을 했는지**를 구체적으로 보여주는 자료.
> 발표 중 Q39 이후 후속 질문이 들어오면 이 자료로 답하면 됨.

---

## 📊 구현 주체별 비교표

| 영역 | 👥 우리가 직접 | 🤝 Claude와 협업 | 🤖 Claude가 주도 (우린 검토) |
|------|-------------|-----------------|---------------------------|
| **프로젝트 기획** | ✅ 어떤 차트·지표·레이아웃을 보여줄지 | | |
| **UI 컴포넌트 구조** | ✅ 탭·카드·배너 배치 결정 | 컴포넌트 boilerplate | |
| **데이터 흐름 설계** | ✅ 5단계 파이프라인 결정 | | |
| **Biquad 필터 수식** | | | ✅ RBJ Cookbook 기반 구현 |
| **DFT / Morlet 웨이블릿** | | | ✅ 알고리즘 구현 |
| **페이싱 큐 구조** | ✅ 문제 정의 ("차트가 끊겨 보임") | ✅ 큐 + RAF 패턴 함께 설계 | |
| **페이싱 hold-last 시간** | ✅ 직접 데이터 측정해서 결정 (EEG 800ms, ACC 3500ms 등) | | |
| **SQI 증분 최적화** | | | ✅ 슬라이딩 윈도우 알고리즘 |
| **TypeScript 타입** | | ✅ 구조 설계 함께 | |
| **Zustand 저장소 분리** | ✅ 도메인별 슬라이스 결정 | 어댑터 패턴 제안 | |
| **ECharts 옵션 (색상·레이아웃)** | ✅ 직접 결정 | 옵션 빌더 패턴 제안 | |
| **배포 설정 (Vercel)** | ✅ 직접 연동 | | |
| **HMR 누수 등 버그 디버깅** | ✅ 문제 발견 | ✅ 원인 분석 함께 | |

**핵심 메시지**:
- 👥 **우리가 직접 한 영역이 더 많음**. 특히 **무엇을 만들지·어떻게 보여줄지**는 100% 우리 몫.
- 🤖 **Claude가 주도한 부분은 수학·알고리즘**에 한정됨. 그마저도 결과를 우리가 검증하고 파라미터를 조정함.

---

## 🗂️ 실제 협업 사례 5개 (프롬프트 → Claude 방향 → 우리 결정)

### 사례 1 — 뇌파 노이즈 필터 구현

**📝 우리가 한 질문 (요약)**:
> "EEG 데이터에 60Hz 전력선 노이즈, 1Hz 이하의 DC 드리프트, 45Hz 이상의 고주파 잡음이 섞여 있습니다. TypeScript로 이 셋을 한 번에 제거하는 필터를 만들고 싶은데, 어떤 필터 종류를 어떤 순서로 써야 하나요? 매 샘플마다 호출되는 실시간 처리에 적합한 구조여야 합니다."

**🤖 Claude가 제시한 방향**:
- **Biquad(2차 IIR) 필터**를 추천 — RBJ Audio EQ Cookbook의 표준 수식 사용
- 3단 캐스케이드: **노치(60Hz) → 하이패스(1Hz) → 로우패스(45Hz)**
- 각 필터를 **순수 함수**로 만들고 상태(state)를 인자로 받게 분리 → 채널마다 별도 인스턴스 가능
- 처음 250샘플(약 1초)은 transient(과도 응답) 구간이라 출력을 0으로 마스킹 권장

**👥 우리가 결정/조정한 것**:
- 파일 구조: `biquad.ts`(수식만) + `eegPipeline.ts`(조합) + `ppgPipeline.ts`(PPG용)로 분리
- transient 마스킹 길이: EEG 250샘플, PPG 150샘플로 직접 정함
- linkband SDK와 결과 비교하면서 Q값 등 파라미터 미세 조정

📍 **결과 코드**: `src/lib/dsp/biquad.ts`, `eegPipeline.ts`

---

### 사례 2 — 페이싱 (차트 끊김 문제)

**📝 우리가 한 질문 (요약)**:
> "SSE로 받은 데이터를 차트에 바로 넣으니까, 패킷이 한꺼번에 도착할 땐 차트가 와르르 그려지고 그 사이엔 멈춰서 부자연스럽게 보입니다. 측정해보니 PPG는 14개씩 280ms마다 한꺼번에 옵니다. 매끄럽게 흘러가는 차트로 만들고 싶은데 어떻게 해야 하나요?"

**🤖 Claude가 제시한 방향**:
- 받은 샘플을 즉시 그리지 말고 **큐(FIFO)에 쌓아두는** 구조 제안
- `requestAnimationFrame`으로 매 프레임(약 16ms)마다 호출되는 루프에서 **샘플레이트 × 경과시간** 만큼만 꺼내기
- 짧은 패킷 공백 동안 **마지막 샘플을 반복(hold-last-sample)** 해서 차트가 멈추지 않도록
- 탭이 백그라운드로 가면 큐가 쌓이는데, **IDLE_RESYNC**로 일정 간격 이상 지나면 큐를 비우고 현재 시각에 다시 맞추기

**👥 우리가 결정/조정한 것**:
- 센서별 버퍼 크기를 **직접 데이터 캡처해서 측정**: EEG 1.5s, PPG 4s, ACC 5s
- hold-last 시간을 센서 특성에 맞게 분리: EEG/PPG는 800ms, ACC는 3500ms (가속도는 정지 시 값이 거의 안 바뀌어서 더 길게 잡아도 됨)
- IDLE_RESYNC 임계치 200ms로 결정

📍 **결과 코드**: `src/hooks/useSSEConnection.ts:drainQueue()` + `frameLoop()`

---

### 사례 3 — SQI 계산이 너무 느릴 때

**📝 우리가 한 질문 (요약)**:
> "신호 품질(SQI)을 슬라이딩 윈도우로 계산하는데, 매 프레임 전체 버퍼를 다시 계산하니까 메인 스레드가 버벅거립니다. 새로 들어온 샘플만 추가로 계산하는 방식으로 최적화하려면 어떻게 해야 하나요?"

**🤖 Claude가 제시한 방향**:
- **증분(incremental) 계산**: 새 샘플과 겹치는 윈도우 위치만 다시 계산하고, 이미 윈도우가 지나간 옛날 샘플의 SQI는 그대로 유지
- 재계산 범위 = `Math.max(0, len - WINDOW - newCount + 1)` ~ `Math.max(0, len - WINDOW)`
- 콜드스타트(데이터가 윈도우 크기보다 적을 때) 가드: `if (len < WINDOW) return prevSqi`로 NaN 오염 방지

**👥 우리가 결정/조정한 것**:
- SQI 가중치: 진폭 70% + 주파수 30%로 결정
- 임계치: EEG 150μV, PPG 250 (raw 단위)로 결정
- 윈도우 크기: EEG 125샘플(0.5s), PPG 25샘플(0.5s)로 결정

📍 **결과 코드**: `src/lib/sensors/eegAdapter.ts:appendEegSqiIncremental()`

---

### 사례 4 — 차트가 갑자기 멈추는 버그

**📝 우리가 한 질문 (요약)**:
> "개발 중에 코드를 수정하고 저장하면 차트가 갑자기 멈춰요. 페이지를 새로고침하면 다시 잘 작동하는데, 왜 이런 일이 생길까요? Vite를 쓰고 있고 EventSource로 SSE를 받습니다."

**🤖 Claude가 제시한 원인 분석**:
- Vite의 **HMR(Hot Module Replacement)** 이 모듈을 재평가할 때, 살아있는 EventSource는 자동으로 정리되지 않음
- 결과: 옛날 모듈의 onmessage 콜백이 옛날 큐에 데이터를 계속 넣지만, 새 모듈은 빈 큐를 보고 있음 → 차트 멈춤
- 해결: `import.meta.hot.dispose`에서 **EventSource를 닫고 큐와 frame loop도 리셋**

**👥 우리가 한 것**:
- 문제 발견·재현 (학생이 직접 디버깅 환경에서 관찰)
- Claude가 제안한 해결책을 거의 그대로 적용
- HMR 외에도 disconnect 시 같은 정리 로직이 필요해서 `resetAllSlices()` 함수로 분리

📍 **결과 코드**: `src/hooks/useSSEConnection.ts` 하단의 `import.meta.hot` 블록

---

### 사례 5 — TypeScript 타입 설계

**📝 우리가 한 질문 (요약)**:
> "센서 데이터가 EEG·PPG·ACC 세 종류인데 각자 raw 샘플, 분석 결과, leadOff 정보가 비슷하면서도 다릅니다. 타입을 어떻게 설계하면 깔끔하게 관리할 수 있을까요?"

**🤖 Claude가 제시한 방향**:
- 센서별로 **별도 인터페이스**: `EegRawSample`, `PpgRawSample`, `AccSample`
- 분석 결과도 분리: `EegAnalysis`, `PpgAnalysis`, `AccAnalysis`
- 한 패킷 안의 모든 데이터를 묶는 통합 타입: `SensorPayload` (모든 필드 optional)
- 차트용 공통 타입: `DataPoint = { index: number; value: number }`

**👥 우리가 결정/조정한 것**:
- 어떤 필드를 optional로 둘지 결정 (예: `leadOff?`, `spo2: number | null`)
- `leadOff`를 `{ ch1, ch2 }` 객체로 통일 (서버는 다른 형식으로도 보내기도 했지만 일관성 위해)
- 분석 지표의 일부 필드명을 카드 표시용 한국어 키로 매핑

📍 **결과 코드**: `src/types/sensor.ts`

---

## 💬 효과적이었던 프롬프트 패턴

여러 번 반복하면서 깨달은 **잘 통하는 질문 형식** 3가지:

### 1. "문제 + 측정 데이터 + 제약" 패턴
> ❌ 나쁜 예: "차트가 끊겨요. 어떻게 고치죠?"
>
> ✅ 좋은 예: "PPG가 14개씩 280ms마다 한꺼번에 도착해서 차트가 끊겨 보입니다. 60fps로 매끄럽게 그리고 싶은데, 별도 라이브러리 없이 브라우저 기본 API만 쓰는 방법으로 어떻게 해야 하나요?"

### 2. "왜 그런지 + 가설" 패턴
> ❌ 나쁜 예: "차트가 멈추는데 왜 그래요?"
>
> ✅ 좋은 예: "코드 저장 후 차트가 멈춥니다. 새로고침하면 정상이고, 콘솔 에러는 없습니다. Vite HMR이 EventSource를 정리하지 않아서 옛 콜백이 살아남는 것 같은데, 맞을까요?"

### 3. "원하는 결과 + 입력 형태" 패턴
> ❌ 나쁜 예: "필터 만들어줘"
>
> ✅ 좋은 예: "입력은 number 한 개, 출력도 number 한 개인 함수로, 60Hz 노치 필터를 만들고 싶습니다. 상태(이전 샘플들)는 인자로 받아 외부에서 관리하게 해주세요. 250Hz 샘플레이트 기준으로 RBJ Cookbook 공식을 써주세요."

---

## 🎤 발표용 정리 한 줄

> "Claude는 **계산기처럼** 썼습니다. 어떤 문제를 풀어야 하는지, 어떤 결과를 원하는지는 저희가 결정했고, 수학적으로 어려운 알고리즘 구현만 Claude에게 맡긴 뒤 결과를 검증했습니다. 덕분에 전공자가 아닌 저희도 실제로 작동하는 신호처리 대시보드를 만들 수 있었습니다."

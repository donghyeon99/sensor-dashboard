# LuxAcademy Sensor Dashboard

Real-time BCI (Brain-Computer Interface) sensor data visualization dashboard for the LinkBand headset. Displays EEG, PPG, and ACC data with professional-grade signal processing and analysis.

**[Online Demo](https://sensor-dashboard-tawny-three.vercel.app/)** — No installation needed

> **[한국어 README](README.md)**

---

## 1. Connecting LinkBand

### 1-1. Prerequisites

| Item | Description |
|------|-------------|
| **LinkBand** | LooxidLabs BCI headset (EEG + PPG + ACC sensors) |
| **PC** | Computer with Node.js 18+ |

### 1-2. Start Data Streaming from LinkBand Web

1. Go to [sdk.linkband.store](https://sdk.linkband.store) on your PC
2. Click **LinkBand** in the left menu
3. **Scan Devices** → select your device → **Connect and Pairing**
4. Click **SYSTEM PROCESS** in the left menu
5. Click **Connect** in the **Broadcast Server** section
6. Scroll down → **Developer API** section → **cURL** tab → copy the URL
7. The URL contains your **Device ID** as a query string (`?deviceId=...`)

> **Important**: Device IDs are session-specific. Always use the URL from **your own** LinkBand session.

### 1-3. Connect to Dashboard

1. Open [Online Demo](https://sensor-dashboard-tawny-three.vercel.app/) or local server (`http://localhost:5173`)
2. Click **Connect** button (top right)
3. Paste the SSE URL from step 1-2
4. Click **Connect** → real-time data appears on charts

> **SSE URL format**: `https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId={YOUR_DEVICE_ID}`

---

## 2. Installation & Running

### 2-0. Prerequisites: Node.js

```bash
node --version   # v18+ required
npm --version
```

- **Windows**: Download from [nodejs.org](https://nodejs.org) → run .msi installer
- **Mac**: `brew install node` or download .pkg from nodejs.org
- **Linux**: `sudo apt install nodejs npm` or use [nvm](https://github.com/nvm-sh/nvm)

### 2-1. Clone

```bash
git clone https://github.com/donghyeon99/sensor-dashboard.git
cd sensor-dashboard
```

### 2-2. Install Dependencies

```bash
npm install
```

### 2-3. Run Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173`.

---

## 3. Features

### 3-1. Theme Switcher (Purple / Black / White)

Three themes selectable via color buttons in the Visualizer header. Choice is persisted in localStorage.

| Theme | Background | Cards | Best for |
|-------|-----------|-------|----------|
| **Purple** | Deep indigo (#0a0a1a) | Dark purple-tinted | Immersive dark environment |
| **Black** | Pure black (#000000) | Neutral dark gray | OLED screens, minimal |
| **White** | Light gray (#f8f9fa) | White cards | Bright rooms, presentations |

### 3-2. Signal Quality Monitoring

- **Streaming badge**: Shown when connected to SSE
- **Signal Quality badge**: 4-level indicator (Excellent / Good / Warning / Bad)
  - Based on average SQI of last 50 samples + electrode lead-off status
- **Per-chart LeadOff banners**: FP1-only, FP2-only, or both — shown inline above each chart

### 3-3. Sticky Navigation

Header with Visualizer title, theme switcher, status badges, and EEG/PPG/ACC tab bar remains fixed at the top while scrolling.

### 3-4. EEG Tab

| Component | Description |
|-----------|-------------|
| Ch1/Ch2 Filtered EEG Signal | FP1/FP2 real-time waveform (60Hz notch + 1-45Hz bandpass) |
| Ch1/Ch2 Signal Quality (SQI) | Per-channel electrode contact quality monitoring |
| Power Spectrum (1-45Hz) | Frequency-domain dual-channel analysis with band markers |
| Frequency Band Power | Delta/Theta/Alpha/Beta/Gamma 5-band power cards (Ch1 vs Ch2) |
| EEG Analysis Indices | 7 indices: Focus, Arousal, Stress, Emotional Stability, Total Power, Cognitive Load, Hemispheric Balance |

All index cards show **dynamic dot colors** matching the current threshold level (green = normal, red = excessive, etc.) and **hover tooltips** with formula, normal range, interpretation, and reference.

### 3-5. PPG Tab

| Component | Description |
|-----------|-------------|
| Filtered PPG Signal | IR/Red channels with **0.5-5.0Hz bandpass filter** (DC removed) |
| PPG Signal Quality (SQI) | Signal quality chart (shares EEG SQI — same forehead electrodes) |
| PPG LeadOff Banner | Electrode contact warning specific to PPG section |
| HRV Metrics (14 indices) | 4-row grid: BPM/SpO2/HR Max/HR Min → Stress/RMSSD/SDNN/SDSD → LF/HF/LF-HF Ratio → AVNN/PNN50/PNN20 |

### 3-6. ACC Tab

| Component | Description |
|-----------|-------------|
| 3-Axis Acceleration Waveform | X (red), Y (green), Z (blue) real-time |
| Magnitude | √(x²+y²+z²) combined acceleration |
| Movement Analysis | Axis values, Activity State, Stability, Intensity |

---

## 4. Architecture

### 4-1. Data Flow

```
LinkBand Device
    ↓ (Bluetooth)
LinkBand App / Cloud
    ↓ (HTTPS)
Cloud Broadcast Server (Google Cloud Run)
    ↓ (SSE / EventSource)
┌─────────────────────────────────────────────┐
│  React Dashboard (browser)                  │
│                                             │
│  EventSource(sseUrl)                        │
│    ↓ JSON.parse                             │
│  useSSEConnection → dispatchPayload()       │
│    ↓                                        │
│  Zustand Store Slices                       │
│    eegStore / ppgStore / accStore            │
│    batteryStore / statsStore                 │
│    ↓ subscribe                              │
│  BaseChart (echarts) → render               │
└─────────────────────────────────────────────┘
```

No backend server required — the frontend subscribes to SSE directly.

### 4-2. Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│ UI Layer                                    │
│   shadcn/ (Card, Badge, Tabs, Button)       │
│   visualizer/ (Header, ThemeSwitcher)       │
│   eeg/ ppg/ acc/ connect/ layout/           │
├─────────────────────────────────────────────┤
│ Chart Layer                                 │
│   lib/charts/ (BaseChart, optionBuilders,   │
│                echartsRegistry, theme)       │
├─────────────────────────────────────────────┤
│ State Layer                                 │
│   stores/slices/ (eeg, ppg, acc, battery,   │
│                   stats) + connectionStore  │
│   hooks/ (useSSEConnection, useTheme,       │
│           useSignalQuality)                 │
├─────────────────────────────────────────────┤
│ Domain Layer (pure, no React dependency)    │
│   lib/dsp/ (biquad, eegPipeline,            │
│             ppgPipeline, spectrum)           │
│   lib/sensors/ (eegAdapter, ppgAdapter,     │
│                 accAdapter)                  │
│   lib/thresholds/ (indexThresholds)          │
├─────────────────────────────────────────────┤
│ Types Layer                                 │
│   types/sensor.ts (SSE payload shapes)      │
└─────────────────────────────────────────────┘
```

### 4-3. Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | shadcn/ui installed in `components/shadcn/` (isolated) | Avoids Windows FS case collision with legacy `components/ui/` |
| D2 | Single echarts registry | Prevents duplicate `echarts.use()` calls across 8+ chart components |
| D3 | BaseChart wrapper | Standardizes init/resize/dispose lifecycle — ~255 lines of boilerplate eliminated |
| D4 | 5 Zustand store slices | Domain-specific selectors minimize re-renders |
| D5 | Pure DSP functions | `lib/dsp/` has zero React/Zustand imports — unit testable |
| D6 | PPG 0.5-5Hz bandpass (no notch) | 50Hz sampling rate makes 60Hz line-noise filtering unnecessary |
| D7 | EEG SQI shared for PPG SQI | SSE provides single signalQuality per sample, Ch1/Ch2 mirrored |
| D8 | Theme via CSS custom properties | `data-theme` attribute swaps all colors without JS re-renders |

---

## 5. Signal Processing

### 5-1. EEG Filter Pipeline

```
Raw EEG (250Hz) → 60Hz Notch → 1Hz Highpass → 45Hz Lowpass → Display
                   (RBJ biquad)  (Butterworth)   (Butterworth)
```

First 250 samples (~1 second) output zero during filter transient warm-up.

### 5-2. PPG Filter Pipeline

```
Raw PPG (50Hz) → 0.5Hz Highpass → 5.0Hz Lowpass → Display
                  (Butterworth)     (Butterworth)
```

Removes DC baseline wander and high-frequency noise. First 50 samples (~1 second) zeroed for warm-up.

### 5-3. EEG Analysis Indices

Hover any index card to see formula, normal range, interpretation, and academic reference.

| Index | Formula | Normal Range | Reference |
|-------|---------|-------------|-----------|
| **Focus** | β / (α + θ) | 1.8 – 2.4 | Klimesch 1999 |
| **Arousal** | α / (α + β) | 0.18 – 0.22 | Bazanova & Vernon 2014 |
| **Stress** | (β + γ) / (α + θ) | 3.0 – 4.0 | Ahn et al. 2019 |
| **Hemispheric Balance** | (αL − αR) / (αL + αR) | −0.1 – 0.1 | Davidson 2004 |
| **Cognitive Load** | θ / α | 0.3 – 0.8 | Gevins & Smith 2003 |
| **Emotional Stability** | (α + θ) / γ | 0.4 – 0.8 | Knyazev 2007 |
| **Total Power** | Σ band powers | 850 – 1150 μV² | Klimesch 1999 |

### 5-4. PPG / HRV Metrics

| Metric | Method | Normal Range | Unit |
|--------|--------|-------------|------|
| **BPM** | PPG peak interval | 60 – 100 | beats/min |
| **SpO2** | Red/IR ratio (Beer–Lambert) | 95 – 100 | % |
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
| **HR Max/Min** | 2-min moving window | 80–150 / 50–80 | bpm |

> Sources: Task Force of ESC/NASPE 1996, Shaffer & Ginsberg 2017, AHA Guidelines.

### 5-5. Accelerometer

| Field | Description | Unit |
|-------|-------------|------|
| `x`, `y`, `z` | 3-axis acceleration | g |
| `magnitude` | √(x²+y²+z²) | g |
| Stability | Postural stability (0-100%) | % |
| Intensity | Movement intensity (0-100%) | % |

Sampling rate: 25Hz

---

## 6. Project Structure

```
sensor-dashboard/
├── src/
│   ├── App.tsx                          # Main layout (sticky header + tabs + content)
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Tailwind + 3 theme CSS variable sets
│   ├── types/
│   │   └── sensor.ts                    # SSE payload type definitions
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper (shadcn standard)
│   │   ├── dsp/                         # Pure signal processing (no React)
│   │   │   ├── biquad.ts               # RBJ biquad filter primitives
│   │   │   ├── eegPipeline.ts           # 60Hz notch + 1-45Hz bandpass
│   │   │   ├── ppgPipeline.ts           # 0.5-5Hz bandpass
│   │   │   └── spectrum.ts              # DFT, band power computation
│   │   ├── sensors/                     # Pure data adapters (no React)
│   │   │   ├── eegAdapter.ts            # EEG raw ingest + analysis normalize
│   │   │   ├── ppgAdapter.ts            # PPG raw ingest with filter
│   │   │   ├── accAdapter.ts            # ACC raw ingest
│   │   │   └── types.ts                 # Buffer state types
│   │   ├── charts/                      # echarts abstraction
│   │   │   ├── echartsRegistry.ts       # Single echarts.use() registration
│   │   │   ├── BaseChart.tsx            # Reusable chart lifecycle wrapper
│   │   │   ├── optionBuilders.ts        # Chart option factories
│   │   │   └── theme.ts                 # Chart color tokens
│   │   └── thresholds/
│   │       └── indexThresholds.ts       # EEG/PPG/ACC threshold definitions
│   ├── stores/
│   │   ├── connectionStore.ts           # SSE connection state
│   │   └── slices/                      # Domain-specific Zustand stores
│   │       ├── eegStore.ts              # EEG buffers + analysis
│   │       ├── ppgStore.ts              # PPG buffers + filtered + analysis
│   │       ├── accStore.ts              # ACC buffers + analysis
│   │       ├── batteryStore.ts          # Battery level
│   │       └── statsStore.ts            # Message count
│   ├── hooks/
│   │   ├── useSSEConnection.ts          # SSE lifecycle + dispatch to stores
│   │   ├── useTheme.ts                  # Theme switcher (purple/black/white)
│   │   └── useSignalQuality.ts          # 4-level signal quality computation
│   └── components/
│       ├── shadcn/                      # shadcn/ui primitives (isolated)
│       │   ├── card.tsx
│       │   ├── badge.tsx
│       │   ├── tabs.tsx
│       │   ├── button.tsx
│       │   └── input.tsx
│       ├── ui/                          # Legacy primitives (used by ACC)
│       ├── visualizer/                  # Page-level components
│       │   ├── VisualizerHeader.tsx      # Title + badges + theme switcher
│       │   ├── StreamingBadge.tsx
│       │   ├── SignalQualityBadge.tsx
│       │   └── ThemeSwitcher.tsx
│       ├── layout/                      # Header, Footer
│       ├── connect/                     # ConnectPanel (URL input)
│       ├── eeg/                         # EEG Visualizer (8 components)
│       ├── ppg/                         # PPG Visualizer (5 components)
│       └── acc/                         # ACC Visualizer (4 components)
├── docs/
│   ├── PROJECT_IDEAS.md
│   └── archive/                         # PDCA cycle documents
├── components.json                      # shadcn configuration
├── package.json
├── tsconfig.json                        # TypeScript + @/* path alias
└── vite.config.ts                       # Vite + Tailwind + @/ alias
```

---

## 7. Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **TypeScript 6** | Type safety |
| **Vite 8** | Build tool / dev server |
| **Tailwind CSS 4** | Styling (with CSS custom properties for theming) |
| **shadcn/ui** | UI component primitives (Card, Badge, Tabs) |
| **Radix UI** | Accessible headless components (Tabs) |
| **lucide-react** | Icon library (TriangleAlert, Clock) |
| **echarts 6** | Real-time chart visualization |
| **Zustand 5** | Global state management (5 domain slices) |
| **EventSource (SSE)** | Server → client real-time data stream |

---

## 8. Student Guide: Robot Control

A separate Python backend can be run to access sensor data via WebSocket for student projects.

### 8-1. Backend Setup (Optional)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 server.py
```

### 8-2. Example Student Code

```python
# robot_controller.py
from sensor_data import from_dict, SensorData

def on_sensor_data(data: SensorData):
    if data.eeg_analysis:
        attention = data.eeg_analysis.attention
        if attention > 0.6:
            print(f"Focus {attention:.2f} → Robot forward!")

    if data.ppg_analysis:
        bpm = data.ppg_analysis.bpm
        print(f"Heart rate: {bpm:.0f} BPM")
```

See `docs/PROJECT_IDEAS.md` for more project ideas.

---

## 9. Troubleshooting

### No data after Connect

1. Browser DevTools (F12) → **Network** → check `subscribe` request → **EventStream** tab for data frames
2. Verify LinkBand is actively publishing on sdk.linkband.store (Network → `POST /publish` → 200)
3. Ensure your dashboard `deviceId` matches the LinkBand session `deviceId` (most common mistake)
4. Check headband is properly fitted on forehead (lead-off state produces fixed values)
5. Device IDs with `+` or special characters work fine — the dashboard URL-encodes them automatically

### Mock data not appearing

The mock server may be inactive. Try connecting with a real device or a different mock ID.

### npm install fails

Make sure you're in the project root (`sensor-dashboard/`) and have Node.js 18+.

---

## 10. References

| Resource | Link |
|----------|------|
| LinkBand SDK Docs | https://sdk.linkband.store/ |
| LooxidLabs SDK-Android | https://github.com/LooxidLabs/SDK-Android |
| 10-20 International System | https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG) |
| ESC/NASPE HRV Standards | European Heart Journal, Vol 17, 1996 |

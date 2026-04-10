---
name: Sensor Dashboard Project
description: LuxAcademy BCI sensor dashboard — Vite+React frontend, WebSocket backend, component architecture and design redesign
type: project
---

LuxAcademy Sensor Dashboard is a brain-computer interface (BCI) monitor for students learning to control robots with brain sensor (EEG + PPG) data.

**Why:** Educational platform where sensor feedback is the core product; UI must be professional, readable, and live-updating.

**How to apply:** Prioritize live-data clarity and readability over decoration. All data flows through `useSensorData.js` — never modify that hook's exported interface.

## Stack
- Vite + React (dev server port 5173)
- WebSocket: `ws://localhost:8000/ws` (Python backend)
- No UI library — pure CSS + Canvas API + vanilla React
- No heavy chart libraries (no recharts, chart.js, d3)

## Component Map (post-redesign 2026-04-03)
| File | Purpose |
|------|---------|
| `src/App.jsx` | Shell layout: header, grid, footer |
| `src/App.css` | Full design system (CSS vars, all component styles) |
| `src/hooks/useSensorData.js` | WebSocket hook — do not change interface |
| `src/components/EegChart.jsx` | Canvas waveform with glow, grid, auto-scale |
| `src/components/EegAnalysis.jsx` | SVG circular gauges + bar metrics |
| `src/components/BpmDisplay.jsx` | Heart rate with beating CSS animation |
| `src/components/SignalQuality.jsx` | NEW — arc gauge, lead-off warning |
| `src/components/DeviceInfo.jsx` | NEW — session uptime, message count |
| `src/components/Footer.jsx` | NEW — data rate, message count footer |

## Design Tokens (CSS vars in App.css)
- Backgrounds: `--bg-base #0a0a1a`, `--bg-card #12122a`, `--bg-elevated #1a1a3a`
- Accents: `--teal #4ecdc4`, `--coral #ff6b6b`, `--purple #a855f7`
- Fonts: `--font-sans` system sans, `--font-mono` JetBrains Mono / Fira Code

## Data Shape
```json
{
  "type": "sensor",
  "eegRaw": { "fp1": [], "fp2": [], "signalQuality": 0, "sampleCount": 25 },
  "eegAnalysis": { "attention": 0-1, "focusIndex": 0-1, "relaxationIndex": 0-1,
                   "stressIndex": 0-1, "cognitiveLoad": 0-1, "emotionalBalance": 0-1,
                   "meditationLevel": 0-1, "totalPower": float },
  "ppgAnalysis": { "bpm": float, "spo2": float|null }
}
```

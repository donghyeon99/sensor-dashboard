# PPG / HRV Index Normal Ranges (sdk.linkband.store reference)

## Status
Pending implementation. Waiting for EEG threshold agents (A, B) to finish before spawning PPG agents (C, D).

## Scope
Rewrite `ppgIndexThresholds` in `src/lib/indexThresholds.ts` to match sdk reference exactly, and add hover tooltips to PPG cards (`src/components/ppg/PPGMetricsCards.tsx`) using the existing `IndexTooltip` component.

## Index data (from sdk.linkband.store indexGuides)

### bpm — Heart Rate (BPM)
- description: "Heart rate — beats per minute. Fundamental cardiovascular health indicator, affected by exercise, stress, medication."
- formula: "Calculated from PPG peak interval analysis"
- unit: "BPM"
- normalRange: [60, 100]
- levels (3):
  - `−∞ → 60`: "Bradycardia (low heart rate)", orange
  - `60 → 100`: "Normal range", green
  - `100 → +∞`: "Tachycardia (high heart rate)", orange
- reference: "American Heart Association Guidelines"

### spo2 — Oxygen Saturation
- description: "Blood oxygen saturation. Evaluates respiratory and circulatory function. Accuracy limited vs medical devices."
- formula: "Red/IR absorption ratio (Beer-Lambert law)"
- unit: "%"
- normalRange: [95, 100]
- levels (4):
  - `−∞ → 90`: "Severe hypoxemia (seek medical advice)", red
  - `90 → 95`: "Mild hypoxemia", orange
  - `95 → 98`: "Normal range (lower bound)", green
  - `98 → 101`: "Normal oxygen saturation", green
- reference: "Pulse Oximetry Principles, IEEE TBME"

### hrMax — Heart Rate Maximum (2-min window)
- description: "Maximum BPM over the last 2 minutes. Useful for stress response or activity intensity assessment."
- formula: "max(BPM) over moving 120-sample queue"
- unit: "BPM"
- normalRange: [80, 150]
- levels (3):
  - `−∞ → 80`: "Low maximum heart rate", blue
  - `80 → 150`: "Normal maximum heart rate", green
  - `150 → +∞`: "High maximum heart rate", orange
- reference: "Heart Rate Variability Analysis Guidelines"

### hrMin — Heart Rate Minimum (2-min window)
- description: "Minimum BPM over the last 2 minutes. Useful for resting cardiovascular efficiency or recovery assessment."
- formula: "min(BPM) over moving 120-sample queue"
- unit: "BPM"
- normalRange: [50, 80]
- levels (3):
  - `−∞ → 50`: "Low minimum heart rate", blue
  - `50 → 80`: "Normal minimum heart rate", green
  - `80 → +∞`: "High minimum heart rate", orange
- reference: "Heart Rate Variability Analysis Guidelines"

### ppgStressIndex — HRV-based Stress (normalized 0-1)
- key: `ppgStressIndex` (distinct from EEG `stressIndex`)
- description: "Normalized stress level (0.0–1.0) based on HRV metrics. Low = relaxed, high = stressed or fatigued."
- formula: "0.4·SDNNnorm + 0.4·RMSSDnorm + 0.2·HRstress"
- normalRange: [0.30, 0.70]
- levels (4):
  - `−∞ → 0.30`: "Very low stress (over-relaxed)", blue
  - `0.30 → 0.70`: "Normal range (balanced)", green
  - `0.70 → 0.90`: "High stress (tense)", orange
  - `0.90 → +∞`: "Very high stress (severe tension)", red
- reference: "HRV Analysis Methods, Frontiers in Physiology"

### sdnn — SDNN (Overall HRV)
- description: "Standard deviation of NN intervals — overall HRV level. Low = poor recovery, high = good recovery."
- formula: "SDNN = √(Σ(RRᵢ − R̄R)² / (N−1))"
- unit: "ms"
- normalRange: [30, 100]
- levels (3):
  - `−∞ → 30`: "Rigid heart rhythm (stress/fatigue)", orange
  - `30 → 100`: "Normal range", green
  - `100 → +∞`: "Flexible heart rhythm (very healthy)", blue
- reference: "Task Force of ESC/NASPE, 1996"

### rmssd — RMSSD (Parasympathetic)
- description: "Root mean square of successive RR differences. Reflects parasympathetic activity."
- formula: "RMSSD = √(Σ(RRᵢ₊₁ − RRᵢ)² / (N−1))"
- unit: "ms"
- normalRange: [20, 50]
- levels (3):
  - `−∞ → 20`: "Tense state (rest needed)", orange
  - `20 → 50`: "Normal range", green
  - `50 → +∞`: "Deeply relaxed state", blue
- reference: "Task Force of ESC/NASPE, 1996"

### sdsd — SDSD
- description: "Standard deviation of successive differences. Similar to RMSSD but different calculation. Higher = better stress recovery."
- formula: "SDSD = √(Σ((ΔRR) − mean_Δ)² / (N−1))"
- unit: "ms"
- normalRange: [15, 40]
- levels (3):
  - `−∞ → 15`: "Low heart rhythm variation (stress/fatigue)", orange
  - `15 → 40`: "Normal heart rhythm variation", green
  - `40 → +∞`: "Active heart rhythm variation (good recovery)", blue
- reference: "Heart Rate Variability Analysis Methods"

### pnn50 — PNN50
- description: "Percentage of successive NN intervals differing by >50ms. Parasympathetic activity indicator."
- formula: "PNN50 = count(|ΔRR| > 50ms) / N × 100"
- unit: "%"
- normalRange: [10, 30]
- levels (3):
  - `−∞ → 10`: "Regular heart rhythm (tense/fatigued)", orange
  - `10 → 30`: "Normal range", green
  - `30 → +∞`: "Flexible heart rhythm (healthy)", blue
- reference: "Task Force of ESC/NASPE, 1996"

### pnn20 — PNN20
- description: "Percentage of successive NN intervals differing by >20ms. More sensitive than PNN50 — detects subtle stress/recovery states."
- formula: "PNN20 = count(|ΔRR| > 20ms) / N × 100"
- unit: "%"
- normalRange: [20, 60]
- levels (3):
  - `−∞ → 20`: "Rigid heart rhythm (tense/fatigued)", orange
  - `20 → 60`: "Normal range", green
  - `60 → +∞`: "Flexible heart rhythm (healthy)", blue
- reference: "HRV Analysis Methods, IEEE TBME"

### avnn — AVNN (Average NN Intervals)
- description: "Average heart period. Fast HR → small AVNN, slow HR → large AVNN. Reflects baseline cardiac state."
- formula: "AVNN = Σ(RRᵢ) / N"
- unit: "ms"
- normalRange: [600, 1000]
- levels (3):
  - `−∞ → 600`: "Fast heart rate (active/tense)", orange
  - `600 → 1000`: "Stable heart rhythm", green
  - `1000 → +∞`: "Slow heart rate (rest/athletic)", blue
- reference: "Task Force of ESC/NASPE, 1996"

### lfPower — LF (Low Frequency Power)
- description: "Low-frequency power (0.04–0.15 Hz) — sympathetic nervous activity indicator."
- formula: "Welch periodogram PSD over RR intervals"
- unit: "ms²"
- normalRange: [200, 1200]
- levels (3):
  - `−∞ → 200`: "Low sympathetic activity (excessive rest)", blue
  - `200 → 1200`: "Normal sympathetic activity", green
  - `1200 → +∞`: "High sympathetic activity (stress/tension)", red
- reference: "Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017"

### hfPower — HF (High Frequency Power)
- description: "High-frequency power (0.15–0.4 Hz) — parasympathetic nervous activity indicator."
- formula: "Welch periodogram PSD over RR intervals"
- unit: "ms²"
- normalRange: [80, 4000]
- levels (3):
  - `−∞ → 80`: "Low parasympathetic activity (stress/fatigue)", orange
  - `80 → 4000`: "Normal parasympathetic activity", green
  - `4000 → +∞`: "High parasympathetic activity (deep rest)", blue
- reference: "Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017"

### lfHfRatio — LF/HF Ratio
- description: "Autonomic balance. Low = parasympathetic dominant, high = sympathetic dominant (stress)."
- formula: "LF / HF"
- normalRange: [1.5, 2.5]
- levels (5):
  - `−∞ → 1.0`: "Parasympathetic dominant (very relaxed)", blue
  - `1.0 → 1.5`: "Mild parasympathetic", green
  - `1.5 → 2.5`: "Ideal balance", green
  - `2.5 → 10.0`: "Sympathetic dominant (active/tense)", orange
  - `10.0 → +∞`: "Severe stress", red
- reference: "Task Force of ESC/NASPE, 1996; Shaffer & Ginsberg, 2017"

## Next steps
1. Agent C: rewrite `ppgIndexThresholds` in `src/lib/indexThresholds.ts` using the data above. Preserve EEG thresholds (already rewritten). PPG must export all 13 keys: `bpm`, `spo2`, `hrMax`, `hrMin`, `ppgStressIndex`, `sdnn`, `rmssd`, `sdsd`, `pnn50`, `pnn20`, `avnn`, `lfPower`, `hfPower`, `lfHfRatio`.
2. Agent D: add `<IndexTooltip />` to each PPG card in `PPGMetricsCards.tsx` using the `group relative` hover pattern. Reuse the existing `IndexTooltip` component from `src/components/eeg/IndexTooltip.tsx` (or move it to `src/components/common/IndexTooltip.tsx` if cleaner).

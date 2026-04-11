# EEG/PPG/ACC Index Normal Ranges & Guide Content

## Status
Plan only. Not yet implemented. Blocked on filter/μV scale discovery (separate task).

## Goal
Incorporate normal ranges, formulas, and interpretations (sourced from sdk.linkband.store's `indexGuides.ts`) into the dashboard as:
1. Inline tooltips or range hints on analysis cards
2. Extended README section 4 for student reference
3. Out-of-range visual cues (color shifts) on cards

## Reference data to incorporate

### EEG analysis indices

| Index (Korean) | Formula | Normal range | Unit |
|---|---|---|---|
| 집중력 (Focus) | β / (α + θ) | 1.8 – 2.4 | ratio |
| 이완도 (Relaxation) | α / (α + β) | 0.18 – 0.22 | ratio |
| 스트레스 (Stress) | (β + γ) / (α + θ) | 3.0 – 4.0 | ratio |
| 좌우뇌 균형 (Hemispheric Balance) | (α_L − α_R) / (α_L + α_R) | −0.1 – 0.1 | ratio |
| 인지 부하 (Cognitive Load) | θ / α | 0.3 – 0.8 | ratio |
| 정서 안정성 (Emotional Stability) | (α + θ) / γ | 0.4 – 0.8 | ratio |
| 총 파워 (Total Power) | Σ band powers | 850 – 1150 | **μV²** |

### PPG / HRV indices

| Index | Formula / method | Normal range | Unit |
|---|---|---|---|
| BPM | peak interval analysis | 60 – 100 | beats/min |
| SpO2 | Red/IR ratio (Beer–Lambert) | 95 – 100 | % |
| SDNN | √(Σ(RRᵢ − R̄R)² / (N−1)) | 30 – 100 | ms |
| RMSSD | √(Σ(RRᵢ₊₁ − RRᵢ)² / (N−1)) | 20 – 50 | ms |
| PNN50 | count(|ΔRR| > 50ms) / N × 100 | 10 – 30 | % |
| PNN20 | count(|ΔRR| > 20ms) / N × 100 | 20 – 60 | % |
| AVNN | Σ(RRᵢ) / N | 600 – 1000 | ms |
| LF | PSD integral 0.04–0.15 Hz | 200 – 1200 | ms² |
| HF | PSD integral 0.15–0.4 Hz | 80 – 4000 | ms² |
| LF/HF | LF / HF | 1.0 – 10.0 (balance 1.5–2.5) | ratio |
| Stress (PPG) | weighted normalized HRV | 0.30 – 0.70 | normalized 0–1 |
| SDSD | √(Σ((ΔRR) − mean_Δ)² / (N−1)) | 15 – 40 | ms |
| HR Max | max of 2-min moving window | 80 – 150 | bpm |
| HR Min | min of 2-min moving window | 50 – 80 | bpm |

### ACC indices

| Index | Formula / method | Normal range | Unit |
|---|---|---|---|
| Activity State | \|√(x²+y²+z²) − 1g\| thresholds | Stationary / Sitting / Walking / Running | classification |
| 안정성 (Stability) | 100 − (variability × norm) | 70 – 100 | % |
| 강도 (Intensity) | mean magnitude / max × 100 | 0 – 100 by zone | % |
| 균형 (Balance) | 100 − \|X% − Y%\| × 200 | 60 – 100 | % |
| Average Movement | mean(\|\|a\|\| − 1g) | 0 – 0.6+ by activity | g |
| Std Movement | stddev of magnitude | 0 – 0.6+ | g |
| Max Movement | max(\|\|a\|\| − 1g) | 0 – 2+ | g |

## Target implementation files

- `src/lib/indexGuides.ts` (new) — constant table with ranges + formulas + refs
- `src/components/eeg/IndexCards.tsx` — use ranges for color bands / tooltips
- `src/components/ppg/PPGMetricsCards.tsx` — same
- `src/components/acc/MotionCards.tsx` — same
- `README.md` §4 — expand with normal ranges table

## Blocked by

**EEG raw values are in ADC counts with large DC offset, not μV.** sdk.linkband.store's `indexGuides.ts` references Total Power in **μV²**, so sdk's analysis pipeline internally converts to μV before computing band powers. Until we locate the conversion constant / filter code in sdk's JS (search target: `'eeg-filtered'` string literal, `StreamProcessor`, `ADD_DATA` dispatch), our computed indices would be on a different scale than the documented normal ranges — so range-based UI would be misleading.

**Unblock path**: find the filter + scale code in sdk, replicate in `sensorDataStore.ts` (or a new processing hook), then apply this plan.

## References

All content sourced from sdk.linkband.store `indexGuides.ts`. Academic refs embedded in each entry (Klimesch 1999, Bazanova & Vernon 2014, Task Force of ESC/NASPE 1996, Shaffer & Ginsberg 2017, etc.).

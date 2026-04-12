# Report: windows-compat-backend -- Windows Compatibility & Backend Guide

| Field | Value |
|---|---|
| Feature | windows-compat-backend |
| Scope | UI bugfix + Python backend Windows compatibility + README |
| Completed | 2026-04-12 |
| Commits | `4f0bad9`, `6d39665` |

## Executive Summary

### 1.1 Feature Overview

| Perspective | Description |
|---|---|
| Problem | 1) EEG IndexTooltip/Card opacity issues making UI unreadable 2) Python backend crashes on Windows due to emoji encoding (cp949) 3) README lacks student guide for backend setup |
| Solution | Restore theme token styling, remove excessive opacity, fix emoji encoding, expand README section 8 |
| Functional UX Effect | Tooltips and cards are clearly visible; Python server runs reliably on Windows; students can follow setup guide independently |
| Core Value | Cross-platform reliability for educational deployment |

### 1.2 Timeline

| Phase | Status | Notes |
|---|---|---|
| UI Fix | Done | IndexTooltip theme restoration + card opacity removal |
| Backend Fix | Done | Emoji crash fix (cp949) + SSE URL encoding fix |
| README | Done | Section 8 expanded: structure, data flow, Device ID, sensor data table |
| Local Test | Done | SSE data successfully received and printed via robot_controller.py |

### 1.3 Value Delivered

| Metric | Before | After |
|---|---|---|
| IndexTooltip readability | Hardcoded colors, blended with background | Theme tokens (`bg-bg-elevated`, `border-border-bright`) |
| Card opacity (no data) | `opacity-60` on entire card including tooltip | No opacity override, always readable |
| MetricCard description | `opacity-70` with hover effect | Always visible |
| Python server on Windows | Crash on startup (UnicodeEncodeError cp949) | Runs without error |
| SSE Device ID with `/` | URL encoding mismatch, silent connection failure | Direct URL construction, connects successfully |
| README student guide | 12 lines, minimal | 70+ lines with structure diagram, data flow, data table, REST API |

---

## 2. Changes Detail

### 2.1 UI Fixes (commit `4f0bad9`)

**IndexTooltip.tsx**
- Hardcoded `bg-[#1a1a2e]`, `border-gray-600`, `text-gray-*` replaced with theme tokens
- `bg-bg-card` changed to `bg-bg-elevated` for better contrast against card background

**IndexCards.tsx**
- Removed `opacity-60` class that made entire card (including tooltip) transparent when no data

**MetricCard.tsx**
- Removed `opacity-70 group-hover:opacity-100 transition-opacity` from description text

### 2.2 Backend Fixes (commit `6d39665`)

**server.py**
- All emoji characters (`✅❌🔄🚀🔌`) replaced with ASCII tags (`[OK][ERR][*][>>][WS]`) to prevent `UnicodeEncodeError` on Windows cp949
- SSE URL changed from `httpx params={}` (auto-encodes `/` to `%2F`) to direct string construction
- Added `httpx.Timeout(10.0, read=None)` for proper connect timeout with unlimited read
- Added debug logging for SSE connection attempts
- Added `traceback.print_exc()` for better error visibility

**robot_controller.py**
- Added default EEG/PPG data output in `on_sensor_data()` so data is visible on server start
- Changed labels from Korean to English to avoid cp949 encoding issues

**.gitignore**
- Added `__pycache__/` and `sensor_data_log/`

### 2.3 README.md

Section 8 expanded from basic 3-step guide to comprehensive student guide:
- Backend file structure diagram
- Data flow diagram (SSE -> server.py -> robot_controller.py)
- Device ID configuration instructions
- Full code example with EEG + PPG
- Sensor data field reference table (9 fields)
- REST API endpoint documentation

---

## 3. Issues Discovered

| Issue | Severity | Resolution |
|---|---|---|
| Windows cp949 cannot encode emoji | Critical | Replaced all emoji with ASCII |
| `httpx params={}` encodes `/` in Device ID | Critical | Direct URL string construction |
| `server.py reload=True` suppresses print output | Minor | Documented; use `reload=False` for debugging |
| EEG values all 0.00 during test | Expected | Headband not worn during test session |

---

## 4. Lessons Learned

1. **Windows cp949 encoding**: Any Python code that runs on Windows must avoid emoji in `print()`. Use ASCII-safe log prefixes like `[OK]`, `[ERR]`.
2. **httpx URL encoding**: When Device IDs contain special characters (`/`, `+`, `=`), avoid `params={}` and construct URLs directly.
3. **uvicorn reload mode**: `reload=True` can suppress stdout from async tasks. Use `reload=False` + `-u` flag for debugging.
4. **Theme tokens vs hardcoded colors**: Always use CSS custom property tokens (`bg-bg-*`, `text-text-*`) instead of hardcoded hex values to maintain theme consistency.

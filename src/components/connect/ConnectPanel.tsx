import { useState, useRef, useEffect } from 'react'
import { useSSEConnection } from '../../hooks/useSSEConnection'

const URL_HINT = 'https://broadcast-server-506664317461.us-central1.run.app/subscribe?deviceId=YOUR_DEVICE_ID'
const STORAGE_KEY = 'sensor-dashboard:last-sse-url'

export function ConnectPanel() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const panelRef = useRef<HTMLDivElement>(null)
  const { connected, isMock, error, connect, disconnect } = useSSEConnection()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleConnect = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    try {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
    connect(trimmed)
    setOpen(false)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border cursor-pointer transition-all duration-300 ${
          connected
            ? 'border-teal/30 bg-teal/10 text-teal'
            : 'border-coral/30 bg-coral/8 text-coral'
        }`}
        onClick={() => setOpen(!open)}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            connected
              ? 'bg-teal shadow-[0_0_6px_var(--color-teal)] animate-[pulse-dot_2s_ease-in-out_infinite]'
              : 'bg-coral'
          }`}
        />
        {connected ? 'Connected' : 'Connect'}
        {connected && isMock && (
          <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-yellow/15 text-yellow border border-yellow/30 ml-0.5">
            MOCK
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2.5 right-0 w-[400px] bg-bg-card border border-border-bright rounded-xl p-4 z-50 flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.1em]">
            SSE Connection
          </div>
          <input
            className="w-full px-3 py-2.5 rounded-lg border border-border-bright bg-bg-base text-text-primary text-xs font-mono outline-none transition-colors duration-200 focus:border-teal disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-muted"
            type="text"
            placeholder={URL_HINT}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            disabled={connected}
            autoFocus
          />
          {error && (
            <div className="px-3 py-2 rounded-lg bg-coral/10 border border-coral/30 text-coral text-xs">
              {error}
            </div>
          )}
          {connected ? (
            <button
              className="px-4 py-2 rounded-lg border-none text-xs font-semibold cursor-pointer transition-all duration-200 bg-coral text-bg-base hover:brightness-115"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded-lg border-none text-xs font-semibold cursor-pointer transition-all duration-200 bg-teal text-bg-base hover:brightness-115 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleConnect}
              disabled={!url.trim()}
            >
              Connect
            </button>
          )}
        </div>
      )}
    </div>
  )
}

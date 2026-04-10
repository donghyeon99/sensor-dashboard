import { ConnectPanel } from '../connect/ConnectPanel'

export function Header() {
  return (
    <header className="flex justify-between items-center px-7 py-4 bg-bg-card/90 border-b border-border backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3.5">
        <div className="w-8 h-8 bg-gradient-to-br from-teal to-purple rounded-lg flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2C5.13 2 2 5.13 2 9s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 2c.93 0 1.82.2 2.62.55L4.55 11.62A4.97 4.97 0 0 1 4 9c0-2.76 2.24-5 5-5zm0 10a4.97 4.97 0 0 1-2.62-.55l7.07-7.07c.35.8.55 1.69.55 2.62 0 2.76-2.24 5-5 5z" fill="white" />
          </svg>
        </div>
        <div>
          <div className="text-[17px] font-semibold text-text-primary tracking-tight">
            LuxAcademy Sensor Dashboard
          </div>
          <div className="text-xs text-text-secondary mt-px">
            Brain-Computer Interface Monitor
          </div>
        </div>
      </div>
      <ConnectPanel />
    </header>
  )
}

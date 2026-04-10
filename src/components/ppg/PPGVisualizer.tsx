import { PPGRawChart } from './PPGRawChart'
import { BpmChart } from './BpmChart'
import { SpO2Chart } from './SpO2Chart'
import { PPGMetricsCards } from './PPGMetricsCards'

export function PPGVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">❤️ PPG 맥파 분석</h2>
        <p className="text-text-secondary text-sm">광용적맥파(PPG) 센서의 심박수, 산소포화도를 실시간 시각화합니다.</p>
      </div>

      {/* PPG Raw (IR/Red) */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">PPG 원시 신호 (IR / Red)</h3>
        <p className="text-xs text-text-secondary mb-4">적외선(IR) 및 적색(Red) 광원 신호</p>
        <PPGRawChart />
      </div>

      {/* BPM | SpO2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">💓 심박수 (BPM) 추이</h3>
          <p className="text-xs text-text-secondary mb-4">실시간 심박수 변화 그래프</p>
          <BpmChart />
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🫁 산소포화도 (SpO2) 추이</h3>
          <p className="text-xs text-text-secondary mb-4">실시간 혈중 산소 농도 변화</p>
          <SpO2Chart />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">❤️ PPG 분석 지표</h3>
        <p className="text-xs text-text-secondary mb-4">심박수, 산소포화도 실시간 요약</p>
        <PPGMetricsCards />
      </div>
    </div>
  )
}

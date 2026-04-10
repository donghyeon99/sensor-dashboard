import { PPGRawChart } from './PPGRawChart'
import { BpmChart } from './BpmChart'
import { SpO2Chart } from './SpO2Chart'
import { PPGMetricsCards } from './PPGMetricsCards'

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-coral/10 text-coral text-[10px] font-mono border border-coral/20">
      {text}
    </span>
  )
}

export function PPGVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-3">❤️ PPG 맥파 분석</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          PPG(광용적맥파)는 빛을 이용해 혈류 변화를 측정하는 방식입니다.
          LinkBand는 이마의 <strong className="text-purple">IR(적외선)</strong>과 <strong className="text-coral">Red(적색)</strong> 두 광원으로 심박수와 산소포화도를 측정합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="2광원 (IR, Red)" />
          <InfoBadge text="50Hz 샘플링" />
          <InfoBadge text="BPM + SpO2 + HRV" />
        </div>
      </div>

      {/* PPG Raw */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">PPG 원시 신호</h3>
        <p className="text-xs text-text-muted mb-4">
          IR(적외선) — 혈관 깊숙한 혈류 감지 | Red(적색) — 표면 혈류 감지. 두 신호의 비율로 산소포화도를 계산
        </p>
        <PPGRawChart />
      </div>

      {/* BPM | SpO2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">💓 심박수 (BPM) 추이</h3>
          <p className="text-xs text-text-muted mb-4">
            BPM = Beats Per Minute (분당 심박 수). 정상 범위: 60~100 BPM
          </p>
          <BpmChart />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🫁 산소포화도 (SpO2) 추이</h3>
          <p className="text-xs text-text-muted mb-4">
            SpO2 = 혈중 산소 농도 (%). 정상: 95% 이상. 95% 미만이면 저산소 상태
          </p>
          <SpO2Chart />
        </div>
      </div>

      {/* Metrics + HRV */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">❤️ 심혈관 지표</h3>
        <p className="text-xs text-text-muted mb-4">
          실시간 심박수, 산소포화도 및 HRV(심박변이도) 요약.
          HRV는 심장 박동 간격의 변동성으로, 높을수록 자율신경계가 건강한 상태
        </p>
        <PPGMetricsCards />
      </div>
    </div>
  )
}

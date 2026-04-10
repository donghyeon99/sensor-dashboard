import { RawDataChart } from './RawDataChart'
import { SignalQualityChart } from './SignalQualityChart'
import { PowerSpectrumChart } from './PowerSpectrumChart'
import { BandPowerCards } from './BandPowerCards'
import { IndexCards } from './IndexCards'

function InfoBadge({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-teal/10 text-teal text-[10px] font-mono border border-teal/20">
      {text}
    </span>
  )
}

export function EEGVisualizer() {
  return (
    <div className="space-y-6">
      {/* Title + 설명 */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-3">🧠 EEG 뇌파 분석</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          뇌파(EEG)는 뇌의 전기적 활동을 측정한 신호입니다.
          LinkBand는 이마의 <strong className="text-teal">FP1(왼쪽)</strong>과 <strong className="text-yellow">FP2(오른쪽)</strong> 두 전극으로 뇌파를 측정합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <InfoBadge text="2채널 (FP1, FP2)" />
          <InfoBadge text="250Hz 샘플링" />
          <InfoBadge text="주파수 범위: 1-45Hz" />
        </div>
      </div>

      {/* Ch1 Raw | Ch2 Raw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch1 원시 신호 (FP1)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">왼쪽 이마 전극에서 측정된 실시간 전압 파형 (단위: μV)</p>
          <RawDataChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch2 원시 신호 (FP2)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">오른쪽 이마 전극에서 측정된 실시간 전압 파형 (단위: μV)</p>
          <RawDataChart channel="ch2" />
        </div>
      </div>

      {/* SQI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch1 신호 품질 (SQI)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">
            SQI = Signal Quality Index. 전극이 피부에 잘 접촉되어 있는지 나타냄. 100%에 가까울수록 좋음
          </p>
          <SignalQualityChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <h3 className="text-base font-semibold text-text-primary">Ch2 신호 품질 (SQI)</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 ml-5">
            SQI = Signal Quality Index. 전극이 피부에 잘 접촉되어 있는지 나타냄. 100%에 가까울수록 좋음
          </p>
          <SignalQualityChart channel="ch2" />
        </div>
      </div>

      {/* Power Spectrum | Band Power */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🌈 파워 스펙트럼</h3>
          <p className="text-xs text-text-muted mb-4">
            뇌파를 주파수별로 분해한 그래프. 어떤 주파수의 뇌파가 강한지 보여줍니다 (1~45Hz)
          </p>
          <PowerSpectrumChart />
        </div>
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🎯 주파수 밴드 파워</h3>
          <p className="text-xs text-text-muted mb-4">
            뇌파를 5개 대역(델타~감마)으로 나눈 세기. Ch1(좌뇌)과 Ch2(우뇌)를 비교할 수 있음
          </p>
          <BandPowerCards />
        </div>
      </div>

      {/* EEG Index Cards */}
      <div className="bg-bg-card border border-border rounded-2xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">🧠 뇌파 분석 지수</h3>
        <p className="text-xs text-text-muted mb-4">
          뇌파 주파수 조합으로 계산된 상태 지표. 각 지수의 색상이 현재 상태를 나타냅니다
        </p>
        <IndexCards />
      </div>
    </div>
  )
}

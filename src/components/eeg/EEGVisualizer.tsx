import { RawDataChart } from './RawDataChart'
import { SignalQualityChart } from './SignalQualityChart'
import { PowerSpectrumChart } from './PowerSpectrumChart'
import { BandPowerCards } from './BandPowerCards'
import { IndexCards } from './IndexCards'

export function EEGVisualizer() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">🧠 EEG 뇌파 분석</h2>
        <p className="text-text-secondary text-sm">실시간 뇌파 신호 처리 및 분석 결과를 시각화합니다.</p>
      </div>

      {/* Ch1 Raw | Ch2 Raw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">Ch1 EEG 신호 (FP1)</h3>
          <p className="text-xs text-text-secondary mb-4">채널 1 (FP1) 실시간 원시 신호</p>
          <RawDataChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">Ch2 EEG 신호 (FP2)</h3>
          <p className="text-xs text-text-secondary mb-4">채널 2 (FP2) 실시간 원시 신호</p>
          <RawDataChart channel="ch2" />
        </div>
      </div>

      {/* Ch1 SQI | Ch2 SQI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">Ch1 신호 품질 (SQI)</h3>
          <p className="text-xs text-text-secondary mb-4">채널 1 (FP1) 전극 신호 품질 모니터링</p>
          <SignalQualityChart channel="ch1" />
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">Ch2 신호 품질 (SQI)</h3>
          <p className="text-xs text-text-secondary mb-4">채널 2 (FP2) 전극 신호 품질 모니터링</p>
          <SignalQualityChart channel="ch2" />
        </div>
      </div>

      {/* Power Spectrum | Band Power */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🌈 파워 스펙트럼 (1-45Hz)</h3>
          <p className="text-xs text-text-secondary mb-4">Ch1, Ch2 주파수 도메인 분석 결과</p>
          <PowerSpectrumChart />
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">🎯 주파수 밴드 파워</h3>
          <p className="text-xs text-text-secondary mb-4">델타, 세타, 알파, 베타, 감마파 실시간 분석</p>
          <BandPowerCards />
        </div>
      </div>

      {/* EEG Index Cards (full width) */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-text-primary mb-1">🧠 EEG 분석 지수</h3>
        <p className="text-xs text-text-secondary mb-4">실시간 뇌파 분석 결과 — 집중력, 이완도, 스트레스 등 7개 지수</p>
        <IndexCards />
      </div>
    </div>
  )
}

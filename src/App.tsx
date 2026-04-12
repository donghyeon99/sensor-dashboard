import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { VisualizerHeader } from './components/visualizer/VisualizerHeader'
import { Tabs, TabsList, TabsTrigger } from './components/shadcn/tabs'
import { EEGVisualizer } from './components/eeg/EEGVisualizer'
import { PPGVisualizer } from './components/ppg/PPGVisualizer'
import { ACCVisualizer } from './components/acc/ACCVisualizer'

const tabTriggerClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=inactive]:bg-neutral-700 data-[state=inactive]:text-gray-300 data-[state=inactive]:border data-[state=inactive]:border-neutral-600 hover:bg-neutral-600 hover:text-white'

function App() {
  const [tab, setTab] = useState('eeg')

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <Header />
      <div className="sticky top-0 z-40 bg-bg-base border-b border-border px-6 py-4 space-y-3">
        <div className="max-w-7xl mx-auto">
          <VisualizerHeader />
        </div>
        <div className="max-w-7xl mx-auto">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10 items-center justify-center rounded-lg bg-neutral-800 p-1 text-muted-foreground gap-1 grid w-full grid-cols-3">
              <TabsTrigger value="eeg" className={tabTriggerClass}>🧠 EEG</TabsTrigger>
              <TabsTrigger value="ppg" className={tabTriggerClass}>❤️ PPG</TabsTrigger>
              <TabsTrigger value="acc" className={tabTriggerClass}>📱 ACC</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <main className="flex-1 px-6 pt-6 pb-6">
        <div className="max-w-7xl mx-auto pb-20">
          {tab === 'eeg' && <EEGVisualizer />}
          {tab === 'ppg' && <PPGVisualizer />}
          {tab === 'acc' && <ACCVisualizer />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App

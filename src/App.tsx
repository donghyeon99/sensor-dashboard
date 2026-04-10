import { useState } from 'react'
import { Header } from './components/layout/Header'
import { CategoryTabs } from './components/layout/CategoryTabs'
import { Footer } from './components/layout/Footer'
import { EEGVisualizer } from './components/eeg/EEGVisualizer'
import { PPGVisualizer } from './components/ppg/PPGVisualizer'
import { ACCVisualizer } from './components/acc/ACCVisualizer'
import type { Category } from './types/sensor'

function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('eeg')

  const renderVisualizer = () => {
    switch (activeCategory) {
      case 'eeg': return <EEGVisualizer />
      case 'ppg': return <PPGVisualizer />
      case 'acc': return <ACCVisualizer />
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <Header />
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
      <main className="flex-1 p-6 space-y-6">
        {renderVisualizer()}
      </main>
      <Footer />
    </div>
  )
}

export default App

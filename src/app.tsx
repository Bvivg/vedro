import { LayersProvider } from './layers/store.ts'
import { LayerPanel } from './ui/layer-panel.tsx'
import { MapPreview } from './ui/map-preview.tsx'

const App = () => (
  <LayersProvider>
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-12">
      <h1 className="mb-5 text-3xl font-semibold text-gray-900 dark:text-gray-100">Слои</h1>
      <MapPreview />
      <LayerPanel />
    </main>
  </LayersProvider>
)

export default App

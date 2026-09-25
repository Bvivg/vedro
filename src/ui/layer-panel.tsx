import { LAYER_IDS } from '../layers/model.ts'
import { LayerRow } from './layer-controls.tsx'

export const LayerPanel = () => (
  <ul
    className="rounded-xl border border-gray-200 bg-white px-4 py-1 dark:border-zinc-700 dark:bg-zinc-800/60"
    aria-label="Слои"
  >
    {LAYER_IDS.map((id) => (
      <LayerRow key={id} id={id} />
    ))}
  </ul>
)

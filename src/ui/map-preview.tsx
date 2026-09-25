import {memo} from 'react'
import {LAYER_IDS, LayerId, LoadStatus} from '../layers/model.ts'
import {useLayer} from '../layers/store.ts'

const CELL_SIZE = 12


const MapLayer = memo(({id}: { id: LayerId }) => {
  const enabled = useLayer(id, (layer) => layer.enabled)
  const opacity = useLayer(id, (layer) => layer.opacity)
  const load = useLayer(id, (layer) => layer.load)
  const data = load.status === LoadStatus.Success ? load.data : null
  const pixelRatio = Math.max(1, Math.round(window.devicePixelRatio))

  if (!enabled || !data) return null

  return (
    <>
      <pre>
        {JSON.stringify({
          id,
          opacity,
          data,
          size: {
            width: data.width * CELL_SIZE * pixelRatio,
            height: data.height * CELL_SIZE * pixelRatio,
          }
        }, null, 2)}
      </pre>
    </>

  )

})


export const MapPreview = () => (
  <div
    className=" rounded-xl border border-gray-600 p-4 mb-4 h-96 overflow-auto"
  >
    {LAYER_IDS.map((id) => (
      <MapLayer key={id} id={id}/>
    ))}

  </div>
)

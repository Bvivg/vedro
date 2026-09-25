import {memo, useEffect, useRef} from 'react'
import {LAYER_IDS, LayerId, LoadStatus, type LayerData} from '../layers/model.ts'
import {useLayer} from '../layers/store.ts'

const CELL_SIZE = 12

type Rgba = [number, number, number, number]
type Painter = (ctx: CanvasRenderingContext2D, data: LayerData) => void

const TEMPERATURE_STOPS: Rgba[] = [
  [49, 54, 149, 255],
  [69, 117, 180, 255],
  [116, 173, 209, 255],
  [254, 224, 144, 255],
  [244, 109, 67, 255],
  [165, 0, 38, 255],
]

const WIND_COLOR = 'rgb(235 245 255)'

const interpolate = (stops: Rgba[], value: number): Rgba => {
  const scaled = Math.min(1, Math.max(0, value)) * (stops.length - 1)
  const index = Math.min(Math.floor(scaled), stops.length - 2)
  const from = stops[index]
  const to = stops[index + 1]
  if (!from || !to) return [0, 0, 0, 0]
  const mix = (a: number, b: number) => Math.round(a + (b - a) * (scaled - index))
  return [mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2]), mix(from[3], to[3])]
}

const valueAt = (data: LayerData, x: number, y: number) => data.values[y * data.width + x] ?? 0

const paintField = (ctx: CanvasRenderingContext2D, data: LayerData, color: (value: number) => Rgba) => {
  const image = new ImageData(data.width, data.height)
  data.values.forEach((value, index) => image.data.set(color(value), index * 4))
  const buffer = document.createElement('canvas')
  buffer.width = data.width
  buffer.height = data.height
  buffer.getContext('2d')?.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(buffer, 0, 0, data.width * CELL_SIZE, data.height * CELL_SIZE)
}

const paintWind: Painter = (ctx, data) => {
  ctx.strokeStyle = WIND_COLOR
  ctx.fillStyle = WIND_COLOR
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  for (let y = 1; y < data.height; y += 3) {
    for (let x = 1; x < data.width; x += 3) {
      const value = valueAt(data, x, y)
      const angle = value * Math.PI * 2
      const length = CELL_SIZE * (0.8 + value * 1.6)
      const cx = x * CELL_SIZE + CELL_SIZE / 2
      const cy = y * CELL_SIZE + CELL_SIZE / 2
      const dx = (Math.cos(angle) * length) / 2
      const dy = (Math.sin(angle) * length) / 2
      ctx.beginPath()
      ctx.moveTo(cx - dx, cy - dy)
      ctx.lineTo(cx + dx, cy + dy)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + dx, cy + dy, 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const PAINTERS: Record<LayerId, Painter> = {
  [LayerId.Temperature]: (ctx, data) =>
    paintField(ctx, data, (value) => interpolate(TEMPERATURE_STOPS, value)),
  [LayerId.Wind]: paintWind,
  [LayerId.Insolation]: (ctx, data) =>
    paintField(ctx, data, (value) => [255, 196, 40, Math.round(value * 230)]),
}

const MapLayer = memo(({id}: { id: LayerId }) => {
  const enabled = useLayer(id, (layer) => layer.enabled)
  const opacity = useLayer(id, (layer) => layer.opacity)
  const load = useLayer(id, (layer) => layer.load)
  const canvas = useRef<HTMLCanvasElement>(null)
  const data = load.status === LoadStatus.Success ? load.data : null
  const pixelRatio = Math.max(1, Math.round(window.devicePixelRatio))

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !data) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.scale(pixelRatio, pixelRatio)
    PAINTERS[id](ctx, data)
  }, [id, data, pixelRatio])

  if (!enabled || !data) return null

  return (
    <>
      <pre>
        {JSON.stringify({
          id,
          opacity,
          size: {
            width: data.width * CELL_SIZE * pixelRatio,
            height: data.height * CELL_SIZE * pixelRatio,
          }
        }, null, 2)}
      </pre>
    </>

  )
  // return (
  //   <canvas
  //     ref={canvas}
  //     className="absolute inset-0 size-full"
  //     width={data.width * CELL_SIZE * pixelRatio}
  //     height={data.height * CELL_SIZE * pixelRatio}
  //     style={{ opacity }}
  //     data-layer={id}
  //   />
  // )
})


export const MapPreview = () => (
  <div
    className=" rounded-xl border border-gray-600 p-4 mb-4"
  >
    {LAYER_IDS.map((id) => (
      <MapLayer key={id} id={id}/>
    ))}

  </div>
)

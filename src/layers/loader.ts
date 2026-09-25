import type Vedro from 'vedro'
import { LoadStatus, type LayerData, type LayerId, type LayerState, type LayersStore } from './model.ts'

export type FetchLayer = (id: LayerId, signal: AbortSignal) => Promise<LayerData>

export interface LayerLoader {
  load: (id: LayerId) => void
  cancel: (id: LayerId) => void
  cancelAll: () => void
}

const GRID_WIDTH = 48
const GRID_HEIGHT = 32

const generateField = (): LayerData => {
  const blobs = Array.from({ length: 5 }, () => ({
    x: Math.random() * GRID_WIDTH,
    y: Math.random() * GRID_HEIGHT,
    radius: 5 + Math.random() * 10,
    weight: 0.4 + Math.random() * 0.6,
  }))
  const raw = Array.from({ length: GRID_WIDTH * GRID_HEIGHT }, (_, index) => {
    const x = index % GRID_WIDTH
    const y = Math.floor(index / GRID_WIDTH)
    return blobs.reduce((sum, blob) => {
      const distance = (x - blob.x) ** 2 + (y - blob.y) ** 2
      return sum + blob.weight * Math.exp(-distance / (2 * blob.radius ** 2))
    }, 0)
  })
  const max = Math.max(...raw)
  const min = Math.min(...raw)
  return {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    values: raw.map((value) => (value - min) / (max - min || 1)),
  }
}

export const createMockFetchLayer =
  (errorRate = 0.2): FetchLayer =>
  (_id, signal) =>
    new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      }
      const timer = setTimeout(
        () => {
          signal.removeEventListener('abort', onAbort)
          if (Math.random() < errorRate) {
            reject(new Error('Сервер вернул ошибку'))
          } else {
            resolve(generateField())
          }
        },
        300 + Math.random() * 1700,
      )
      signal.addEventListener('abort', onAbort, { once: true })
    })

export const patchLayer = (store: Vedro<LayersStore>, id: LayerId, patch: Partial<LayerState>) =>
  store.dispatch((state) => ({
    layers: { ...state.layers, [id]: { ...state.layers[id], ...patch } },
  }))

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const MAX_PARALLEL_REQUESTS = 4

export const createLayerLoader = (
  store: Vedro<LayersStore>,
  fetchLayer: FetchLayer = createMockFetchLayer(),
): LayerLoader => {
  const active = new Map<LayerId, { requestId: number; controller: AbortController }>()
  const queue: LayerId[] = []
  let lastRequestId = 0

  const isCurrent = (id: LayerId, requestId: number) =>
    active.get(id)?.requestId === requestId && store.get('layers')[id].enabled

  const finish = (id: LayerId, patch: Partial<LayerState>) => {
    active.delete(id)
    patchLayer(store, id, patch)
    next()
  }

  const start = (id: LayerId) => {
    const requestId = ++lastRequestId
    const controller = new AbortController()
    active.set(id, { requestId, controller })

    fetchLayer(id, controller.signal).then(
      (data) => {
        if (isCurrent(id, requestId)) finish(id, { load: { status: LoadStatus.Success, data } })
      },
      (error: unknown) => {
        if (isAbortError(error) || !isCurrent(id, requestId)) return
        finish(id, { load: { status: LoadStatus.Error, error: errorMessage(error) } })
      },
    )
  }

  const next = () => {
    while (active.size < MAX_PARALLEL_REQUESTS) {
      const id = queue.shift()
      if (!id) return
      start(id)
    }
  }

  const cancel = (id: LayerId) => {
    const index = queue.indexOf(id)
    if (index !== -1) queue.splice(index, 1)
    active.get(id)?.controller.abort()
    active.delete(id)
    next()
  }

  const cancelAll = () => {
    queue.length = 0
    active.forEach(({ controller }) => controller.abort())
    active.clear()
  }

  const load = (id: LayerId) => {
    cancel(id)
    patchLayer(store, id, { load: { status: LoadStatus.Loading } })
    queue.push(id)
    next()
  }

  return { load, cancel, cancelAll }
}

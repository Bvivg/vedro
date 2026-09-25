import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createVedro } from 'vedro'
import { createLayerLoader, patchLayer, type LayerLoader } from './loader.ts'
import {
  createInitialState,
  LAYER_IDS,
  LoadStatus,
  type LayerId,
  type LayerState,
  type LayersStore,
} from './model.ts'

const { Provider, useStore } = createVedro<LayersStore>(createInitialState())

const LoaderContext = createContext<LayerLoader | null>(null)

const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const store = useStore()
  const [loader] = useState(() => createLayerLoader(store))

  useEffect(() => {
    LAYER_IDS.filter((id) => store.get('layers')[id].enabled).forEach(loader.load)
    return loader.cancelAll
  }, [store, loader])

  return createElement(LoaderContext.Provider, { value: loader }, children)
}

export const LayersProvider = ({ children }: { children: ReactNode }) =>
  createElement(Provider, null, createElement(LoaderProvider, null, children))

const useLayers = <T>(select: (layers: Record<LayerId, LayerState>) => T): T => {
  const store = useStore()
  const subscribe = useCallback((onChange: () => void) => store.on('@state', onChange), [store])
  return useSyncExternalStore(subscribe, () => select(store.get('layers')))
}

export const useLayer = <T>(id: LayerId, select: (layer: LayerState) => T): T =>
  useLayers((layers) => select(layers[id]))

export const useLayerActions = () => {
  const store = useStore()
  const loader = useContext(LoaderContext)
  if (!loader) throw new Error('useLayerActions must be used inside LayersProvider')

  return useMemo(
    () => ({
      toggleLayer: (id: LayerId) => {
        if (store.get('layers')[id].enabled) {
          loader.cancel(id)
          patchLayer(store, id, { enabled: false, load: { status: LoadStatus.Idle } })
        } else {
          patchLayer(store, id, { enabled: true })
          loader.load(id)
        }
      },
      setOpacity: (id: LayerId, opacity: number) =>
        patchLayer(store, id, { opacity: Math.min(1, Math.max(0, opacity)) }),
      retryLayer: (id: LayerId) => loader.load(id),
    }),
    [store, loader],
  )
}

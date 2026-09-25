export enum LayerId {
  Temperature = 'temperature',
  Wind = 'wind',
  Insolation = 'insolation',
}

export const LAYER_IDS = Object.values(LayerId)

export const LAYER_TITLES: Record<LayerId, string> = {
  [LayerId.Temperature]: 'Температура',
  [LayerId.Wind]: 'Ветер',
  [LayerId.Insolation]: 'Инсоляция',
}

export enum LoadStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export interface LayerData {
  width: number
  height: number
  values: number[]
}

export type LoadState =
  | { status: LoadStatus.Idle }
  | { status: LoadStatus.Loading }
  | { status: LoadStatus.Success; data: LayerData }
  | { status: LoadStatus.Error; error: string }

export interface LayerState {
  enabled: boolean
  opacity: number
  load: LoadState
}

export interface LayersStore {
  layers: Record<LayerId, LayerState>
}

export const createInitialState = (): LayersStore => {
  const layers = Object.fromEntries(
    LAYER_IDS.map((id) => [id, { enabled: true, opacity: 1, load: { status: LoadStatus.Idle } }]),
  ) as Record<LayerId, LayerState>
  return { layers }
}

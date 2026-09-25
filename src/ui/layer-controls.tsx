import { memo, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { LAYER_TITLES, LoadStatus, type LayerId } from '../layers/model.ts'
import { useLayer, useLayerActions } from '../layers/store.ts'

interface LayerProps {
  id: LayerId
}

const LayerToggle = ({ id }: LayerProps) => {
  const enabled = useLayer(id, (layer) => layer.enabled)
  const { toggleLayer } = useLayerActions()

  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-gray-900 dark:text-gray-100">
      <span className="relative flex size-4 shrink-0">
        <input
          type="checkbox"
          className="peer size-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-600 dark:bg-zinc-800 dark:checked:border-blue-500 dark:checked:bg-blue-500"
          checked={enabled}
          onChange={() => toggleLayer(id)}
        />
        <svg
          className="pointer-events-none absolute inset-0 hidden size-4 stroke-white peer-checked:block"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 8.5l2.5 2.5L12 5.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {LAYER_TITLES[id]}
    </label>
  )
}

const OpacitySlider = ({ id }: LayerProps) => {
  const opacity = useLayer(id, (layer) => layer.opacity)
  const enabled = useLayer(id, (layer) => layer.enabled)
  const { setOpacity } = useLayerActions()
  const [draft, setDraft] = useState<number | null>(null)
  const pending = useRef(opacity)
  const frame = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    pending.current = value
    setDraft(value)
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      setOpacity(id, pending.current)
      setDraft(null)
    })
  }

  const value = draft ?? opacity

  return (
    <label className="flex items-center gap-2">
      <input
        type="range"
        className="min-w-0 flex-1 accent-blue-600 disabled:opacity-40"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={!enabled}
        aria-label={`Прозрачность: ${LAYER_TITLES[id]}`}
        onChange={onChange}
      />
      <span className="w-[4ch] text-right tabular-nums">{Math.round(value * 100)}%</span>
    </label>
  )
}

const LayerStatus = ({ id }: LayerProps) => {
  const load = useLayer(id, (layer) => layer.load)
  const { retryLayer } = useLayerActions()

  if (load.status === LoadStatus.Loading) {
    return (
      <span
        className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent"
        role="status"
        aria-label="Загрузка"
      />
    )
  }

  if (load.status === LoadStatus.Error) {
    return (
      <button
        type="button"
        className="grid size-7 cursor-pointer place-items-center rounded-md text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:bg-red-400/10"
        title={`${load.error}. Повторить`}
        aria-label="Повторить загрузку"
        onClick={() => retryLayer(id)}
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    )
  }

  if (load.status === LoadStatus.Success) {
    return (
      <svg
        className="size-4 text-green-600 dark:text-green-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Загружено"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }

  return null
}

export const LayerRow = memo(({ id }: LayerProps) => (
  <li className="grid grid-cols-[130px_minmax(0,1fr)_1.75rem] items-center gap-x-4 border-gray-200 py-3 not-first:border-t dark:border-zinc-700">
    <LayerToggle id={id} />
    <OpacitySlider id={id} />
    <span className="grid place-items-center">
      <LayerStatus id={id} />
    </span>
  </li>
))

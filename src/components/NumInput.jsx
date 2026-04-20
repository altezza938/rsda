import { useState, useEffect, useRef, useContext, createContext } from 'react'

export const SliderCtx = createContext(false)

export function NumInput({ label, unit, value, onChange, min, max, step = 0.01, tooltip, warning, wide }) {
  const showSliders = useContext(SliderCtx)
  const [raw, setRaw] = useState(value != null ? String(value) : '')
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setRaw(value != null ? String(value) : '')
  }, [value])

  const numVal = parseFloat(raw)
  const isWarn = warning || (!isNaN(numVal) && (
    (min !== undefined && numVal < min) || (max !== undefined && numVal > max)
  ))

  const sliderVal = isNaN(numVal) ? (min ?? 0)
    : Math.min(Math.max(numVal, min ?? -Infinity), max ?? Infinity)

  return (
    <label className={`block ${wide ? 'col-span-2' : ''}`} title={tooltip}>
      <span className="text-xs text-gray-500 flex items-center gap-1">
        {label}
        {tooltip && <span className="text-gray-400 cursor-help text-[10px]" title={tooltip}>ⓘ</span>}
      </span>
      <div className={`flex items-center border rounded mt-0.5 overflow-hidden ${isWarn ? 'border-fail' : 'border-gray-300'}`}>
        <input
          type="number" value={raw} step={step} min={min} max={max}
          onFocus={() => { focused.current = true }}
          onChange={e => {
            setRaw(e.target.value)
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(n)
          }}
          onBlur={() => {
            focused.current = false
            const n = parseFloat(raw)
            if (isNaN(n)) setRaw(value != null ? String(value) : '0')
            else onChange(n)
          }}
          className="flex-1 px-2 py-1 text-sm focus:outline-none w-0"
        />
        {unit && <span className="px-1.5 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">{unit}</span>}
      </div>
      {showSliders && min !== undefined && max !== undefined && (
        <input type="range" min={min} max={max} step={step} value={sliderVal}
          onChange={e => { const n = parseFloat(e.target.value); setRaw(String(n)); onChange(n) }}
          className="w-full mt-1 h-1 cursor-pointer rounded-full"
          style={{ accentColor: '#2D6A4F' }}
        />
      )}
    </label>
  )
}

export function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-primary bg-pale hover:bg-secondary/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <span className="text-gray-400 text-[10px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-3 py-2 grid grid-cols-2 gap-2">{children}</div>}
    </div>
  )
}

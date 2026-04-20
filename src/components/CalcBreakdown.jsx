import { useState } from 'react'

export function CalcBreakdown({ title = 'Calculation Breakdown', children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border border-gray-200 rounded overflow-hidden text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors font-semibold text-gray-600"
      >
        <span>▸ {title}</span>
        <span className="text-gray-400">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="px-3 py-2 font-mono text-[11px] leading-relaxed bg-white text-gray-700 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  )
}

export function CalcLine({ label, expr, result, pass, unit = '' }) {
  const passColour = pass === true ? 'text-pass font-bold' : pass === false ? 'text-fail font-bold' : ''
  return (
    <div>
      {label && <div className="text-gray-400">{label}</div>}
      <div>{expr}</div>
      {result !== undefined && (
        <div className={`ml-4 ${passColour}`}>
          = {result}{unit && ` ${unit}`}
          {pass === true && ' ✓'}{pass === false && ' ✗'}
        </div>
      )}
    </div>
  )
}

/**
 * Reusable "Suggested Design" panel — shows optimization results
 * with per-check status and an apply button.
 */

export function SuggestRow({ label, current, suggested, unit = '', pass, onApply }) {
  const improved = suggested != null && suggested !== current
  return (
    <div className={`rounded border px-2 py-1.5 text-xs ${pass ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold text-gray-700">{label}</span>
        {pass
          ? <span className="text-[10px] text-pass font-bold">✓ OK</span>
          : <span className="text-[10px] text-fail font-bold">✗ FAILS</span>}
      </div>
      {!pass && suggested != null && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500">
            Need <span className="font-mono font-bold text-amber-700">{suggested} {unit}</span>
            <span className="text-gray-400 ml-1">(now: {typeof current === 'number' ? current.toFixed(3) : current})</span>
          </span>
          {onApply && (
            <button onClick={onApply}
              className="ml-2 px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold hover:bg-green-800 shrink-0">
              Apply
            </button>
          )}
        </div>
      )}
      {!pass && suggested == null && (
        <div className="text-fail text-[10px]">No solution found in range — review geometry or soil parameters.</div>
      )}
    </div>
  )
}

export function SuggestPanel({ title = 'Design Suggestions', children, allPass }) {
  return (
    <div className={`mt-3 rounded-lg border-2 p-3 ${allPass ? 'border-pass bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-700">{title}</div>
        {allPass && <span className="text-[10px] text-pass font-bold px-2 py-0.5 bg-green-100 rounded">All checks pass ✓</span>}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

export function OptimizeResult({ label, value, unit, note }) {
  return (
    <div className="rounded border border-primary/30 bg-pale px-3 py-2 text-xs">
      <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
      <div className="text-lg font-bold text-primary font-mono">
        {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </div>
      {note && <div className="text-[10px] text-gray-400 mt-0.5">{note}</div>}
    </div>
  )
}

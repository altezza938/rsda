import { useRef, useEffect, useState } from 'react'

export function FOSCard({ label, value, threshold, level = 'SLS', wide }) {
  const pass = isFinite(value) ? value >= threshold : true
  const [anim, setAnim] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) { setAnim(true); prev.current = value }
    const t = setTimeout(() => setAnim(false), 350)
    return () => clearTimeout(t)
  }, [value])

  const tag = level === 'ULS' ? 'bg-uls text-white' : 'bg-sls text-white'

  return (
    <div className={`rounded-lg border-2 p-3 transition-all ${pass ? 'border-pass' : 'border-fail'} ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide leading-tight">{label}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1 ${tag}`}>{level}</span>
      </div>
      <div className={`text-2xl font-bold mb-0.5 ${pass ? 'text-pass' : 'text-fail'} ${anim ? 'scale-110 transition-transform' : ''}`}>
        {isFinite(value) ? value.toFixed(3) : '∞'}
      </div>
      <div className="text-xs text-gray-400">Required ≥ {threshold.toFixed(1)}</div>
      <div className={`mt-1 text-xs font-bold ${pass ? 'text-pass' : 'text-fail'}`}>
        {pass ? '✓ PASS' : '✗ FAIL'}
      </div>
    </div>
  )
}

export function FOSGrid({ children }) {
  return <div className="grid grid-cols-2 gap-2 mb-4">{children}</div>
}

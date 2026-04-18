import { useRef, useEffect, useState } from 'react'
import { GG1_THRESHOLDS } from '../calculations/constants'

function FOSCard({ label, value, threshold, level = 'SLS', animKey }) {
  const pass = value >= threshold
  const [anim, setAnim] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) { setAnim(true); prev.current = value }
    const t = setTimeout(() => setAnim(false), 400)
    return () => clearTimeout(t)
  }, [value])

  const tag = level === 'SLS'
    ? 'bg-sls text-white'
    : 'bg-uls text-white'

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${pass ? 'border-pass' : 'border-fail'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${tag}`}>{level}</span>
      </div>
      <div className={`text-3xl font-bold mb-1 ${pass ? 'text-pass' : 'text-fail'} ${anim ? 'animate-pulse-val' : ''}`}>
        {isFinite(value) ? value.toFixed(3) : '∞'}
      </div>
      <div className="text-xs text-gray-500">Required ≥ {threshold.toFixed(1)}</div>
      <div className={`mt-2 text-xs font-bold flex items-center gap-1 ${pass ? 'text-pass' : 'text-fail'}`}>
        {pass ? '✓ PASS' : '✗ FAIL'}
      </div>
    </div>
  )
}

export default function FOSCards({ results, wallType }) {
  if (!results) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Enter parameters to compute FOS
      </div>
    )
  }

  if (wallType === 0 || wallType === 1) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <FOSCard label="FOS Sliding"    value={results.FOS_sliding}     threshold={GG1_THRESHOLDS.sliding.SLS}     level="SLS" />
        <FOSCard label="FOS Overturning" value={results.FOS_overturning} threshold={GG1_THRESHOLDS.overturning.SLS} level="SLS" />
        <FOSCard label="FOS Bearing"    value={results.FOS_bearing}      threshold={GG1_THRESHOLDS.bearing.SLS}     level="SLS" />
        {wallType === 1 && results.q_max !== undefined && (
          <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
            <div className="font-semibold mb-1">Base Pressures</div>
            <div>q_max = {results.q_max.toFixed(1)} kPa</div>
            <div>q_min = {results.q_min.toFixed(1)} kPa</div>
          </div>
        )}
      </div>
    )
  }

  if (wallType === 2) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <FOSCard label="FOS (Passive/Active)" value={results.FOS_sliding} threshold={GG1_THRESHOLDS.fosPile.SLS} level="SLS" />
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
          <div className="font-semibold mb-2 text-primary">Pile Results</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-400">Pa per pile:</span><span>{results.Pa_pile.toFixed(1)} kN</span>
            <span className="text-gray-400">Rp per pile:</span><span>{results.Rp_pile.toFixed(1)} kN</span>
            <span className="text-gray-400">Max BM:</span><span>{results.M_max.toFixed(1)} kN·m</span>
            <span className="text-gray-400">Deflection:</span><span>{(results.delta * 1000).toFixed(1)} mm</span>
            <span className="text-gray-400">Ka:</span><span>{results.Ka.toFixed(3)}</span>
            <span className="text-gray-400">Kp:</span><span>{results.Kp.toFixed(3)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (wallType === 3) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <FOSCard label="FOS Overall Sliding" value={results.fosSlide?.FOS ?? 0} threshold={GG1_THRESHOLDS.sliding.SLS} level="SLS" />
        <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
          <div className="font-semibold mb-1 text-primary">Earth Pressure</div>
          <div className="text-xs">Pa = {results.Pa?.toFixed(2)} kN/m (θ = {results.thetaCrit}°)</div>
          <div className="text-xs">Pa_h = {results.Pa_h?.toFixed(2)} kN/m</div>
        </div>
      </div>
    )
  }
  return null
}

/**
 * Terzaghi Consolidation Settlement — multi-layer + time-settlement curve.
 */
import { useState, useMemo } from 'react'
import { consolidationLayer, timeSettlementCurve, boussinesqCenter } from '../calculations/settlement.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULT_LAYERS = [
  { id: 1, label: 'Soft Clay', H: 4, Cc: 0.35, Cs: 0.07, e0: 1.1, sigma_v0: 40, delta_sigma: 30, sigma_pc: 60, cv: 1.5, drainage: 'double' },
]
const DEFAULTS_LOAD = { q: 80, B: 5, L: 10 }

export default function ConsolidationTab() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [load, setLoad] = useState(DEFAULTS_LOAD)
  const [viewTime, setViewTime] = useState(5)   // years — cursor on time chart

  const updateLayer = (i, k, v) => setLayers(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const addLayer = () => setLayers(prev => [...prev, { id: Date.now(), label: `Layer ${prev.length+1}`, H: 3, Cc: 0.3, Cs: 0.06, e0: 0.9, sigma_v0: 60, delta_sigma: 25, sigma_pc: null, cv: 1.0, drainage: 'double' }])
  const removeLayer = i => setLayers(prev => prev.filter((_, idx) => idx !== i))

  const results = useMemo(() => layers.map(l => consolidationLayer(l)), [layers])
  const totalSc = results.reduce((s, r) => s + (r?.Sc ?? 0), 0)

  /* time-settlement for each layer */
  const curves = useMemo(() => layers.map((l, i) => {
    if (!results[i]) return null
    return timeSettlementCurve({ Sc: results[i].Sc, cv: l.cv, H_drain: l.H, drainage: l.drainage, nPoints: 30 })
  }), [layers, results])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  /* ── Time-settlement SVG ── */
  const TimeChart = () => {
    if (!curves.some(c => c)) return null
    const W = 380, H_c = 140, pl = 40, pb = 25, pr = 15, pt = 10
    const iW = W - pl - pr, iH = H_c - pb - pt

    const allPts = curves.flatMap(c => c ? c.points : [])
    const tMax = Math.max(...allPts.map(p => p.t), 1)
    const sMax = Math.max(...allPts.map(p => p.s_mm), 1)

    const px = t => pl + (t / tMax) * iW
    const py = s => pt + (s / sMax) * iH  // note: s increases downward (settlement)

    const colors = ['#2D6A4F', '#3B82F6', '#F59E0B', '#8B5CF6', '#E74C3C']

    return (
      <svg viewBox={`0 0 ${W} ${H_c}`} className="w-full" style={{ height: H_c }}>
        {/* Axes */}
        <line x1={pl} y1={pt} x2={pl} y2={pt + iH} stroke="#ccc" strokeWidth="0.8" />
        <line x1={pl} y1={pt + iH} x2={pl + iW} y2={pt + iH} stroke="#ccc" strokeWidth="0.8" />
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1.0].map(f => (
          <line key={f} x1={pl} y1={py(sMax * f)} x2={pl + iW} y2={py(sMax * f)}
            stroke="#f0f0f0" strokeWidth="0.5" />
        ))}

        {/* Curves per layer */}
        {curves.map((c, li) => {
          if (!c) return null
          const path = c.points.map((p2, i) => `${i === 0 ? 'M' : 'L'}${px(p2.t)},${py(p2.s_mm)}`).join(' ')
          return <path key={li} d={path} fill="none" stroke={colors[li % colors.length]} strokeWidth="1.5" />
        })}

        {/* View time cursor */}
        <line x1={px(viewTime)} y1={pt} x2={px(viewTime)} y2={pt + iH}
          stroke="#E74C3C" strokeWidth="1" strokeDasharray="3,2" />

        {/* Axis labels */}
        <text x={pl - 3} y={pt + 4} fontSize="8" fill="#999" textAnchor="end">{fmt(sMax, 0)}mm</text>
        <text x={pl - 3} y={pt + iH} fontSize="8" fill="#999" textAnchor="end">0</text>
        <text x={pl} y={H_c - 5} fontSize="8" fill="#999">0 yr</text>
        <text x={pl + iW} y={H_c - 5} fontSize="8" fill="#999" textAnchor="end">{fmt(tMax, 0)} yr</text>
        <text x={W / 2} y={pt + 6} fontSize="8" fill="#555" textAnchor="middle">Settlement vs Time</text>
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-0 min-h-0">
      {/* Left: layers */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Consolidation Settlement
        </div>

        {layers.map((l, i) => (
          <div key={l.id} className="border-b border-gray-100 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <input className="text-xs font-semibold text-gray-700 border-b border-transparent hover:border-gray-300 outline-none bg-transparent w-28"
                value={l.label} onChange={e => updateLayer(i, 'label', e.target.value)} />
              {layers.length > 1 && (
                <button onClick={() => removeLayer(i)} className="text-[10px] text-gray-400 hover:text-fail">✕</button>
              )}
            </div>
            <div className="space-y-1">
              <NumInput label="H (layer)" unit="m" value={l.H} onChange={v => updateLayer(i, 'H', v)} min={0.5} max={20} step={0.5} />
              <NumInput label="Cc" unit="" value={l.Cc} onChange={v => updateLayer(i, 'Cc', v)} min={0.05} max={1.5} step={0.05} tooltip="Compression index" />
              <NumInput label="Cs" unit="" value={l.Cs} onChange={v => updateLayer(i, 'Cs', v)} min={0.01} max={0.5} step={0.01} tooltip="Swelling index (≈Cc/5)" />
              <NumInput label="e₀" unit="" value={l.e0} onChange={v => updateLayer(i, 'e0', v)} min={0.3} max={3.0} step={0.05} tooltip="Initial void ratio" />
              <NumInput label="σ'v0" unit="kPa" value={l.sigma_v0} onChange={v => updateLayer(i, 'sigma_v0', v)} min={5} max={500} step={5} tooltip="Initial effective stress" />
              <NumInput label="Δσ" unit="kPa" value={l.delta_sigma} onChange={v => updateLayer(i, 'delta_sigma', v)} min={1} max={500} step={5} tooltip="Stress increase" />
              <NumInput label="σ'pc" unit="kPa" value={l.sigma_pc ?? 0} onChange={v => updateLayer(i, 'sigma_pc', v || null)} min={0} max={1000} step={5} tooltip="Preconsolidation pressure (0=NC)" />
              <NumInput label="cv" unit="m²/yr" value={l.cv} onChange={v => updateLayer(i, 'cv', v)} min={0.01} max={20} step={0.1} tooltip="Coefficient of consolidation" />
              <div className="flex items-center gap-2 text-xs py-0.5">
                <span className="text-gray-500 w-20">Drainage</span>
                <select className="border rounded px-1 py-0.5 text-xs flex-1"
                  value={l.drainage} onChange={e => updateLayer(i, 'drainage', e.target.value)}>
                  <option value="double">Double (2-way)</option>
                  <option value="single">Single (1-way)</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="px-3 py-2">
          <button onClick={addLayer} className="w-full py-1 text-xs border border-dashed border-gray-300 rounded text-gray-400 hover:border-primary hover:text-primary">
            + Add Layer
          </button>
        </div>

        <div className="px-3 py-2 border-t border-gray-100">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">View at time</div>
          <NumInput label="t" unit="yr" value={viewTime} onChange={setViewTime} min={0} max={100} step={1} />
        </div>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">

        {/* Total settlement banner */}
        <div className="rounded-lg border-2 border-primary bg-pale p-3 mb-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Primary Consolidation</div>
          <div className="text-4xl font-bold text-primary font-mono">{(totalSc * 1000).toFixed(1)} mm</div>
          <div className="text-sm text-gray-500">{fmt(totalSc, 4)} m</div>
        </div>

        {/* Per-layer summary */}
        <div className="mb-4 overflow-x-auto rounded border border-gray-200">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-charcoal text-white">
                {['Layer','Type','σ\'v0','Δσ','σ\'pc','Sc (mm)','t50 (yr)','t90 (yr)'].map(h => (
                  <th key={h} className="px-2 py-1 text-right border-r border-gray-600 last:border-r-0 first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const c = curves[i]
                return r ? (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border-r border-gray-100 font-semibold">{layers[i].label}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right"><span className="text-[10px] px-1 py-0.5 rounded bg-gray-100">{r.type}</span></td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(r.sigma_v0, 0)}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(r.delta_sigma, 0)}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{r.sigma_pc ? fmt(r.sigma_pc, 0) : 'NC'}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono font-bold">{fmt(r.ScInMM, 1)}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{c ? fmt(c.t50, 1) : '—'}</td>
                    <td className="px-2 py-1 text-right font-mono">{c ? fmt(c.t90, 1) : '—'}</td>
                  </tr>
                ) : null
              })}
              <tr className="bg-pale font-bold border-t-2 border-primary text-primary">
                <td colSpan={5} className="px-2 py-1 text-right">Total</td>
                <td className="px-2 py-1 text-right font-mono">{(totalSc * 1000).toFixed(1)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* Time chart */}
        <div className="mb-4 rounded border border-gray-200 p-2">
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Time — Settlement Curve</div>
          <TimeChart />
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {layers.map((l, i) => (
              <span key={i} className="text-[10px] text-gray-500">
                <span className="inline-block w-3 h-0.5 mr-1" style={{ background: ['#2D6A4F','#3B82F6','#F59E0B','#8B5CF6','#E74C3C'][i % 5], verticalAlign: 'middle' }} />
                {l.label} (t50={curves[i] ? fmt(curves[i].t50, 1) : '—'}yr)
              </span>
            ))}
          </div>
        </div>

        {results.map((r, i) => r && (
          <CalcBreakdown key={i} title={`${layers[i].label} — Calculation`}>
            <CalcLine label="Type" result={r.type} />
            <CalcLine label="σ'v1 = σ'v0 + Δσ" expr={`${fmt(r.sigma_v0,0)} + ${fmt(r.delta_sigma,0)}`} result={`${fmt(r.sigma_v1, 1)} kPa`} />
            {r.type === 'NC' && <CalcLine label="Sc" expr={`Cc/(1+e0) × H × log(σv1/σv0)`} result={`${fmt(r.ScInMM, 2)} mm`} />}
            {r.type === 'OC' && <CalcLine label="Sc" expr={`Cs/(1+e0) × H × log(σv1/σv0)`} result={`${fmt(r.ScInMM, 2)} mm`} />}
            {r.type === 'OC→NC' && <>
              <CalcLine label="OC part" expr={`Cs/(1+e0) × H × log(σpc/σv0)`} />
              <CalcLine label="NC part" expr={`Cc/(1+e0) × H × log(σv1/σpc)`} result={`Total: ${fmt(r.ScInMM, 2)} mm`} />
            </>}
            {curves[i] && <>
              <CalcLine label="t50" expr={`0.197 × Hd² / cv`} result={`${fmt(curves[i].t50, 2)} yr`} />
              <CalcLine label="t90" expr={`0.848 × Hd² / cv`} result={`${fmt(curves[i].t90, 2)} yr`} />
            </>}
          </CalcBreakdown>
        ))}
      </div>
    </div>
  )
}

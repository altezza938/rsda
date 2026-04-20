import { useState, useMemo } from 'react'
import { trialWedgeFR146 } from '../calculations/trialWedgeFR146.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEG = Math.PI / 180

const DEFAULT_WEDGE_POINTS = [
  { x: 0.5,  y: 49.7 },
  { x: 1.0,  y: 49.95 },
  { x: 2.0,  y: 50.3 },
  { x: 4.0,  y: 51.0 },
  { x: 6.0,  y: 51.6 },
  { x: 8.0,  y: 52.2 },
  { x: 10.0, y: 52.8 },
  { x: 12.0, y: 53.4 },
  { x: 14.0, y: 54.0 },
  { x: 15.3, y: 54.5 },
  { x: 18.0, y: 55.0 },
  { x: 20.0, y: 55.4 },
]

const DEFAULT_NAILS = [
  { yLevel: 55,   force: 8,     inclination_deg: 20, label: 'Row A' },
  { yLevel: 54,   force: 15,    inclination_deg: 20, label: 'Row B' },
  { yLevel: 53,   force: 16,    inclination_deg: 20, label: 'Row C' },
  { yLevel: 52,   force: 12.22, inclination_deg: 59, label: 'Row D' },
  { yLevel: 51,   force: 15.2,  inclination_deg: 20, label: 'Row E' },
  { yLevel: 50,   force: 28,    inclination_deg: 20, label: 'Row F' },
]

export default function TrialWedgeTab({ onPaChange }) {
  const [origin,   setOrigin]   = useState({ x: 0, y: 48.7 })
  const [wallTop,  setWallTop]  = useState({ x: 0, y: 49.7 })
  const [gamma,    setGamma]    = useState(19)
  const [phi,      setPhi]      = useState(30)
  const [cohesion, setCohesion] = useState(0)
  const [delta,    setDelta]    = useState(20)
  const [hw,       setHw]       = useState(0.333)
  const [surcharges, setSurcharges] = useState([{ x1: 15.3, x2: 18.0, q: 20, label: 'q1' }])
  const [wedgePts, setWedgePts] = useState(DEFAULT_WEDGE_POINTS)
  const [nailRows, setNailRows] = useState(DEFAULT_NAILS)
  const [showNails, setShowNails] = useState(true)

  const results = useMemo(() => {
    try {
      return trialWedgeFR146({
        origin, wallTop, wedgePoints: wedgePts,
        gamma, phi, cohesion, delta, hw,
        surcharges,
        nailRows: showNails ? nailRows : [],
      })
    } catch { return null }
  }, [origin, wallTop, wedgePts, gamma, phi, cohesion, delta, hw, surcharges, nailRows, showNails])

  const Pa = results?.Pa ?? 0

  // Update parent when Pa changes
  useMemo(() => { onPaChange?.(Pa, delta) }, [Pa, delta])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  // Pa vs wedge chart (inline SVG)
  const validRows = results?.rows?.filter(r => r.Pa != null) ?? []
  const PaMin = Math.min(0, ...validRows.map(r => r.Pa))
  const PaMax_chart = Math.max(1, ...validRows.map(r => r.Pa))
  const chartW = 340, chartH = 110
  const pad = { l: 38, r: 10, t: 10, b: 22 }
  const pw = chartW - pad.l - pad.r, ph = chartH - pad.t - pad.b
  const sx = i => pad.l + (i / Math.max(1, validRows.length - 1)) * pw
  const sy = p => pad.t + ph - ((p - PaMin) / (PaMax_chart - PaMin)) * ph
  const polyline = validRows.map((r, i) => `${sx(i)},${sy(r.Pa)}`).join(' ')

  return (
    <div className="flex flex-col gap-0">
      {/* Two-column layout */}
      <div className="grid grid-cols-[280px_1fr] gap-0 min-h-0">

        {/* ── Left: Inputs ── */}
        <div className="overflow-y-auto border-r border-gray-200">
          <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
            FR146 Trial Wedge Inputs
          </div>

          <Section title="Origin & Wall">
            <NumInput label="O x₀" unit="m" value={origin.x} onChange={v => setOrigin(p => ({ ...p, x: v }))} step={0.1} />
            <NumInput label="O y₀" unit="mPD" value={origin.y} onChange={v => setOrigin(p => ({ ...p, y: v }))} step={0.1} />
            <NumInput label="A xₐ" unit="m" value={wallTop.x} onChange={v => setWallTop(p => ({ ...p, x: v }))} step={0.1} />
            <NumInput label="A yₐ" unit="mPD" value={wallTop.y} onChange={v => setWallTop(p => ({ ...p, y: v }))} step={0.1} />
          </Section>

          <Section title="Soil & Water">
            <NumInput label="γ" unit="kN/m³" value={gamma} onChange={setGamma} min={14} max={25} />
            <NumInput label="φ'" unit="°" value={phi} onChange={setPhi} min={0} max={45} />
            <NumInput label="c'" unit="kPa" value={cohesion} onChange={setCohesion} min={0} max={50} />
            <NumInput label="δ" unit="°" value={delta} onChange={setDelta} min={0} max={45} />
            <NumInput label="hw" unit="m" value={hw} onChange={setHw} min={0} />
          </Section>

          <Section title="Surcharges">
            {surcharges.map((s, i) => (
              <div key={i} className="col-span-2 grid grid-cols-3 gap-1 text-xs items-center">
                <NumInput label="x₁" unit="m" value={s.x1} onChange={v => setSurcharges(p => p.map((x, j) => j === i ? { ...x, x1: v } : x))} step={0.5} />
                <NumInput label="x₂" unit="m" value={s.x2} onChange={v => setSurcharges(p => p.map((x, j) => j === i ? { ...x, x2: v } : x))} step={0.5} />
                <NumInput label="q" unit="kPa" value={s.q} onChange={v => setSurcharges(p => p.map((x, j) => j === i ? { ...x, q: v } : x))} min={0} />
              </div>
            ))}
          </Section>

          <Section title={`Soil Nails (${nailRows.length})`}>
            <div className="col-span-2 flex items-center gap-2 mb-1">
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={showNails} onChange={e => setShowNails(e.target.checked)} />
                Include nails in wedge
              </label>
            </div>
            {nailRows.map((n, i) => (
              <div key={i} className="col-span-2 grid grid-cols-3 gap-1">
                <NumInput label="Level" unit="mPD" value={n.yLevel} onChange={v => setNailRows(p => p.map((x, j) => j === i ? { ...x, yLevel: v } : x))} step={0.5} />
                <NumInput label="F" unit="kN" value={n.force} onChange={v => setNailRows(p => p.map((x, j) => j === i ? { ...x, force: v } : x))} min={0} />
                <NumInput label="α" unit="°" value={n.inclination_deg} onChange={v => setNailRows(p => p.map((x, j) => j === i ? { ...x, inclination_deg: v } : x))} min={0} max={60} />
              </div>
            ))}
          </Section>
        </div>

        {/* ── Right: Results ── */}
        <div className="overflow-y-auto px-4 py-3">

          {/* Result banner */}
          <div className={`rounded-lg border-2 p-3 mb-3 ${Pa > 0 ? 'border-fail bg-red-50' : 'border-pass bg-green-50'}`}>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Critical Active Earth Pressure</div>
            <div className={`text-3xl font-bold ${Pa > 0 ? 'text-fail' : 'text-pass'}`}>
              Pa = {Pa.toFixed(3)} kN/m
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Governing wedge: {results?.criticalWedge ?? '—'} &nbsp;|&nbsp;
              Wall batter ω = {results ? results.omega_deg.toFixed(1) : '—'}°
            </div>
            {Pa <= 0 && <div className="text-xs text-pass font-semibold mt-1">All Pa values ≤ 0 — wall stable under nails</div>}
          </div>

          {/* Pa vs Wedge chart */}
          {validRows.length > 2 && (
            <div className="bg-gray-50 rounded border border-gray-200 mb-3 p-2">
              <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Pa vs Wedge No.</div>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 120 }}>
                {/* Zero line */}
                {PaMin < 0 && PaMax_chart > 0 && (
                  <line x1={pad.l} y1={sy(0)} x2={chartW - pad.r} y2={sy(0)}
                    stroke="#E74C3C" strokeWidth="0.8" strokeDasharray="3,2" />
                )}
                {/* Grid */}
                {[0.25, 0.5, 0.75].map(f => (
                  <line key={f} x1={pad.l} y1={pad.t + ph * f} x2={chartW - pad.r} y2={pad.t + ph * f}
                    stroke="#e5e7eb" strokeWidth="0.5" />
                ))}
                {/* Area */}
                <polygon
                  points={`${pad.l},${sy(0)} ${polyline} ${sx(validRows.length - 1)},${sy(0)}`}
                  fill="#2D6A4F" opacity="0.08" />
                {/* Line */}
                <polyline points={polyline} fill="none" stroke="#2D6A4F" strokeWidth="1.5" />
                {/* Max dot */}
                {results && results.criticalWedge > 0 && (() => {
                  const cIdx = results.criticalWedge - 1
                  const cr = validRows[cIdx]
                  if (!cr) return null
                  return (
                    <g>
                      <circle cx={sx(cIdx)} cy={sy(cr.Pa)} r="5" fill="#2D6A4F" />
                      <text x={sx(cIdx)} y={sy(cr.Pa) - 7} fontSize="8" fill="#2D6A4F" textAnchor="middle" fontWeight="bold">
                        {cr.Pa.toFixed(1)}
                      </text>
                    </g>
                  )
                })()}
                {/* Axes */}
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ph} stroke="#9ca3af" strokeWidth="0.8" />
                <line x1={pad.l} y1={pad.t + ph} x2={chartW - pad.r} y2={pad.t + ph} stroke="#9ca3af" strokeWidth="0.8" />
                <text x={9} y={pad.t + ph / 2} fontSize="7" fill="#9ca3af" textAnchor="middle"
                  transform={`rotate(-90,9,${pad.t + ph / 2})`}>Pa (kN/m)</text>
                <text x={chartW / 2} y={chartH - 5} fontSize="7" fill="#9ca3af" textAnchor="middle">Wedge No.</text>
              </svg>
            </div>
          )}

          {/* Iteration table */}
          {results && (
            <div className="overflow-x-auto rounded border border-gray-200 text-[10px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-charcoal text-white">
                    <th className="px-1.5 py-1 border-r border-gray-600 text-center">#</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">xᵢ</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">yᵢ</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">θ°</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">Aᵢ m²</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">Wᵢ kN/m</th>
                    <th className="px-1.5 py-1 border-r border-gray-600 text-right">Li m</th>
                    <th className="px-1.5 py-1 text-right">Pa kN/m</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r) => (
                    <tr key={r.wedge}
                      className={r.active ? 'bg-primary text-white font-bold' : r.wedge % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-center font-mono">
                        {r.wedge}{r.active ? ' ★' : ''}
                      </td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.xi, 2)}</td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.yi, 2)}</td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.theta_deg, 1)}</td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.Ai, 3)}</td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.W, 2)}</td>
                      <td className="px-1.5 py-0.5 border-r border-gray-200 text-right font-mono">{fmt(r.Li, 3)}</td>
                      <td className={`px-1.5 py-0.5 text-right font-mono ${r.Pa < 0 ? 'text-gray-400' : ''}`}>
                        {r.Pa != null ? fmt(r.Pa, 3) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-pale border-t-2 border-primary font-bold">
                    <td colSpan={7} className="px-2 py-1 text-right text-xs text-primary">Pa (max) =</td>
                    <td className="px-2 py-1 text-right font-mono text-primary">{Pa.toFixed(3)} kN/m</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <CalcBreakdown title="Formula Reference (FR146)">
            <CalcLine label="Wall batter" expr="ω = −arctan((xA−x₀)/(yA−y₀))" result={`${results?.omega_deg?.toFixed(2) ?? '—'}°`} />
            <CalcLine label="Failure plane angle" expr="θᵢ = arctan((xᵢ−x₀)/(yᵢ−y₀))" />
            <CalcLine label="Wedge area (shoelace)" expr="Gᵢ = |0.5(x₀y_{i-1} + x_{i-1}yᵢ + xᵢy₀ − y₀x_{i-1} − y_{i-1}xᵢ − yᵢx₀)|" />
            <CalcLine label="Pa formula"
              expr="Pa = [W+q − U1sinω − U2sinθ − c'Licosθ + tan(θ+φ')(U2cosθ − U1cosω − c'Lisinθ) − nail] / [cos(δ+ω)tan(θ+φ') + sin(δ+ω)]" />
          </CalcBreakdown>
        </div>
      </div>
    </div>
  )
}

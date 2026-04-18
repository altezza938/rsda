/**
 * Trial wedge iteration table + Pa vs θ interactive chart.
 */
import { useState } from 'react'

/* ── Pa vs θ SVG mini-chart ── */
function PaChart({ rows, thetaCrit, onHover }) {
  const [hover, setHover] = useState(null)
  const valid = rows.filter(r => r.Pa != null && isFinite(r.Pa) && r.Pa > 0)
  if (valid.length < 3) return null

  const W = 360, H = 100
  const pad = { l: 36, r: 14, t: 14, b: 22 }
  const pw = W - pad.l - pad.r
  const ph = H - pad.t - pad.b

  const tMin = valid[0].theta
  const tMax = valid[valid.length - 1].theta
  const pMax = Math.max(...valid.map(r => r.Pa)) * 1.15

  const sx = t => pad.l + (t - tMin) / (tMax - tMin) * pw
  const sy = p => pad.t + ph - (p / pMax) * ph

  const polyPts = valid.map(r => `${sx(r.theta)},${sy(r.Pa)}`).join(' ')
  const critRow = rows.find(r => r.theta === thetaCrit)
  const hovRow  = hover != null ? rows.find(r => r.theta === hover) : null

  const ticks = [...new Set([tMin, 30, 40, 50, 60, tMax])].filter(t => t >= tMin && t <= tMax)

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width * W
    const t = Math.round(tMin + (mx - pad.l) / pw * (tMax - tMin))
    if (t >= tMin && t <= tMax) {
      setHover(t)
      onHover?.(t)
    }
  }

  return (
    <div className="bg-gray-50 rounded border border-gray-200 mt-3 px-2 pt-2 pb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pa vs θ Curve</span>
        {hovRow && (
          <span className="text-xs text-gray-600 font-mono">
            θ={hovRow.theta}° → <span className="text-primary font-bold">Pa={hovRow.Pa.toFixed(2)} kN/m</span>
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair"
        style={{ maxHeight: 110 }}
        onMouseMove={handleMove}
        onMouseLeave={() => { setHover(null); onHover?.(null) }}
      >
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={pad.l} y1={pad.t + ph * (1 - f)} x2={W - pad.r} y2={pad.t + ph * (1 - f)}
            stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        {/* Area fill */}
        <polygon
          points={`${pad.l},${pad.t + ph} ${polyPts} ${sx(tMax)},${pad.t + ph}`}
          fill="#2D6A4F" opacity="0.07"
        />
        {/* Curve */}
        <polyline points={polyPts} fill="none" stroke="#2D6A4F" strokeWidth="1.5" />
        {/* Critical vertical guide */}
        {critRow && (
          <>
            <line x1={sx(thetaCrit)} y1={pad.t} x2={sx(thetaCrit)} y2={pad.t + ph}
              stroke="#2D6A4F" strokeWidth="0.8" strokeDasharray="3,2" />
            <circle cx={sx(thetaCrit)} cy={sy(critRow.Pa)} r="5" fill="#2D6A4F" />
            <text x={sx(thetaCrit)} y={sy(critRow.Pa) - 8} textAnchor="middle"
              fontSize="7.5" fontWeight="bold" fill="#2D6A4F">
              {critRow.Pa.toFixed(1)}
            </text>
          </>
        )}
        {/* Hover crosshair */}
        {hovRow && hovRow.theta !== thetaCrit && (
          <>
            <line x1={sx(hovRow.theta)} y1={pad.t} x2={sx(hovRow.theta)} y2={pad.t + ph}
              stroke="#52B788" strokeWidth="0.8" strokeDasharray="2,2" />
            <circle cx={sx(hovRow.theta)} cy={sy(hovRow.Pa)} r="4"
              fill="#52B788" stroke="white" strokeWidth="1.2" />
          </>
        )}
        {/* Axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + ph} stroke="#9ca3af" strokeWidth="0.8" />
        <line x1={pad.l} y1={pad.t + ph} x2={W - pad.r} y2={pad.t + ph} stroke="#9ca3af" strokeWidth="0.8" />
        {/* X ticks */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={sx(t)} y1={pad.t + ph} x2={sx(t)} y2={pad.t + ph + 3} stroke="#9ca3af" strokeWidth="0.8" />
            <text x={sx(t)} y={pad.t + ph + 11} textAnchor="middle" fontSize="7"
              fill={t === thetaCrit ? '#2D6A4F' : '#9ca3af'}
              fontWeight={t === thetaCrit ? 'bold' : 'normal'}>{t}°
            </text>
          </g>
        ))}
        {/* Y axis label */}
        <text x={9} y={pad.t + ph / 2} textAnchor="middle" fontSize="7" fill="#9ca3af"
          transform={`rotate(-90,9,${pad.t + ph / 2})`}>Pa (kN/m)
        </text>
      </svg>
    </div>
  )
}

/* ── Main table ── */
export default function TrialWedgeTable({ rows, Pa, thetaCrit, hasWater, hasCohesion }) {
  const [selected, setSelected] = useState(null)   // user-clicked theta
  const [charted, setCharted]   = useState(null)   // chart hover theta

  if (!rows || rows.length === 0) return null

  const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d))

  const highlighted = charted ?? selected   // chart hover takes priority
  const selRow = highlighted != null ? rows.find(r => r.theta === highlighted) : null

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Trial Wedge Iteration Table (FR146)
        </span>
        <span className="text-xs text-gray-500">
          Pa = <span className="font-bold text-primary">{Pa?.toFixed(3)}</span> kN/m
          &nbsp;@&nbsp;θ = <span className="font-bold text-primary">{thetaCrit}°</span>
        </span>
      </div>

      {/* Interactive Pa vs θ chart */}
      <PaChart rows={rows} thetaCrit={thetaCrit} onHover={setCharted} />

      {/* Selected-row detail banner */}
      {selRow && selRow.theta !== thetaCrit && selRow.Pa != null && (
        <div className="mt-2 flex items-center gap-3 px-3 py-1.5 rounded bg-secondary/10 border border-secondary/30 text-xs text-gray-700">
          <span className="font-bold text-primary">θ = {selRow.theta}°</span>
          <span>W = {fmt(selRow.W)} kN/m</span>
          {hasCohesion && <span>C = {fmt(selRow.C)} kN/m</span>}
          <span>Pa = <strong>{fmt(selRow.Pa)}</strong> kN/m</span>
          <span className="text-gray-400">
            ({selRow.Pa > 0
              ? `${((selRow.Pa / Pa - 1) * 100).toFixed(1)}% vs max`
              : 'negative — wedge invalid'})
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded border border-gray-200 shadow-sm mt-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-charcoal text-white">
              <th className="px-2 py-1.5 text-center font-medium border-r border-gray-600">θ (°)</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">W (kN/m)</th>
              {hasWater && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">U₁</th>}
              {hasWater && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">U₂</th>}
              {hasCohesion && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Li (m)</th>}
              {hasCohesion && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">C (kN/m)</th>}
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Numerator</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Denom.</th>
              <th className="px-2 py-1.5 text-right font-medium">Pa (kN/m)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isCrit = r.active
              const isSel  = r.theta === highlighted && !isCrit
              return (
                <tr
                  key={r.theta}
                  onClick={() => setSelected(r.theta === selected ? null : r.theta)}
                  className={`cursor-pointer transition-colors ${
                    isCrit ? 'bg-primary text-white font-bold'
                    : isSel ? 'bg-secondary/20 font-semibold'
                    : r.theta % 2 === 0 ? 'bg-white hover:bg-secondary/10' : 'bg-gray-50 hover:bg-secondary/10'
                  }`}
                >
                  <td className="px-2 py-0.5 text-center border-r border-gray-200 font-mono">
                    {r.theta}{isCrit ? ' ★' : ''}
                  </td>
                  <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.W)}</td>
                  {hasWater && <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.U1)}</td>}
                  {hasWater && <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.U2)}</td>}
                  {hasCohesion && <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.Li)}</td>}
                  {hasCohesion && <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.C)}</td>}
                  <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.numerator)}</td>
                  <td className="px-2 py-0.5 text-right font-mono border-r border-gray-200">{fmt(r.denominator)}</td>
                  <td className={`px-2 py-0.5 text-right font-mono ${isCrit ? '' : r.Pa != null && r.Pa > 0 ? 'text-charcoal' : 'text-gray-300'}`}>
                    {r.Pa != null ? fmt(r.Pa) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-pale border-t-2 border-primary">
              <td colSpan={2 + (hasWater ? 2 : 0) + (hasCohesion ? 2 : 0) + 2}
                className="px-2 py-1.5 text-right text-xs font-bold text-primary">
                Pa (max) =
              </td>
              <td className="px-2 py-1.5 text-right font-bold text-primary font-mono">
                {Pa?.toFixed(3)} kN/m
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

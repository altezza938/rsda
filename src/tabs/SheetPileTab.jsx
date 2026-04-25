/**
 * Sheet Pile Design — Cantilever & Propped (free earth support), cohesionless soil.
 */
import { useState, useMemo } from 'react'
import { cantileverSheetPile, proppedSheetPile, rankineCoeffs } from '../calculations/sheetPile.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = { H: 4, phi: 30, gamma: 19, hw_ret: 0, FOS_embed: 1.3, prop_depth: 0 }

export default function SheetPileTab({ type = 'cantilever' }) {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => {
    try {
      return type === 'cantilever'
        ? cantileverSheetPile(p)
        : proppedSheetPile(p)
    } catch { return null }
  }, [p, type])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  /* ── SVG: wall cross-section + pressure diagram ── */
  const WallSVG = () => {
    if (!r) return null
    const W = 300, H_s = 280, ml = 60, mr = 80, mt = 20, mb = 20
    const iW = W - ml - mr, iH = H_s - mt - mb
    const totalH = r.H + r.D_design
    const scale = iH / totalH

    const wallX = ml + iW * 0.35
    const wallW = 10
    const top = mt
    const dredge = mt + r.H * scale
    const bot = mt + totalH * scale

    // Pressure at key points
    const pMax = r.sigma_a_dredge ?? (r.Ka * p.gamma * r.H)
    const pScale = Math.min(60, mr * 0.7) / Math.max(pMax, 1)

    return (
      <svg viewBox={`0 0 ${W} ${H_s}`} className="w-full h-64">
        <defs>
          <pattern id="sp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#8B7355" strokeWidth="0.8" />
          </pattern>
          <pattern id="sp-passive" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#2D6A4F" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* Retained soil (right of wall, above dredge) */}
        <rect x={wallX + wallW} y={top} width={iW * 0.5} height={dredge - top}
          fill="url(#sp-hatch)" opacity="0.5" />

        {/* Passive soil (left of wall, below dredge) */}
        <rect x={wallX - iW * 0.3} y={dredge} width={iW * 0.3} height={bot - dredge}
          fill="url(#sp-passive)" opacity="0.4" />

        {/* Wall */}
        <rect x={wallX} y={top} width={wallW} height={bot - top}
          fill="#aaa" stroke="#555" strokeWidth="1.5" />

        {/* Dredge line */}
        <line x1={ml} y1={dredge} x2={wallX + wallW + iW * 0.5} y2={dredge}
          stroke="#555" strokeWidth="1.5" />

        {/* Prop (if propped) */}
        {type === 'propped' && (
          <line x1={ml + 5} y1={mt + p.prop_depth * scale}
            x2={wallX} y2={mt + p.prop_depth * scale}
            stroke="#F59E0B" strokeWidth="2" />
        )}

        {/* Active pressure (right, pointing left) */}
        <polygon
          points={`${wallX + wallW},${top} ${wallX + wallW + pMax * pScale},${dredge} ${wallX + wallW},${dredge}`}
          fill="#E74C3C" fillOpacity="0.25" />
        <line x1={wallX + wallW} y1={dredge} x2={wallX + wallW + pMax * pScale} y2={dredge}
          stroke="#E74C3C" strokeWidth="1" />
        <text x={wallX + wallW + pMax * pScale + 2} y={dredge + 4} fontSize="8" fill="#E74C3C">
          {fmt(pMax, 1)} kPa
        </text>

        {/* Dimension labels */}
        <line x1={ml + 5} y1={top} x2={ml + 5} y2={dredge} stroke="#555" strokeWidth="0.8" />
        <line x1={ml} y1={top} x2={ml + 10} y2={top} stroke="#555" strokeWidth="0.8" />
        <line x1={ml} y1={dredge} x2={ml + 10} y2={dredge} stroke="#555" strokeWidth="0.8" />
        <text x={ml + 7} y={(top + dredge) / 2 + 3} fontSize="9" fill="#555">H={p.H}m</text>

        <line x1={ml + 5} y1={dredge} x2={ml + 5} y2={bot} stroke="#555" strokeWidth="0.8" />
        <line x1={ml} y1={bot} x2={ml + 10} y2={bot} stroke="#555" strokeWidth="0.8" />
        <text x={ml + 7} y={(dredge + bot) / 2 + 3} fontSize="9" fill="#2D6A4F">D={fmt(r.D_design, 2)}m</text>

        <text x={W / 2} y={H_s - 5} textAnchor="middle" fontSize="8" fill="#9ca3af">
          {type === 'cantilever' ? 'Cantilever' : 'Propped'} Sheet Pile — {type === 'propped' ? `T=${fmt(r.T,1)}kN/m` : ''}
        </text>
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-0 min-h-0">
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          {type === 'cantilever' ? 'Cantilever' : 'Propped/Anchored'} Sheet Pile
        </div>
        <Section title="Geometry">
          <NumInput label="H (retained ht)" unit="m" value={p.H} onChange={f('H')} min={1} max={15} step={0.5} />
          {type === 'propped' && (
            <NumInput label="Prop depth" unit="m" value={p.prop_depth} onChange={f('prop_depth')} min={0} max={p.H} step={0.1} tooltip="Depth of prop from top" />
          )}
          <NumInput label="hw (GW above dredge)" unit="m" value={p.hw_ret} onChange={f('hw_ret')} min={0} max={p.H} step={0.1} tooltip="Groundwater height above dredge, retained side" />
        </Section>
        <Section title="Soil (Cohesionless)">
          <NumInput label="φ'" unit="°" value={p.phi} onChange={f('phi')} min={20} max={45} />
          <NumInput label="γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={22} />
        </Section>
        <Section title="Design">
          <NumInput label="Embed. factor" unit="" value={p.FOS_embed} onChange={f('FOS_embed')} min={1.0} max={2.0} step={0.05} tooltip="D_design = D_theoretical × factor" />
        </Section>
      </div>

      <div className="overflow-y-auto px-4 py-3">
        <WallSVG />

        {r && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Ka', val: r.Ka, d: 4 },
                { label: 'Kp', val: r.Kp, d: 4 },
                { label: 'Active force Pa', val: r.Pa, unit: 'kN/m', d: 2 },
                { label: 'Theor. embed D', val: r.D, unit: 'm', d: 3 },
                { label: 'Design embed D×fac', val: r.D_design, unit: 'm', d: 3 },
                { label: 'Max BM', val: r.M_max, unit: 'kNm/m', d: 2 },
                ...(type === 'propped' ? [{ label: 'Prop force T', val: r.T, unit: 'kN/m', d: 2 }] : []),
              ].map(({ label, val, unit = '', d = 3 }) => (
                <div key={label} className="rounded border border-gray-200 p-2 text-xs">
                  <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                  <div className="font-mono font-bold text-primary">{fmt(val, d)} {unit}</div>
                </div>
              ))}
            </div>

            <CalcBreakdown title="Earth Pressure Calculation">
              <CalcLine label="Ka = tan²(45−φ/2)" result={fmt(r.Ka, 4)} />
              <CalcLine label="Kp = tan²(45+φ/2)" result={fmt(r.Kp, 4)} />
              <CalcLine label="σa at dredge" expr={`Ka·γ·H = ${fmt(r.Ka,3)}×${p.gamma}×${p.H}`} result={`${fmt(r.sigma_a_dredge, 2)} kPa`} />
              <CalcLine label="Pa (resultant)" expr={`½·Ka·γ·H² = ½×${fmt(r.Ka,3)}×${p.gamma}×${p.H}²`} result={`${fmt(r.Pa, 2)} kN/m`} />
              {type === 'cantilever' && <>
                <CalcLine label="z1 (zero net pressure)" expr={`σa_dredge / [(Kp−Ka)·γ]`} result={`${fmt(r.z1, 3)} m below dredge`} />
                <CalcLine label="Theoretical D" expr="Moment equil. about pile tip" result={`${fmt(r.D, 3)} m`} />
              </>}
              {type === 'propped' && (
                <CalcLine label="T (prop force)" expr="Horiz. equilibrium" result={`${fmt(r.T, 2)} kN/m`} />
              )}
              <CalcLine label="D design" expr={`D × embed. factor = ${fmt(r.D,3)} × ${p.FOS_embed}`} result={`${fmt(r.D_design, 3)} m`} />
              <CalcLine label="Max BM" result={`${fmt(r.M_max, 2)} kNm/m`} />
            </CalcBreakdown>
          </>
        )}
      </div>
    </div>
  )
}

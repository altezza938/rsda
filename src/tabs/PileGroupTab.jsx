/**
 * Pile Group Efficiency — Converse-Labarre + block failure.
 */
import { useState, useMemo } from 'react'
import { pileGroup } from '../calculations/pileCapacity.js'
import { NumInput, Section } from '../components/NumInput.jsx'

const DEFAULTS = { D: 0.5, s: 1.5, nR: 3, nC: 3, Q_single: 350, su: 40, L: 12 }

export default function PileGroupTab() {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => { try { return pileGroup(p) } catch { return null } }, [p])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  /* ── SVG pile group plan view ── */
  const GroupPlanSVG = () => {
    const W = 260, H_s = 200, pad = 30
    const nR = Math.min(p.nR, 6), nC = Math.min(p.nC, 6)
    const s_px = Math.min(36, (W - 2 * pad) / Math.max(nC - 1, 1))
    const D_px = Math.max(6, Math.min(s_px * 0.45, 18))
    const startX = pad + (W - 2 * pad - (nC - 1) * s_px) / 2
    const startY = 25 + (H_s - 55 - (nR - 1) * s_px) / 2

    return (
      <svg viewBox={`0 0 ${W} ${H_s}`} className="w-full h-44">
        {/* Group block outline */}
        {r && (
          <rect
            x={startX - D_px / 2 - 2}
            y={startY - D_px / 2 - 2}
            width={(nC - 1) * s_px + D_px + 4}
            height={(nR - 1) * s_px + D_px + 4}
            fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4,3" />
        )}
        {/* Piles */}
        {Array.from({ length: nR }).flatMap((_, ri) =>
          Array.from({ length: nC }).map((_, ci) => (
            <circle key={`${ri}-${ci}`}
              cx={startX + ci * s_px}
              cy={startY + ri * s_px}
              r={D_px / 2}
              fill="#888" stroke="#555" strokeWidth="0.8" />
          ))
        )}
        {/* Spacing label */}
        {nC > 1 && (
          <g>
            <line x1={startX} y1={startY + (nR - 0.5) * s_px + 5} x2={startX + s_px} y2={startY + (nR - 0.5) * s_px + 5} stroke="#555" strokeWidth="0.8" />
            <text x={startX + s_px / 2} y={startY + (nR - 0.5) * s_px + 14} textAnchor="middle" fontSize="8" fill="#555">s={p.s}m</text>
          </g>
        )}
        <text x={W / 2} y={H_s - 5} textAnchor="middle" fontSize="8" fill="#9ca3af">
          Plan view — {p.nR}×{p.nC} = {p.nR * p.nC} piles
        </text>
        {r && (
          <text x={W / 2} y={15} textAnchor="middle" fontSize="9" fill={r.eta >= 0.7 ? '#27AE60' : '#E9A820'}>
            η = {fmt(r.eta, 3)}
          </text>
        )}
      </svg>
    )
  }

  /* Block failure (clay only) */
  const Q_block = r && p.su > 0 && p.L > 0
    ? 2 * (r.Lg + r.Bg) * p.su * p.L + 9 * p.su * r.Lg * r.Bg
    : null
  const Q_group_pile = r ? r.eta * r.n * p.Q_single : null
  const Q_group = Q_block != null ? Math.min(Q_group_pile, Q_block) : Q_group_pile

  return (
    <div className="grid grid-cols-[240px_1fr] gap-0 min-h-0">
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Pile Group
        </div>
        <Section title="Pile Geometry">
          <NumInput label="Diameter D" unit="m" value={p.D} onChange={f('D')} min={0.1} max={2} step={0.05} />
          <NumInput label="Spacing s" unit="m" value={p.s} onChange={f('s')} min={p.D * 2} max={5} step={0.1} tooltip="Centre-to-centre spacing" />
          <NumInput label="Rows (nR)" unit="" value={p.nR} onChange={v => f('nR')(Math.round(v))} min={1} max={8} step={1} />
          <NumInput label="Cols (nC)" unit="" value={p.nC} onChange={v => f('nC')(Math.round(v))} min={1} max={8} step={1} />
          <NumInput label="Length L" unit="m" value={p.L} onChange={f('L')} min={1} max={60} step={0.5} />
        </Section>
        <Section title="Capacity">
          <NumInput label="Q_single" unit="kN" value={p.Q_single} onChange={f('Q_single')} min={10} max={5000} step={10} tooltip="Allowable single pile capacity" />
          <NumInput label="su (clay)" unit="kPa" value={p.su} onChange={f('su')} min={0} max={200} step={5} tooltip="For block failure check (0=sand)" />
        </Section>
      </div>

      <div className="overflow-y-auto px-4 py-3">
        <GroupPlanSVG />

        {r && (
          <>
            {/* Efficiency */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Piles (n)', val: r.n, unit: '' },
                { label: 'Efficiency η', val: fmt(r.eta, 3), unit: '' },
                { label: 'θ', val: fmt(Math.atan(p.D / p.s) * 180 / Math.PI, 2), unit: '°' },
              ].map(({ label, val, unit }) => (
                <div key={label} className="rounded border border-gray-200 p-2 text-center">
                  <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                  <div className="text-xl font-bold font-mono text-primary">{val}</div>
                  <div className="text-[10px] text-gray-400">{unit}</div>
                </div>
              ))}
            </div>

            {/* Capacity */}
            <div className="rounded-lg border-2 border-primary bg-pale p-3 mb-4">
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Group Capacity</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">By pile efficiency: η × n × Q_single</span>
                  <span className="font-mono font-bold">{fmt(Q_group_pile, 1)} kN</span>
                </div>
                {Q_block != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Block failure (clay): perimeter + base</span>
                    <span className="font-mono font-bold">{fmt(Q_block, 1)} kN</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-primary/20 pt-1.5">
                  <span className="text-primary font-bold">Governing (min)</span>
                  <span className="font-mono font-bold text-primary text-lg">{fmt(Q_group, 1)} kN</span>
                </div>
              </div>
            </div>

            {/* Block dimensions */}
            <div className="rounded border border-gray-200 p-3 text-xs mb-3">
              <div className="font-bold text-primary mb-1">Block Dimensions</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex justify-between"><span className="text-gray-400">Lg</span><span className="font-mono">{fmt(r.Lg, 2)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Bg</span><span className="font-mono">{fmt(r.Bg, 2)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Perimeter</span><span className="font-mono">{fmt(2*(r.Lg+r.Bg), 2)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Base area</span><span className="font-mono">{fmt(r.Lg*r.Bg, 2)} m²</span></div>
              </div>
            </div>

            {/* Converse-Labarre formula display */}
            <div className="rounded border border-gray-100 p-3 text-[11px] font-mono bg-gray-50 text-gray-600">
              <div className="font-semibold text-primary mb-1">Converse-Labarre</div>
              <div>θ = arctan(D/s) = arctan({p.D}/{p.s}) = {fmt(Math.atan(p.D/p.s)*180/Math.PI, 2)}°</div>
              <div>η = 1 − θ/90 × [(nR−1)nC + (nC−1)nR] / (nR×nC)</div>
              <div>  = 1 − {fmt(Math.atan(p.D/p.s)*180/Math.PI,2)}/90 × [{(p.nR-1)*p.nC+(p.nC-1)*p.nR}] / {p.nR*p.nC}</div>
              <div className="font-bold text-primary">  = {fmt(r.eta, 4)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

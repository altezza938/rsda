/**
 * Nail Head RC Punching Shear Tab — CPoC2004 Table 6.3.
 * Verification: vmax=2.0, v=1.0, vc=1.042 N/mm² ✓
 */
import { useState, useMemo } from 'react'
import { nailHeadCheck } from '../calculations/nailHead.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = {
  fcu: 30,
  t: 200,
  cover: 50,
  barSize: 10,
  barSpacing: 200,
  plateSide: 150,
  nailForce: 60,
  fyv: 250,
  linkSize: 8,
}

export default function NailHeadTab() {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => {
    try { return nailHeadCheck({ ...p }) } catch { return null }
  }, [p])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const StatusBadge = ({ ok, children }) => (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ok ? 'bg-green-100 text-pass' : 'bg-red-100 text-fail'}`}>
      {children} {ok ? '✓' : '✗'}
    </span>
  )

  return (
    <div className="grid grid-cols-[260px_1fr] gap-0 min-h-0">

      {/* Left: inputs */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Nail Head — Punching Shear
        </div>
        <Section title="Concrete">
          <NumInput label="fcu" unit="MPa" value={p.fcu} onChange={f('fcu')} min={20} max={60} step={5} />
          <NumInput label="Thickness t" unit="mm" value={p.t} onChange={f('t')} min={100} max={400} step={25} />
          <NumInput label="Cover" unit="mm" value={p.cover} onChange={f('cover')} min={25} max={100} step={5} />
        </Section>
        <Section title="Reinforcement">
          <NumInput label="Bar dia" unit="mm" value={p.barSize} onChange={f('barSize')} min={6} max={20} step={2} tooltip="Main bar diameter" />
          <NumInput label="Spacing" unit="mm" value={p.barSpacing} onChange={f('barSpacing')} min={75} max={400} step={25} />
          <NumInput label="Fyv (link)" unit="MPa" value={p.fyv} onChange={f('fyv')} min={250} max={500} step={50} />
          <NumInput label="Link dia" unit="mm" value={p.linkSize} onChange={f('linkSize')} min={6} max={16} step={2} />
        </Section>
        <Section title="Nail Head Plate">
          <NumInput label="Plate side" unit="mm" value={p.plateSide} onChange={f('plateSide')} min={100} max={400} step={25} tooltip="Square bearing plate" />
          <NumInput label="Nail force V" unit="kN" value={p.nailForce} onChange={f('nailForce')} min={1} max={500} step={5} />
        </Section>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'v max (face)', val: r?.vmax, limit: r?.vmaxLimit, ok: r?.vmaxOK, unit: 'N/mm²' },
            { label: 'v (critical perim)', val: r?.v1, limit: r?.vc, ok: r && r.v1 <= r.vc, unit: 'N/mm²' },
            { label: 'vc (design)', val: r?.vc, unit: 'N/mm²' },
          ].map(({ label, val, limit, ok, unit }) => (
            <div key={label} className="rounded border border-gray-200 p-2 text-center">
              <div className="text-[10px] text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold text-primary font-mono">{fmt(val, 3)}</div>
              <div className="text-[10px] text-gray-400">{unit}</div>
              {limit != null && (
                <div className="mt-1">
                  <StatusBadge ok={ok}>limit {fmt(limit, 3)}</StatusBadge>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall result banner */}
        <div className={`rounded-lg border-2 p-3 mb-4 text-center ${r?.pass ? 'border-pass bg-green-50' : 'border-fail bg-red-50'}`}>
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Punching Shear Check</div>
          <div className={`text-2xl font-bold ${r?.pass ? 'text-pass' : 'text-fail'}`}>
            {r?.pass ? 'PASS' : 'FAIL'}
          </div>
          {r?.needLinks && (
            <div className="text-sm text-gray-700 mt-1 font-semibold">
              Shear links required: {r.nLinks}× T{r.linkSize} @ {r.linkSpacing}mm
            </div>
          )}
          {!r?.needLinks && r && (
            <div className="text-sm text-gray-500 mt-1">
              No shear links required (v ≤ vc)
            </div>
          )}
        </div>

        {/* Geometry info */}
        {r && (
          <div className="mb-4 rounded border border-gray-200 p-3 text-xs">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Section Properties</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'eff. depth d', val: `${fmt(r.h, 0)} mm` },
                { label: 'As per m', val: `${fmt(r.As_per_m, 1)} mm²/m` },
                { label: 'As (critical)', val: `${fmt(r.As, 1)} mm²` },
                { label: '100As/bd', val: fmt(r.As_over_bd, 4) },
                { label: 'depth factor', val: fmt(r.depth_factor, 4) },
                { label: 'fcu factor', val: fmt(r.fcu_factor, 4) },
                { label: 'u₀ (face)', val: `${fmt(r.u0, 0)} mm` },
                { label: 'u₁ (1.5d)', val: `${fmt(r.u1, 0)} mm` },
                { label: 'u₂ (2.25d)', val: `${fmt(r.u2, 0)} mm` },
              ].map(({ label, val }) => (
                <div key={label} className="rounded border border-gray-100 p-1.5 bg-gray-50">
                  <div className="text-[10px] text-gray-400">{label}</div>
                  <div className="font-mono font-semibold text-gray-700">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check at 2nd perimeter */}
        {r && (
          <div className="mb-4 rounded border border-gray-200 p-3 text-xs">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Second Critical Perimeter (2.25d)</div>
            <div className="flex items-center gap-4">
              <div>v₂ = <span className="font-mono font-bold">{fmt(r.v2, 3)} N/mm²</span></div>
              <div>vc = <span className="font-mono font-bold">{fmt(r.vc, 3)} N/mm²</span></div>
              <StatusBadge ok={r.secondOK}>v₂ {'≤'} vc</StatusBadge>
            </div>
          </div>
        )}

        <CalcBreakdown title="CPoC2004 Punching Shear Calculation">
          {r && <>
            <CalcLine label="Effective depth" expr={`d = t/2 = ${p.t}/2`} result={`${r.h} mm`} />
            <CalcLine label="Steel ratio" expr={`100As/bd = 100 × ${fmt(r.As,1)} / (${p.plateSide} × ${r.h})`} result={fmt(r.As_over_bd, 4)} />
            <CalcLine label="Depth factor" expr={`(400/d)^0.25 = (400/${r.h})^0.25`} result={fmt(r.depth_factor, 4)} />
            <CalcLine label="fcu factor" expr={`(fcu/25)^(1/3) = (${p.fcu}/25)^(1/3)`} result={fmt(r.fcu_factor, 4)} />
            <CalcLine label="vc" expr={`0.79 × (100As/bd)^(1/3) × (400/d)^(1/4) / 1.25 × (fcu/25)^(1/3)`}
              result={`${fmt(r.vc, 3)} N/mm²`} />
            <CalcLine label="v at face" expr={`V / (u₀ × d) = ${p.nailForce*1000} / (${r.u0} × ${r.h})`}
              result={`${fmt(r.vmax, 3)} N/mm²`} pass={r.vmaxOK} />
            <CalcLine label="v at 1.5d" expr={`V / (u₁ × d) = ${p.nailForce*1000} / (${r.u1} × ${r.h})`}
              result={`${fmt(r.v1, 3)} N/mm²`} pass={r.v1 <= r.vc} />
            {r.needLinks && (
              <CalcLine label="Links required" expr={`Asv = (v−vc)·u₁·d / (0.87 fyv)`}
                result={`${r.Asv} mm² → ${r.nLinks}×T${r.linkSize}@${r.linkSpacing}mm`} />
            )}
          </>}
        </CalcBreakdown>
      </div>
    </div>
  )
}

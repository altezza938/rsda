/**
 * Shallow Foundation — Vesic bearing capacity + elastic & consolidation settlement.
 */
import { useState, useMemo } from 'react'
import { vesicBearing } from '../calculations/bearingCapacity.js'
import { elasticSettlement, consolidationLayer, boussinesqCenter } from '../calculations/settlement.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = {
  // Footing
  B: 2.5, L: 3.0, Df: 1.5,
  // Soil (foundation level)
  cf: 10, phif: 28, gamma_f: 19,
  Q: 500, Qs: 0, eb: 0, el: 0, beta: 0, mu: 0, FOS: 3,
  // Settlement params
  Es: 20000, nu: 0.35, Iw: 0.82,
  // Consolidation layer
  Cc: 0.3, Cs: 0.06, e0: 0.9, H_clay: 4, sigma_v0: 60, sigma_pc: null,
}

export default function ShallowFoundationTab() {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const bearing = useMemo(() => {
    try { return vesicBearing({ ...p, B: p.B, L: p.L }) } catch { return null }
  }, [p])

  const q_net = p.Q / (p.B * p.L)   // net applied pressure
  const q_allow = bearing ? bearing.qu / p.FOS : null

  const elastic = useMemo(() => {
    try { return elasticSettlement({ q: q_net, B: p.B, L: p.L, Es: p.Es, nu: p.nu, Iw: p.Iw }) }
    catch { return null }
  }, [p, q_net])

  const consol = useMemo(() => {
    try {
      const dSigma = boussinesqCenter ? boussinesqCenter({ q: q_net, B: p.B, L: p.L, z: p.H_clay / 2 }) : { sigma_z: q_net * 0.7 }
      return consolidationLayer({ Cc: p.Cc, Cs: p.Cs, e0: p.e0, H: p.H_clay, sigma_v0: p.sigma_v0, delta_sigma: dSigma.sigma_z, sigma_pc: p.sigma_pc || null })
    } catch { return null }
  }, [p, q_net])

  const Se_mm = elastic?.SeInMM ?? 0
  const Sc_mm = consol?.ScInMM ?? 0
  const total_mm = Se_mm + Sc_mm

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const pass = q_allow != null && q_net <= q_allow

  return (
    <div className="grid grid-cols-[260px_1fr] gap-0 min-h-0">
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Shallow Foundation
        </div>
        <Section title="Footing Geometry">
          <NumInput label="B (width)" unit="m" value={p.B} onChange={f('B')} min={0.3} max={20} step={0.1} />
          <NumInput label="L (length)" unit="m" value={p.L} onChange={f('L')} min={0.3} max={50} step={0.1} />
          <NumInput label="Df (depth)" unit="m" value={p.Df} onChange={f('Df')} min={0} max={5} step={0.1} />
        </Section>
        <Section title="Soil at Foundation">
          <NumInput label="c'" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={100} />
          <NumInput label="φ'" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
          <NumInput label="γ" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={24} />
        </Section>
        <Section title="Load">
          <NumInput label="Q (normal)" unit="kN" value={p.Q} onChange={f('Q')} min={0} max={50000} step={50} />
          <NumInput label="FOS" unit="" value={p.FOS} onChange={f('FOS')} min={1} max={5} step={0.5} />
        </Section>
        <Section title="Elastic Settlement">
          <NumInput label="Es" unit="kPa" value={p.Es} onChange={f('Es')} min={500} max={200000} step={1000} tooltip="Young's modulus of soil" />
          <NumInput label="ν (Poisson)" unit="" value={p.nu} onChange={f('nu')} min={0.1} max={0.5} step={0.05} />
          <NumInput label="Iw (influence)" unit="" value={p.Iw} onChange={f('Iw')} min={0.5} max={1.2} step={0.05} tooltip="Settlement influence factor" />
        </Section>
        <Section title="Consolidation Layer">
          <NumInput label="H (layer)" unit="m" value={p.H_clay} onChange={f('H_clay')} min={0} max={20} step={0.5} />
          <NumInput label="Cc" unit="" value={p.Cc} onChange={f('Cc')} min={0.05} max={1.5} step={0.05} />
          <NumInput label="e₀" unit="" value={p.e0} onChange={f('e0')} min={0.3} max={3.0} step={0.05} />
          <NumInput label="σ'v0" unit="kPa" value={p.sigma_v0} onChange={f('sigma_v0')} min={5} max={500} step={5} />
          <NumInput label="σ'pc" unit="kPa" value={p.sigma_pc ?? 0} onChange={v => f('sigma_pc')(v || null)} min={0} max={1000} step={10} tooltip="0 = NC" />
        </Section>
      </div>

      <div className="overflow-y-auto px-4 py-3">

        {/* Bearing adequacy */}
        <div className={`rounded-lg border-2 p-3 mb-4 ${pass ? 'border-pass bg-green-50' : 'border-fail bg-red-50'}`}>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bearing Capacity Check</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'q applied', val: q_net, unit: 'kPa' },
              { label: 'qult (Vesic)', val: bearing?.qu, unit: 'kPa', color: 'text-primary' },
              { label: 'q allow = qult/FOS', val: q_allow, unit: 'kPa', color: pass ? 'text-pass' : 'text-fail' },
            ].map(({ label, val, unit, color = '' }) => (
              <div key={label} className="text-center">
                <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                <div className={`text-xl font-bold font-mono ${color}`}>{fmt(val, 2)}</div>
                <div className="text-[10px] text-gray-400">{unit}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm font-bold">
            {pass ? '✓ Bearing OK' : '✗ Bearing FAILED — increase B or Df'}
          </div>
        </div>

        {/* Settlement summary */}
        <div className="rounded-lg border-2 border-primary bg-pale p-3 mb-4">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Settlement Estimate</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-gray-400">Elastic Se</div>
              <div className="text-xl font-bold font-mono text-secondary">{fmt(Se_mm, 1)}</div>
              <div className="text-[10px] text-gray-400">mm</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Consolidation Sc</div>
              <div className="text-xl font-bold font-mono text-uls">{fmt(Sc_mm, 1)}</div>
              <div className="text-[10px] text-gray-400">mm</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Total S</div>
              <div className="text-2xl font-bold font-mono text-primary">{fmt(total_mm, 1)}</div>
              <div className="text-[10px] text-gray-400">mm</div>
            </div>
          </div>
        </div>

        {/* Bearing factors */}
        {bearing && (
          <div className="mb-3 rounded border border-gray-200 p-2 text-xs">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Vesic Bearing Factors</div>
            <div className="grid grid-cols-4 gap-1">
              {[['Nq', bearing.Nq], ['Nc', bearing.Nc], ['Nγ', bearing.Ng],
                ['Sq', bearing.Sq], ['Sc', bearing.Sc], ['Sγ', bearing.Sγ]].map(([k, v]) => (
                <div key={k} className="flex justify-between border border-gray-100 rounded px-1.5 py-0.5 bg-gray-50">
                  <span className="text-gray-400 font-mono text-[10px]">{k}</span>
                  <span className="font-mono text-[10px]">{fmt(v, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <CalcBreakdown title="Elastic Settlement">
          <CalcLine label="q net" expr={`Q/(B×L) = ${p.Q}/(${p.B}×${p.L})`} result={`${fmt(q_net, 2)} kPa`} />
          <CalcLine label="Se" expr={`q·B·(1−ν²)/Es·Iw`} result={`${fmt(Se_mm, 2)} mm`} />
        </CalcBreakdown>

        <CalcBreakdown title="Consolidation Settlement">
          <CalcLine label="Δσ at mid-layer (Boussinesq)" result={`${fmt(consol?.delta_sigma, 2)} kPa`} />
          <CalcLine label="Type" result={consol?.type} />
          <CalcLine label="Sc" result={`${fmt(Sc_mm, 2)} mm`} />
        </CalcBreakdown>
      </div>
    </div>
  )
}

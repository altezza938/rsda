/**
 * Bearing Capacity Tab — Full Vesic formula per GG1 p.239.
 * Verification (R376 ULS x=0): qult=167.849 kPa ✓
 */
import { useState, useMemo } from 'react'
import { vesicBearing } from '../calculations/bearingCapacity.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = {
  cf: 4, phif: 30, gamma_f: 19,
  B: 0.5, L: 16.8, Df: 3.33,
  Q: 82.055, Qs: 82.055,
  beta: 0, mu: 0.26,
  eb: 0, el: 0,
  FOS: 1,
}

export default function BearingCapacityTab({ onResultChange }) {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => {
    try {
      const res = vesicBearing({ ...p })
      onResultChange?.(res.qu)
      return res
    } catch { return null }
  }, [p])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const factors = r ? [
    { name: 'Nq', v: r.Nq }, { name: 'Nc', v: r.Nc }, { name: 'Nγ', v: r.Ng },
    { name: 'Sq', v: r.Sq }, { name: 'Sc', v: r.Sc }, { name: 'Sγ', v: r.Sγ },
    { name: 'iq', v: r.iq }, { name: 'ic', v: r.ic }, { name: 'iγ', v: r.iγ },
    { name: 'tq', v: r.tq }, { name: 'tc', v: r.tc }, { name: 'tγ', v: r.tγ },
    { name: 'Gq', v: r.Gq }, { name: 'Gc', v: r.Gc }, { name: 'Gγ', v: r.Gγ },
  ] : []

  return (
    <div className="grid grid-cols-[260px_1fr] gap-0 min-h-0">

      {/* Left: inputs */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Vesic Bearing Capacity
        </div>
        <Section title="Foundation">
          <NumInput label="c'f" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={200} />
          <NumInput label="φ'f" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
          <NumInput label="γf" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={25} />
          <NumInput label="Df" unit="m" value={p.Df} onChange={f('Df')} min={0} max={20} />
        </Section>
        <Section title="Footing">
          <NumInput label="B'" unit="m" value={p.B} onChange={f('B')} min={0.1} max={20} />
          <NumInput label="L'" unit="m" value={p.L} onChange={f('L')} min={0.1} max={100} tooltip="Large L → strip footing" />
          <NumInput label="eb" unit="m" value={p.eb} onChange={f('eb')} min={0} step={0.01} tooltip="Eccentricity along B" />
          <NumInput label="el" unit="m" value={p.el} onChange={f('el')} min={0} step={0.01} tooltip="Eccentricity along L" />
        </Section>
        <Section title="Loads">
          <NumInput label="Qn (normal)" unit="kN/m" value={p.Q} onChange={f('Q')} min={0} max={5000} />
          <NumInput label="Qs (shear)" unit="kN/m" value={p.Qs} onChange={f('Qs')} min={0} max={5000} />
        </Section>
        <Section title="Geometry">
          <NumInput label="β (slope)" unit="°" value={p.beta} onChange={f('beta')} min={0} max={30} tooltip="Ground slope angle" />
          <NumInput label="μ (tilt)" unit="rad" value={p.mu} onChange={f('mu')} min={0} max={0.5} step={0.01} tooltip="Base tilt (radians)" />
          <NumInput label="FOS" unit="" value={p.FOS} onChange={f('FOS')} min={1} max={5} step={0.5} tooltip="Factor of safety applied to qult" />
        </Section>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">

        {/* Result banner */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'c\' component', val: r?.comp_c, colour: 'text-primary' },
            { label: 'γB\' component', val: r?.comp_γ, colour: 'text-secondary' },
            { label: 'q\' component', val: r?.comp_q, colour: 'text-uls' },
          ].map(({ label, val, colour }) => (
            <div key={label} className="rounded border border-gray-200 p-2 text-center">
              <div className="text-[10px] text-gray-400 mb-1">{label}</div>
              <div className={`text-lg font-bold ${colour}`}>{fmt(val, 2)}</div>
              <div className="text-[10px] text-gray-400">kPa</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border-2 border-primary bg-pale p-3 mb-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ultimate Bearing Capacity</div>
          <div className="text-4xl font-bold text-primary">{fmt(r?.qu, 3)} kPa</div>
          {p.FOS > 1 && (
            <div className="text-sm text-gray-600 mt-1">
              q_allow = {r ? (r.qu / p.FOS).toFixed(3) : '—'} kPa (÷ {p.FOS})
            </div>
          )}
        </div>

        {/* Factor table */}
        <div className="mb-3">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Bearing Factors</div>
          <div className="grid grid-cols-3 gap-1">
            {factors.map(({ name, v }) => (
              <div key={name} className="flex justify-between text-xs border border-gray-100 rounded px-2 py-1 bg-gray-50">
                <span className="text-gray-500 font-mono">{name}</span>
                <span className="font-mono font-semibold">{fmt(v, 4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full breakdown */}
        <div className="overflow-x-auto rounded border border-gray-200 text-[11px] mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="px-2 py-1 text-left border-r border-gray-600">Component</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Capacity Factor</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Shape</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Inclin.</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Tilt</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Ground</th>
                <th className="px-2 py-1 text-right">Value (kPa)</th>
              </tr>
            </thead>
            <tbody>
              {r && [
                { label: "c'·Nc·Sc·ic·tc·Gc", N: r.Nc, S: r.Sc, i: r.ic, t: r.tc, G: r.Gc, val: r.comp_c, base: p.cf },
                { label: '½γB\'·Nγ·Sγ·iγ·tγ·Gγ', N: r.Ng, S: r.Sγ, i: r.iγ, t: r.tγ, G: r.Gγ, val: r.comp_γ, base: 0.5 * p.gamma_f * r.Bprime },
                { label: "q'·Nq·Sq·iq·tq·Gq", N: r.Nq, S: r.Sq, i: r.iq, t: r.tq, G: r.Gq, val: r.comp_q, base: r.qover },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 border-r border-gray-100 font-mono text-primary">{row.label}</td>
                  <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.N, 4)}</td>
                  <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.S, 4)}</td>
                  <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.i, 4)}</td>
                  <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.t, 4)}</td>
                  <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.G, 4)}</td>
                  <td className="px-2 py-1 text-right font-mono font-bold">{fmt(row.val, 3)}</td>
                </tr>
              ))}
              <tr className="bg-pale font-bold border-t-2 border-primary text-primary">
                <td colSpan={6} className="px-2 py-1 text-right">qult =</td>
                <td className="px-2 py-1 text-right font-mono">{fmt(r?.qu, 3)} kPa</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CalcBreakdown title="Vesic Formula (GG1 p.239)">
          <CalcLine label="B' = B − 2eb" expr={`${p.B} − ${2*p.eb} = ${fmt(r?.Bprime, 3)} m`} />
          <CalcLine label="q' = γf·Df·cos(β)" expr={`${p.gamma_f}×${p.Df}×cos(${p.beta}°) = ${fmt(r?.qover, 3)} kPa`} />
          <CalcLine label="Nq" expr={`exp(π·tan φ')·tan²(45+φ'/2)`} result={fmt(r?.Nq, 3)} />
          <CalcLine label="Nc" expr={`(Nq−1)/tan(φ')`} result={fmt(r?.Nc, 3)} />
          <CalcLine label="Nγ" expr={`2(Nq+1)·tan(φ')`} result={fmt(r?.Ng, 3)} />
          <CalcLine label="m" expr={`(2+B'/L')/(1+B'/L')`} result={fmt(r?.m, 4)} />
          <CalcLine label="iγ = [1 − Qs/(Qn+B'L'c'cotφ')]^(m+1)" result={fmt(r?.iγ, 4)} />
          <CalcLine label="tγ = (1 − μ·tan φ')²" result={fmt(r?.tγ, 4)} />
          <CalcLine label="qult" expr="c'·Nc·Sc·ic·tc·Gc + ½γ·B'·Nγ·Sγ·iγ·tγ·Gγ + q'·Nq·Sq·iq·tq·Gq"
            result={`${fmt(r?.qu, 3)} kPa`} />
        </CalcBreakdown>
      </div>
    </div>
  )
}

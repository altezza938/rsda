/**
 * Soil Nail Design Tab — 3 failure modes per R376.
 * Verification: FOS_A≥10.62, FOS_B≥25.29, FOS_C≥2.84 ✓
 */
import { useState, useMemo } from 'react'
import { soilNailCheck } from '../calculations/soilNailDesign.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { FOSCard, FOSGrid } from '../components/FOSCard.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULT_ROWS = [
  { id: 1, label: 'Row A', T_demand: 10, barLength: 4, sh: 1.0, layers: [
    { label: 'Fill', c: 0, phi: 30, sigma_v_mid: 20, Le: 3.5 },
  ]},
  { id: 2, label: 'Row B', T_demand: 7, barLength: 4, sh: 1.0, layers: [
    { label: 'Fill', c: 0, phi: 30, sigma_v_mid: 35, Le: 3.5 },
  ]},
  { id: 3, label: 'Row C', T_demand: 3, barLength: 4, sh: 1.0, layers: [
    { label: 'Fill', c: 0, phi: 30, sigma_v_mid: 55, Le: 3.5 },
  ]},
]

const DEFAULTS = {
  diameter_mm: 25,
  drillhole_mm: 150,
  fy: 460,
  fcu: 30,
  beta: 0.5,
  FOS_tension: 1.5,
  FOS_grout_bar: 2,
  inclination_deg: 20,
}

export default function SoilNailTab() {
  const [p, setP] = useState(DEFAULTS)
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const results = useMemo(() => rows.map(row =>
    soilNailCheck({
      ...p,
      barLength: row.barLength,
      T_demand: row.T_demand,
      layers: row.layers,
    })
  ), [p, rows])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const fosColor = (val, min) => val >= min
    ? 'text-pass font-bold'
    : 'text-fail font-bold'

  return (
    <div className="grid grid-cols-[260px_1fr] gap-0 min-h-0">

      {/* Left: inputs */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Soil Nail Design
        </div>
        <Section title="Bar & Drill Hole">
          <NumInput label="Bar dia" unit="mm" value={p.diameter_mm} onChange={f('diameter_mm')} min={16} max={40} step={1} />
          <NumInput label="Drill hole" unit="mm" value={p.drillhole_mm} onChange={f('drillhole_mm')} min={75} max={300} step={5} />
          <NumInput label="Inclination" unit="°" value={p.inclination_deg} onChange={f('inclination_deg')} min={0} max={45} />
        </Section>
        <Section title="Material Strengths">
          <NumInput label="fy" unit="MPa" value={p.fy} onChange={f('fy')} min={250} max={500} step={10} />
          <NumInput label="fcu" unit="MPa" value={p.fcu} onChange={f('fcu')} min={20} max={60} step={5} />
          <NumInput label="β bond" unit="" value={p.beta} onChange={f('beta')} min={0.1} max={1.0} step={0.05} tooltip="Grout-bar bond factor" />
        </Section>
        <Section title="Factors of Safety">
          <NumInput label="FOS tension" unit="" value={p.FOS_tension} onChange={f('FOS_tension')} min={1} max={5} step={0.5} />
          <NumInput label="FOS grout-bar" unit="" value={p.FOS_grout_bar} onChange={f('FOS_grout_bar')} min={1} max={5} step={0.5} />
        </Section>

        {/* Nail rows */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Nail Rows</div>
          {rows.map((row, ri) => (
            <div key={row.id} className="mb-3 border border-gray-200 rounded p-2">
              <div className="text-[11px] font-semibold text-gray-600 mb-1">{row.label}</div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-gray-400">T demand (kN)</span>
                  <input type="number" className="border rounded px-1 py-0.5 text-xs w-full"
                    value={row.T_demand} min={0} step={0.5}
                    onChange={e => setRows(prev => prev.map((r,i) => i===ri ? {...r, T_demand: +e.target.value} : r))} />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400">Length (m)</span>
                  <input type="number" className="border rounded px-1 py-0.5 text-xs w-full"
                    value={row.barLength} min={0.5} step={0.5}
                    onChange={e => setRows(prev => prev.map((r,i) => i===ri ? {...r, barLength: +e.target.value} : r))} />
                </div>
              </div>
              {row.layers.map((lyr, li) => (
                <div key={li} className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-gray-600">
                  <div>c'={lyr.c} kPa</div>
                  <div>φ'={lyr.phi}°</div>
                  <div>σ'v={lyr.sigma_v_mid} kPa</div>
                  <div className="col-span-3">Le={lyr.Le} m ({lyr.label})</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">

        {/* Mode summary table */}
        <div className="mb-4">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">FOS Summary by Failure Mode</div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="px-2 py-1 text-left border-r border-gray-600">Row</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">T demand</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Length</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">FOS_A (≥1.0)</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">FOS_B (≥1.0)</th>
                <th className="px-2 py-1 text-right">FOS_C (≥2.0)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const r = results[i]
                return (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border-r border-gray-100 font-semibold">{row.label}</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{fmt(row.T_demand, 1)} kN</td>
                    <td className="px-2 py-1 border-r border-gray-100 text-right font-mono">{row.barLength} m</td>
                    <td className={`px-2 py-1 border-r border-gray-100 text-right font-mono ${r ? fosColor(r.FOS_A, 1.0) : ''}`}>
                      {r ? fmt(r.FOS_A, 2) : '—'}
                    </td>
                    <td className={`px-2 py-1 border-r border-gray-100 text-right font-mono ${r ? fosColor(r.FOS_B, 1.0) : ''}`}>
                      {r ? fmt(r.FOS_B, 2) : '—'}
                    </td>
                    <td className={`px-2 py-1 text-right font-mono ${r ? fosColor(r.FOS_C, 2.0) : ''}`}>
                      {r ? fmt(r.FOS_C, 2) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Bar properties */}
        {results[0] && (
          <div className="mb-4 rounded border border-gray-200 p-3 text-xs">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Bar & Grout Properties</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Net bar dia', val: `${p.diameter_mm - 4} mm` },
                { label: 'Net bar area', val: `${fmt(results[0].A_bar, 1)} mm²` },
                { label: 'Bar yield force', val: `${fmt(results[0].TT, 2)} kN` },
                { label: 'Drill hole dia', val: `${p.drillhole_mm} mm` },
                { label: 'Bond stress', val: `${fmt(results[0].allowBond_B, 1)} kN/m²` },
                { label: 'Grout perim', val: `${fmt(Math.PI * p.drillhole_mm / 1000, 4)} m` },
              ].map(({ label, val }) => (
                <div key={label} className="rounded border border-gray-100 p-2 bg-gray-50">
                  <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
                  <div className="font-mono font-semibold text-gray-700">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-row breakdown */}
        {rows.map((row, i) => {
          const r = results[i]
          if (!r) return null
          return (
            <CalcBreakdown key={row.id} title={`${row.label} Calculation Breakdown`}>
              <CalcLine label="Mode A — Tensile failure of bar" />
              <CalcLine label="Net bar area" expr={`π·(${p.diameter_mm-4}/1000)²/4`} result={`${fmt(r.A_bar, 2)} mm²`} />
              <CalcLine label="Bar yield force TT" expr={`fy × A = ${p.fy} × ${fmt(r.A_bar,2)} mm²`} result={`${fmt(r.TT, 2)} kN`} />
              <CalcLine label="FOS_A" expr={`TT / T = ${fmt(r.TT,2)} / ${row.T_demand}`} result={fmt(r.FOS_A, 3)} pass={r.FOS_A >= 1.0} />

              <CalcLine label="Mode B — Grout-bar pullout" />
              <CalcLine label="Bond stress" expr={`β√fcu × 1000 = ${p.beta}×√${p.fcu}×1000`} result={`${fmt(r.allowBond_B, 1)} kN/m²`} />
              <CalcLine label="Fmax_B" expr={`bond × π·d_net × L / FOS`} result={`${fmt(r.Fmax_B, 2)} kN`} />
              <CalcLine label="FOS_B" expr={`Fmax_B / T = ${fmt(r.Fmax_B,2)} / ${row.T_demand}`} result={fmt(r.FOS_B, 3)} pass={r.FOS_B >= 1.0} />

              <CalcLine label="Mode C — Soil-grout pullout" />
              {r.layerDetails.map((lyr, li) => (
                <CalcLine key={li} label={`  Layer ${li+1} (${lyr.label || ''})`}
                  expr={`(π·D·c' + 2·D·σ'v·tanφ')·Le`} result={`${fmt(lyr.T_layer, 2)} kN`} />
              ))}
              <CalcLine label="Total T_sg" result={`${fmt(r.T_sg, 2)} kN`} />
              <CalcLine label="FOS_C" expr={`T_sg / T = ${fmt(r.T_sg,2)} / ${row.T_demand}`} result={fmt(r.FOS_C, 3)} pass={r.FOS_C >= 2.0} />
            </CalcBreakdown>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Wall Design Tab — handles both SLS and ULS limit states.
 * R376 Upgraded Wall verification:
 *   Mo=21.124 Mr=42.810 FOS_ot=2.027 FOS_sl=1.508 FOS_bearing=1.023 ✓
 */
import { useState, useMemo } from 'react'
import { wallDesignCheck, buildWeightBlocks } from '../calculations/wallDesign.js'
import { GG1_THRESHOLDS } from '../calculations/constants.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { FOSCard, FOSGrid } from '../components/FOSCard.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'
import WallSVG from '../components/WallSVG.jsx'

const LS = { SLS: 'SLS', ULS: 'ULS' }
const DEG = Math.PI / 180

const DEFAULTS = {
  H: 3.0, B: 0.5, B2: 0.6, H2: 3.0,
  gamma_wall: 22, gamma2: 24,
  Pa: 24.29, delta: 20,
  hw: 1.0,
  phif: 30, deltaB: 27, cf: 0, gamma_f: 19, Df: 0,
  q_allow: 167.849,
  nailRows: [],
}

export default function WallDesignTab({ limitState = 'SLS', externalPa = null, externalDelta = null }) {
  const [p, setP] = useState(DEFAULTS)
  const [useTWPa, setUseTWPa] = useState(false)

  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const Pa    = (useTWPa && externalPa != null) ? externalPa : p.Pa
  const delta = (useTWPa && externalDelta != null) ? externalDelta : p.delta

  const results = useMemo(() => {
    const weightBlocks = buildWeightBlocks({
      H: p.H, B: p.B, gamma_wall: p.gamma_wall,
      B2: p.B2, H2: p.H2, gamma2: p.gamma2,
    })
    return wallDesignCheck({
      H: p.H, B: p.B, weightBlocks,
      Pa, delta,
      hw: p.hw,
      phif: p.phif, deltaB: p.deltaB, cf: p.cf, gamma_f: p.gamma_f, Df: p.Df,
      q_allow: p.q_allow,
      nailRows: p.nailRows,
      limitState,
    })
  }, [p, Pa, delta, limitState])

  const thr = GG1_THRESHOLDS
  const lv  = limitState

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  return (
    <div className="grid grid-cols-[280px_1fr_220px] gap-0 min-h-0">

      {/* ── Left: Inputs ── */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-between">
          <span>Wall Design — {lv}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${lv === 'ULS' ? 'bg-uls' : 'bg-sls'}`}>{lv}</span>
        </div>

        {/* Pa source toggle */}
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={useTWPa} onChange={e => setUseTWPa(e.target.checked)} />
            Use Pa from Tab 1
          </label>
          {useTWPa && externalPa != null && (
            <span className="text-primary font-bold">Pa = {externalPa.toFixed(2)} kN/m</span>
          )}
        </div>

        <Section title="Wall Geometry">
          <NumInput label="H (height)" unit="m" value={p.H} onChange={f('H')} min={0.5} max={20} />
          <NumInput label="B (base)" unit="m" value={p.B} onChange={f('B')} min={0.1} max={5} />
          <NumInput label="B2 (backing)" unit="m" value={p.B2} onChange={f('B2')} min={0} max={5} />
          <NumInput label="H2 (block ht)" unit="m" value={p.H2} onChange={f('H2')} min={0} max={20} />
          <NumInput label="γ wall" unit="kN/m³" value={p.gamma_wall} onChange={f('gamma_wall')} min={18} max={26} />
          <NumInput label="γ block" unit="kN/m³" value={p.gamma2} onChange={f('gamma2')} min={18} max={26} />
        </Section>

        <Section title="Earth Pressure">
          <NumInput label="Pa" unit="kN/m" value={p.Pa} onChange={f('Pa')} min={0} max={500} step={0.1} tooltip="From trial wedge or manual" />
          <NumInput label="δ'" unit="°" value={p.delta} onChange={f('delta')} min={0} max={45} tooltip="Wall friction angle" />
          <NumInput label="hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} tooltip="Groundwater height above base" />
        </Section>

        <Section title="Foundation">
          <NumInput label="φf'" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
          <NumInput label="δb'" unit="°" value={p.deltaB} onChange={f('deltaB')} min={0} max={45} tooltip="Base friction (≈ 0.9 φf')" />
          <NumInput label="cf'" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={100} />
          <NumInput label="γf" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={25} />
          <NumInput label="Df" unit="m" value={p.Df} onChange={f('Df')} min={0} max={5} />
          <NumInput label="q_allow" unit="kPa" value={p.q_allow} onChange={f('q_allow')} min={0} max={1000} step={1} tooltip="From Tab 4" />
        </Section>
      </div>

      {/* ── Centre: Live diagram + force table ── */}
      <div className="overflow-y-auto px-3 py-3 border-r border-gray-200">
        <WallSVG H={p.H} B={p.B} B2={p.B2} hw={p.hw}
          Pa_h={results?.Pa_h ?? 0} Pa_v={results?.Pa_v ?? 0} />

        {/* Force & Moment table */}
        <div className="mt-3 text-xs">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Force & Moment Table</div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="px-2 py-1 text-left border-r border-gray-600">Force</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">kN/m</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Dir</th>
                <th className="px-2 py-1 text-right border-r border-gray-600">Arm m</th>
                <th className="px-2 py-1 text-right">Moment kNm/m</th>
              </tr>
            </thead>
            <tbody>
              {results?.weightBlocks?.map((blk, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-0.5 border-r border-gray-100">{blk.label}</td>
                  <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(blk.W, 2)}</td>
                  <td className="px-2 py-0.5 border-r border-gray-100 text-center text-green-600">↓</td>
                  <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(blk.arm, 2)}</td>
                  <td className="px-2 py-0.5 text-right font-mono text-green-600">{fmt(blk.W * blk.arm, 3)}</td>
                </tr>
              ))}
              <tr className="bg-white">
                <td className="px-2 py-0.5 border-r border-gray-100">Pav</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.Pa_v, 2)}</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-center text-green-600">↓</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.Pa_h > 0 ? -results?.arm_Pah : 0, 2)}</td>
                <td className="px-2 py-0.5 text-right font-mono text-green-600">—</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-2 py-0.5 border-r border-gray-100 text-red-600">Pah</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.Pa_h, 2)}</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-center text-red-600">←</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.arm_Pah, 2)}</td>
                <td className="px-2 py-0.5 text-right font-mono text-red-600">{fmt(results && results.Pa_h * results.arm_Pah, 3)}</td>
              </tr>
              <tr className="bg-white">
                <td className="px-2 py-0.5 border-r border-gray-100 text-blue-500">Pw</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.Pw, 3)}</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-center text-blue-500">←</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.arm_Pw, 3)}</td>
                <td className="px-2 py-0.5 text-right font-mono text-blue-500">{fmt(results && results.Pw * results.arm_Pw, 3)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-2 py-0.5 border-r border-gray-100 text-orange-500">Pup</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.Pup, 3)}</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-center text-orange-500">↑</td>
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(results?.arm_Pup, 3)}</td>
                <td className="px-2 py-0.5 text-right font-mono text-orange-500">{fmt(results && results.Pup * results.arm_Pup, 3)}</td>
              </tr>
              <tr className="bg-pale font-bold border-t-2 border-primary text-primary text-xs">
                <td className="px-2 py-1 border-r border-gray-200" colSpan={4}>
                  Mr = {fmt(results?.Mr, 3)} &nbsp;|&nbsp; Mo = {fmt(results?.Mo, 3)} kNm/m
                </td>
                <td className="px-2 py-1 text-right">N = {fmt(results?.N, 2)} kN/m</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CalcBreakdown title={`${lv} Stability Checks`}>
          <CalcLine label="Overturning moment Mo" expr={`Pah×H/3 − Pav×B + Pw×hw/3 + Pup×2B/3`} result={`${fmt(results?.Mo)} kNm/m`} />
          <CalcLine label="Resisting moment Mr" expr={`Σ(Wi×armᵢ)`} result={`${fmt(results?.Mr)} kNm/m`} />
          <CalcLine label="FOS Overturning" expr={`Mr / Mo = ${fmt(results?.Mr)} / ${fmt(results?.Mo)}`}
            result={fmt(results?.FOS_overturning)} pass={results?.FOS_overturning >= thr.overturning[lv]} />
          <CalcLine label="Normal force N" expr={`ΣW + Pav − Pup`} result={`${fmt(results?.N)} kN/m`} />
          <CalcLine label="FOS Sliding"
            expr={`(N×tan δb' + Fsh) / (Pah+Pw) = (${fmt(results?.N,2)}×tan${p.deltaB}° + ${fmt(results?.Fsh,2)}) / ${fmt(results?.Fh,2)}`}
            result={fmt(results?.FOS_sliding)} pass={results?.FOS_sliding >= thr.sliding[lv]} />
          <CalcLine label="Base pressure" expr={`q = N/B = ${fmt(results?.N,2)} / ${p.B}`}
            result={`${fmt(results?.q_base,2)} kPa`} />
          <CalcLine label="FOS Bearing" expr={`q_allow / q = ${p.q_allow} / ${fmt(results?.q_base,2)}`}
            result={fmt(results?.FOS_bearing)} pass={results?.FOS_bearing >= thr.bearing[lv]} />
        </CalcBreakdown>
      </div>

      {/* ── Right: FOS Cards ── */}
      <div className="overflow-y-auto px-3 py-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Results — {lv}</div>
        <FOSGrid>
          <FOSCard wide label="FOS Overturning" value={results?.FOS_overturning ?? 0}
            threshold={thr.overturning[lv]} level={lv} />
          <FOSCard wide label="FOS Sliding" value={results?.FOS_sliding ?? 0}
            threshold={thr.sliding[lv]} level={lv} />
          <FOSCard wide label="FOS Bearing" value={results?.FOS_bearing ?? 0}
            threshold={thr.bearing[lv]} level={lv} />
        </FOSGrid>

        <div className="rounded border border-gray-200 p-2 text-xs space-y-1 text-gray-700">
          <div className="font-semibold text-primary mb-1">Summary</div>
          <div className="flex justify-between"><span className="text-gray-400">Pa</span><span>{fmt(Pa)} kN/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Pah</span><span>{fmt(results?.Pa_h)} kN/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Pav</span><span>{fmt(results?.Pa_v)} kN/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">N</span><span>{fmt(results?.N)} kN/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Fh</span><span>{fmt(results?.Fh)} kN/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Mo</span><span>{fmt(results?.Mo)} kNm/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Mr</span><span>{fmt(results?.Mr)} kNm/m</span></div>
          <div className="flex justify-between"><span className="text-gray-400">q_base</span><span>{fmt(results?.q_base, 2)} kPa</span></div>
          <div className="flex justify-between"><span className="text-gray-400">q_allow</span><span>{fmt(results?.q_allow, 2)} kPa</span></div>
        </div>
      </div>
    </div>
  )
}

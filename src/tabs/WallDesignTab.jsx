/**
 * Wall Design Tab — SLS and ULS stability checks with design optimization.
 * R376 verification: Mo=21.124 Mr=42.810 FOS_ot=2.027 FOS_sl=1.508 ✓
 */
import { useState, useMemo } from 'react'
import { wallDesignCheck, buildWeightBlocks } from '../calculations/wallDesign.js'
import { GG1_THRESHOLDS } from '../calculations/constants.js'
import { bisect } from '../utils/optimize.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { FOSCard, FOSGrid } from '../components/FOSCard.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'
import { SuggestPanel, SuggestRow, OptimizeResult } from '../components/SuggestPanel.jsx'
import WallSVG from '../components/WallSVG.jsx'

const DEFAULTS = {
  H: 3.0, B: 0.5, B2: 0.6, H2: 3.0,
  gamma_wall: 22, gamma2: 24,
  Pa: 24.29, delta: 20,
  hw: 1.0,
  phif: 30, deltaB: 27, cf: 0, gamma_f: 19, Df: 0,
  q_allow: 167.849,
  nailRows: [],
}

function runCheck(p, Pa, delta, limitState) {
  const weightBlocks = buildWeightBlocks({
    H: p.H, B: p.B, gamma_wall: p.gamma_wall,
    B2: p.B2, H2: p.H2, gamma2: p.gamma2,
  })
  return wallDesignCheck({ H: p.H, B: p.B, weightBlocks, Pa, delta, hw: p.hw,
    phif: p.phif, deltaB: p.deltaB, cf: p.cf, gamma_f: p.gamma_f, Df: p.Df,
    q_allow: p.q_allow, nailRows: p.nailRows, limitState })
}

export default function WallDesignTab({ limitState = 'SLS', externalPa = null, externalDelta = null }) {
  const [p, setP] = useState(DEFAULTS)
  const [useTWPa, setUseTWPa] = useState(false)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const Pa    = (useTWPa && externalPa != null) ? externalPa : p.Pa
  const delta = (useTWPa && externalDelta != null) ? externalDelta : p.delta
  const thr   = GG1_THRESHOLDS
  const lv    = limitState

  const results = useMemo(() => runCheck(p, Pa, delta, lv), [p, Pa, delta, lv])

  /* ── Optimization: find minimum B for each check, then governing ── */
  const opt = useMemo(() => {
    const checkB = (B) => runCheck({ ...p, B }, Pa, delta, lv)

    const B_sl = bisect(B => checkB(B).FOS_sliding    - thr.sliding[lv],    0.05, 10)
    const B_ot = bisect(B => checkB(B).FOS_overturning - thr.overturning[lv], 0.05, 10)
    const B_br = bisect(B => checkB(B).FOS_bearing    - thr.bearing[lv],    0.05, 10)

    const candidates = [B_sl, B_ot, B_br].filter(v => v != null)
    const B_gov = candidates.length ? Math.max(...candidates) : null

    // FOS profile at suggested B
    const rOpt = B_gov ? checkB(B_gov) : null

    return { B_sl, B_ot, B_br, B_gov, rOpt }
  }, [p, Pa, delta, lv, thr])

  /* ── FOS vs B sweep for sparkline ── */
  const sweep = useMemo(() => {
    const pts = []
    for (let B = 0.1; B <= 3.0; B += 0.1) {
      const r = runCheck({ ...p, B }, Pa, delta, lv)
      pts.push({ B: parseFloat(B.toFixed(2)), sl: r.FOS_sliding, ot: r.FOS_overturning, br: r.FOS_bearing })
    }
    return pts
  }, [p, Pa, delta, lv])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const allPass = results &&
    results.FOS_sliding    >= thr.sliding[lv] &&
    results.FOS_overturning >= thr.overturning[lv] &&
    results.FOS_bearing    >= thr.bearing[lv]

  /* ── FOS vs B sparkline (SVG) ── */
  const Sparkline = () => {
    const W = 200, H = 60, pad = { l: 28, r: 8, t: 8, b: 18 }
    const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b
    const maxFOS = 6, Bmax = 3.0
    const px = B => pad.l + (B - 0.1) / (Bmax - 0.1) * iW
    const py = fos => pad.t + iH - Math.min(fos, maxFOS) / maxFOS * iH
    const line = (key, color) =>
      sweep.map((pt, i) => `${i === 0 ? 'M' : 'L'}${px(pt.B)},${py(pt[key])}`).join(' ')

    const thrLines = [
      { val: thr.sliding[lv],     color: '#3B82F6', label: `sl≥${thr.sliding[lv]}` },
      { val: thr.overturning[lv], color: '#8B5CF6', label: `ot≥${thr.overturning[lv]}` },
      { val: thr.bearing[lv],     color: '#F59E0B', label: `br≥${thr.bearing[lv]}` },
    ]

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + iH} stroke="#ccc" strokeWidth="0.5" />
        <line x1={pad.l} y1={pad.t + iH} x2={pad.l + iW} y2={pad.t + iH} stroke="#ccc" strokeWidth="0.5" />
        {/* threshold lines */}
        {thrLines.map(({ val, color, label }) => {
          const y = py(val)
          return y >= pad.t && y <= pad.t + iH
            ? <g key={label}>
                <line x1={pad.l} y1={y} x2={pad.l + iW} y2={y} stroke={color} strokeWidth="0.7" strokeDasharray="3,2" />
              </g>
            : null
        })}
        {/* curves */}
        <path d={line('sl', '')} fill="none" stroke="#3B82F6" strokeWidth="1.2" />
        <path d={line('ot', '')} fill="none" stroke="#8B5CF6" strokeWidth="1.2" />
        <path d={line('br', '')} fill="none" stroke="#F59E0B" strokeWidth="1.2" />
        {/* current B marker */}
        {(() => {
          const cx = px(Math.min(Math.max(p.B, 0.1), 3.0))
          return <line x1={cx} y1={pad.t} x2={cx} y2={pad.t + iH} stroke="#2D6A4F" strokeWidth="1" strokeDasharray="2,2" />
        })()}
        {/* suggested B */}
        {opt.B_gov && (() => {
          const cx = px(Math.min(opt.B_gov, 3.0))
          return <line x1={cx} y1={pad.t} x2={cx} y2={pad.t + iH} stroke="#E74C3C" strokeWidth="1" strokeDasharray="3,2" />
        })()}
        {/* axis labels */}
        <text x={pad.l - 2} y={pad.t + 4}   textAnchor="end" fontSize="6" fill="#999">{maxFOS}</text>
        <text x={pad.l - 2} y={pad.t + iH}  textAnchor="end" fontSize="6" fill="#999">0</text>
        <text x={pad.l}     y={H - 3}        fontSize="6" fill="#999">0.1</text>
        <text x={pad.l + iW} y={H - 3} textAnchor="end" fontSize="6" fill="#999">3.0m B</text>
        {/* legend */}
        {[['sl','#3B82F6'],['ot','#8B5CF6'],['br','#F59E0B']].map(([k,c],i) => (
          <g key={k}>
            <line x1={pad.l + i*52} y1={6} x2={pad.l + i*52 + 8} y2={6} stroke={c} strokeWidth="1.5" />
            <text x={pad.l + i*52 + 10} y={8} fontSize="6" fill={c}>{k}</text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[280px_1fr_240px] gap-0 min-h-0">

      {/* ── Left: Inputs ── */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-between">
          <span>Wall Design — {lv}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${lv === 'ULS' ? 'bg-uls' : 'bg-sls'}`}>{lv}</span>
        </div>

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
          <NumInput label="Pa" unit="kN/m" value={p.Pa} onChange={f('Pa')} min={0} max={500} step={0.1} />
          <NumInput label="δ'" unit="°" value={p.delta} onChange={f('delta')} min={0} max={45} />
          <NumInput label="hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} tooltip="Groundwater above base" />
        </Section>

        <Section title="Foundation">
          <NumInput label="φf'" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
          <NumInput label="δb'" unit="°" value={p.deltaB} onChange={f('deltaB')} min={0} max={45} tooltip="Base friction ≈ 0.9 φf'" />
          <NumInput label="cf'" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={100} />
          <NumInput label="γf" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={25} />
          <NumInput label="Df" unit="m" value={p.Df} onChange={f('Df')} min={0} max={5} />
          <NumInput label="q_allow" unit="kPa" value={p.q_allow} onChange={f('q_allow')} min={0} max={1000} step={1} tooltip="From Tab 4" />
        </Section>
      </div>

      {/* ── Centre: Diagram + tables ── */}
      <div className="overflow-y-auto px-3 py-3 border-r border-gray-200">
        <WallSVG H={p.H} B={p.B} B2={p.B2} hw={p.hw}
          Pa_h={results?.Pa_h ?? 0} Pa_v={results?.Pa_v ?? 0} />

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
                <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">—</td>
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
          <CalcLine label="Overturning moment Mo" expr="Pah×H/3 − Pav×B + Pw×hw/3 + Pup×2B/3" result={`${fmt(results?.Mo)} kNm/m`} />
          <CalcLine label="Resisting moment Mr" expr="Σ(Wi×armᵢ)" result={`${fmt(results?.Mr)} kNm/m`} />
          <CalcLine label="FOS Overturning" expr={`Mr/Mo = ${fmt(results?.Mr)}/${fmt(results?.Mo)}`}
            result={fmt(results?.FOS_overturning)} pass={results?.FOS_overturning >= thr.overturning[lv]} />
          <CalcLine label="FOS Sliding"
            expr={`(N·tan δb' + Fsh)/(Pah+Pw) = (${fmt(results?.N,2)}·tan${p.deltaB}°+${fmt(results?.Fsh,2)})/${fmt(results?.Fh,2)}`}
            result={fmt(results?.FOS_sliding)} pass={results?.FOS_sliding >= thr.sliding[lv]} />
          <CalcLine label="FOS Bearing" expr={`q_allow/q_base = ${p.q_allow}/${fmt(results?.q_base,2)}`}
            result={fmt(results?.FOS_bearing)} pass={results?.FOS_bearing >= thr.bearing[lv]} />
        </CalcBreakdown>
      </div>

      {/* ── Right: FOS + Optimization ── */}
      <div className="overflow-y-auto px-3 py-3">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Results — {lv}</div>
        <FOSGrid>
          <FOSCard wide label="FOS Overturning" value={results?.FOS_overturning ?? 0} threshold={thr.overturning[lv]} level={lv} />
          <FOSCard wide label="FOS Sliding"     value={results?.FOS_sliding ?? 0}     threshold={thr.sliding[lv]}     level={lv} />
          <FOSCard wide label="FOS Bearing"     value={results?.FOS_bearing ?? 0}     threshold={thr.bearing[lv]}     level={lv} />
        </FOSGrid>

        {/* FOS vs B chart */}
        <div className="mb-3 rounded border border-gray-200 p-2 bg-white">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">FOS vs Base Width B</div>
          <Sparkline />
          <div className="text-[9px] text-gray-400 mt-1">
            <span className="text-primary">─</span> current B={p.B}m
            {opt.B_gov && <> &nbsp; <span className="text-fail">─</span> suggested B={opt.B_gov}m</>}
          </div>
        </div>

        {/* Suggested design */}
        <SuggestPanel title={`Optimize Base Width B`} allPass={allPass}>
          <SuggestRow
            label={`FOS Sliding ≥ ${thr.sliding[lv]}`}
            current={p.B} suggested={opt.B_sl} unit="m"
            pass={results?.FOS_sliding >= thr.sliding[lv]}
            onApply={opt.B_sl != null ? () => setP(prev => ({ ...prev, B: opt.B_sl })) : null}
          />
          <SuggestRow
            label={`FOS Overturning ≥ ${thr.overturning[lv]}`}
            current={p.B} suggested={opt.B_ot} unit="m"
            pass={results?.FOS_overturning >= thr.overturning[lv]}
            onApply={opt.B_ot != null ? () => setP(prev => ({ ...prev, B: opt.B_ot })) : null}
          />
          <SuggestRow
            label={`FOS Bearing ≥ ${thr.bearing[lv]}`}
            current={p.B} suggested={opt.B_br} unit="m"
            pass={results?.FOS_bearing >= thr.bearing[lv]}
            onApply={opt.B_br != null ? () => setP(prev => ({ ...prev, B: opt.B_br })) : null}
          />

          {opt.B_gov != null && (
            <div className="mt-2 pt-2 border-t border-amber-200">
              <OptimizeResult
                label="Governing minimum B (all checks)"
                value={opt.B_gov}
                unit="m"
                note={opt.rOpt ? `→ FOS_sl=${fmt(opt.rOpt.FOS_sliding,2)}  FOS_ot=${fmt(opt.rOpt.FOS_overturning,2)}  FOS_br=${fmt(opt.rOpt.FOS_bearing,2)}` : ''}
              />
              <button
                onClick={() => setP(prev => ({ ...prev, B: opt.B_gov }))}
                className="mt-2 w-full py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-green-800">
                Apply Optimised B = {opt.B_gov} m
              </button>
            </div>
          )}
        </SuggestPanel>

        {/* Quick summary */}
        <div className="mt-3 rounded border border-gray-200 p-2 text-xs space-y-1 text-gray-700">
          <div className="font-semibold text-primary mb-1">Summary</div>
          {[
            ['Pa', fmt(Pa)+' kN/m'], ['Pah', fmt(results?.Pa_h)+' kN/m'],
            ['Pav', fmt(results?.Pa_v)+' kN/m'], ['N', fmt(results?.N)+' kN/m'],
            ['Mo', fmt(results?.Mo)+' kNm/m'], ['Mr', fmt(results?.Mr)+' kNm/m'],
            ['q_base', fmt(results?.q_base,2)+' kPa'], ['q_allow', fmt(results?.q_allow,2)+' kPa'],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-400">{k}</span><span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

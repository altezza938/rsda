/**
 * Wall Slenderness Ratio Tab — per GeoGuide 1 and R376.
 * Verification: Lower 3.4/0.2=17, Upper 1.6/0.2=8 ✓
 */
import { useState, useMemo } from 'react'
import { slendernessCheck, SLENDERNESS_LIMIT_GG1, SLENDERNESS_LIMIT_R376 } from '../calculations/slendernessRatio.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { SuggestPanel, SuggestRow, OptimizeResult } from '../components/SuggestPanel.jsx'

const DEFAULT_SECTIONS = [
  { label: 'Lower wall', H: 3.4, t: 0.2 },
  { label: 'Upper wall', H: 1.6, t: 0.2 },
]

export default function SlendernessTab() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS)

  const results = useMemo(() => slendernessCheck(sections), [sections])

  const fmt = (v, d = 2) => v == null ? '—' : Number(v).toFixed(d)

  const updateSection = (i, key, val) => {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
  }

  const addSection = () => {
    setSections(prev => [...prev, { label: `Section ${prev.length + 1}`, H: 3.0, t: 0.3 }])
  }

  const removeSection = i => {
    setSections(prev => prev.filter((_, idx) => idx !== i))
  }

  const StatusBadge = ({ ok, children }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${ok ? 'bg-green-100 text-pass' : 'bg-red-100 text-fail'}`}>
      {children}
    </span>
  )

  return (
    <div className="grid grid-cols-[300px_1fr] gap-0 min-h-0">

      {/* Left: inputs */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Wall Slenderness Ratio
        </div>

        <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-600">
          <div className="flex gap-2 mb-1">
            <span className="rounded px-1.5 py-0.5 bg-gray-200 font-mono">GG1 limit: H/t ≤ {SLENDERNESS_LIMIT_GG1}</span>
            <span className="rounded px-1.5 py-0.5 bg-amber-100 font-mono">R376 flag: H/t ≤ {SLENDERNESS_LIMIT_R376}</span>
          </div>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="border-b border-gray-100 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <input
                className="text-xs font-semibold text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-primary outline-none bg-transparent"
                value={s.label}
                onChange={e => updateSection(i, 'label', e.target.value)}
              />
              {sections.length > 1 && (
                <button onClick={() => removeSection(i)}
                  className="text-[10px] text-gray-400 hover:text-red-500 ml-2">✕</button>
              )}
            </div>
            <div className="space-y-1">
              <NumInput label="H (height)" unit="m" value={s.H}
                onChange={v => updateSection(i, 'H', v)} min={0.1} max={20} step={0.1} />
              <NumInput label="t (thickness)" unit="m" value={s.t}
                onChange={v => updateSection(i, 't', v)} min={0.1} max={2} step={0.05} />
            </div>
          </div>
        ))}

        <div className="px-3 py-2">
          <button onClick={addSection}
            className="w-full py-1 text-xs border border-dashed border-gray-300 rounded text-gray-400 hover:border-primary hover:text-primary">
            + Add Section
          </button>
        </div>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">
        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Slenderness Check Results</div>

        {/* Results table */}
        <div className="mb-6 overflow-x-auto rounded border border-gray-200">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-charcoal text-white">
                <th className="px-3 py-2 text-left border-r border-gray-600">Section</th>
                <th className="px-3 py-2 text-right border-r border-gray-600">H (m)</th>
                <th className="px-3 py-2 text-right border-r border-gray-600">t (m)</th>
                <th className="px-3 py-2 text-right border-r border-gray-600">H/t</th>
                <th className="px-3 py-2 text-center border-r border-gray-600">GG1 (≤{SLENDERNESS_LIMIT_GG1})</th>
                <th className="px-3 py-2 text-center">R376 (≤{SLENDERNESS_LIMIT_R376})</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border-r border-gray-100 font-semibold">{r.label}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-right font-mono">{fmt(r.H)}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-right font-mono">{fmt(r.t)}</td>
                  <td className="px-3 py-2 border-r border-gray-100 text-right font-mono font-bold text-lg">
                    {fmt(r.ratio, 1)}
                  </td>
                  <td className="px-3 py-2 border-r border-gray-100 text-center">
                    <StatusBadge ok={r.passGG1}>{r.passGG1 ? 'OK' : 'NG'}</StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge ok={r.passR376}>{r.passR376 ? 'OK' : 'NG'}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Suggestions per section */}
        {results.map((r, i) => {
          const t_gg1 = parseFloat((r.H / SLENDERNESS_LIMIT_GG1).toFixed(3))
          const t_r376 = parseFloat((r.H / SLENDERNESS_LIMIT_R376).toFixed(3))
          const allPass = r.passGG1 && r.passR376
          return (
            <SuggestPanel key={i} title={`${r.label} — Min Thickness`} allPass={allPass}>
              <SuggestRow label={`GG1: H/t ≤ ${SLENDERNESS_LIMIT_GG1}`}
                current={r.t} suggested={!r.passGG1 ? t_gg1 : null} unit="m" pass={r.passGG1}
                onApply={!r.passGG1 ? () => updateSection(i, 't', t_gg1) : null}
              />
              <SuggestRow label={`R376: H/t ≤ ${SLENDERNESS_LIMIT_R376}`}
                current={r.t} suggested={!r.passR376 ? t_r376 : null} unit="m" pass={r.passR376}
                onApply={!r.passR376 ? () => updateSection(i, 't', t_r376) : null}
              />
              {!allPass && (
                <OptimizeResult
                  label="Required thickness (governing)"
                  value={Math.max(t_gg1, t_r376)}
                  unit="m"
                  note={`GG1 requires ≥ ${t_gg1}m; R376 requires ≥ ${t_r376}m`}
                />
              )}
            </SuggestPanel>
          )
        })}

        {/* Visual bars */}
        <div className="mb-4">
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">H/t Ratio Chart</div>
          {results.map((r, i) => {
            const maxRatio = Math.max(20, ...results.map(x => x.ratio))
            const pct = Math.min(100, (r.ratio / maxRatio) * 100)
            const gg1Pct = (SLENDERNESS_LIMIT_GG1 / maxRatio) * 100
            const r376Pct = (SLENDERNESS_LIMIT_R376 / maxRatio) * 100
            return (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 font-semibold">{r.label}</span>
                  <span className="font-mono font-bold text-gray-700">H/t = {fmt(r.ratio, 1)}</span>
                </div>
                <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                  {/* R376 limit line */}
                  <div className="absolute top-0 bottom-0 border-l-2 border-amber-400 z-10"
                    style={{ left: `${r376Pct}%` }} />
                  {/* GG1 limit line */}
                  <div className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10"
                    style={{ left: `${gg1Pct}%` }} />
                  {/* Value bar */}
                  <div
                    className={`h-full rounded transition-all ${r.passGG1 ? 'bg-pass' : r.passR376 ? 'bg-amber-400' : 'bg-fail'}`}
                    style={{ width: `${pct}%`, opacity: 0.7 }}
                  />
                  <span className="absolute left-1 top-0 bottom-0 flex items-center text-[10px] font-mono font-bold text-white mix-blend-difference">
                    {fmt(r.ratio, 1)}
                  </span>
                </div>
                <div className="flex gap-3 text-[9px] text-gray-400 mt-0.5">
                  <span className="text-amber-500">│ R376 = {SLENDERNESS_LIMIT_R376}</span>
                  <span className="text-red-400">│ GG1 = {SLENDERNESS_LIMIT_GG1}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Code references */}
        <div className="rounded border border-gray-200 p-3 text-xs text-gray-600">
          <div className="font-semibold text-primary mb-1">Code References</div>
          <ul className="space-y-1 list-disc list-inside text-[11px]">
            <li>GeoGuide 1 (GG1): Slenderness ratio H/t ≤ 12 for satisfactory stability</li>
            <li>R376: Flags sections with H/t &gt; 5 for engineering review</li>
            <li>H = unsupported wall height (m); t = wall thickness (m)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

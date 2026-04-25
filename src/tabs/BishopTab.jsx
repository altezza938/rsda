/**
 * Bishop's Simplified Method — circular failure surface, critical circle search.
 */
import { useState, useMemo } from 'react'
import { criticalCircle, generateSlices, bishopCircle } from '../calculations/slopeStability.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = { c: 5, phi: 28, gamma: 19, gammaSat: 20, hw: 0, H: 6, beta: 30 }

export default function BishopTab() {
  const [p, setP] = useState(DEFAULTS)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  function runAnalysis() {
    setRunning(true)
    setTimeout(() => {
      const res = criticalCircle({ H: p.H, beta_deg: p.beta, c: p.c, phi: p.phi, gamma: p.gamma, gammaSat: p.gammaSat, hw: p.hw, nSlices: 20 })
      setResult(res)
      setRunning(false)
    }, 0)
  }

  /* ── SVG slope with failure circle ── */
  const SlopeSVG = ({ res }) => {
    const W = 380, Hs = 260
    const m = { l: 50, r: 20, t: 20, b: 30 }
    const iW = W - m.l - m.r, iH = Hs - m.t - m.b
    const beta_r = p.beta * Math.PI / 180
    const xCrest = p.H / Math.tan(beta_r)
    const xMax   = xCrest * 2.2
    const yMax   = p.H * 2.0

    const sx = x => m.l + (x / xMax) * iW
    const sy = y => m.t + iH - (y / yMax) * iH

    const slopePoints = [
      [sx(-xMax * 0.05), sy(0)],
      [sx(0), sy(0)],
      [sx(xCrest), sy(p.H)],
      [sx(xMax), sy(p.H)],
      [sx(xMax), sy(0)],
    ].map(([x, y]) => `${x},${y}`).join(' ')

    return (
      <svg viewBox={`0 0 ${W} ${Hs}`} className="w-full h-56">
        <defs>
          <pattern id="bp-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#8B7355" strokeWidth="1" />
          </pattern>
          <clipPath id="bp-clip">
            <polygon points={slopePoints} />
          </clipPath>
        </defs>

        {/* Slope fill */}
        <polygon points={slopePoints} fill="url(#bp-hatch)" opacity="0.5" />
        {/* Outline */}
        <polyline points={`${sx(-xMax*0.05)},${sy(0)} ${sx(0)},${sy(0)} ${sx(xCrest)},${sy(p.H)} ${sx(xMax)},${sy(p.H)}`}
          fill="none" stroke="#555" strokeWidth="2" />
        <line x1={sx(-xMax*0.05)} y1={sy(0)} x2={sx(xMax)} y2={sy(0)} stroke="#555" strokeWidth="1.5" />

        {/* Water table */}
        {p.hw > 0 && (
          <line x1={sx(0)} y1={sy(p.H - p.hw)} x2={sx(xMax)} y2={sy(p.H - p.hw)}
            stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="5,3" />
        )}

        {/* Critical circle */}
        {res && (() => {
          const { xc, yc, R, slices } = res
          const cx = sx(xc), cy = sy(yc), Rpx_x = (R / xMax) * iW
          const Rpx_y = (R / yMax) * iH
          const Rpx = (Rpx_x + Rpx_y) / 2  // approximate pixel radius
          return (
            <g>
              <circle cx={cx} cy={cy} r={Rpx}
                fill="none" stroke="#E74C3C" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.8" />
              <circle cx={cx} cy={cy} r={3} fill="#E74C3C" />
              {/* Slices */}
              {slices.map((sl, i) => (
                <line key={i}
                  x1={sx(sl.xm)} y1={sy(sl.ySurf)}
                  x2={sx(sl.xm)} y2={sy(sl.yBase)}
                  stroke="#E74C3C" strokeWidth="0.4" opacity="0.5" />
              ))}
              <text x={cx + 4} y={cy - 4} fontSize="8" fill="#E74C3C">Centre</text>
            </g>
          )
        })()}

        {/* Labels */}
        <text x={sx(0) + 4} y={sy(0) - 4} fontSize="9" fill="#555">Toe</text>
        <text x={sx(xCrest) + 4} y={sy(p.H) - 4} fontSize="9" fill="#555">Crest</text>
        <text x={sx(-xMax*0.03)} y={sy(p.H/2)} fontSize="9" fill="#555" textAnchor="middle"
          transform={`rotate(-90,${sx(-xMax*0.03)},${sy(p.H/2)})`}>H={p.H}m</text>
        {res && (
          <text x={W / 2} y={Hs - 5} textAnchor="middle" fontSize="9"
            fill={res.FS_min >= 1.5 ? '#27AE60' : '#E74C3C'}>
            FS_min = {fmt(res.FS_min, 3)} {res.FS_min >= 1.5 ? '✓ Stable' : '✗ Unstable'}
          </text>
        )}
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[250px_1fr] gap-0 min-h-0">
      {/* Left */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Bishop's Simplified Method
        </div>
        <Section title="Soil Properties">
          <NumInput label="c'" unit="kPa" value={p.c} onChange={f('c')} min={0} max={50} step={1} />
          <NumInput label="φ'" unit="°" value={p.phi} onChange={f('phi')} min={5} max={45} />
          <NumInput label="γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={24} />
          <NumInput label="γsat" unit="kN/m³" value={p.gammaSat} onChange={f('gammaSat')} min={16} max={24} />
        </Section>
        <Section title="Slope Geometry">
          <NumInput label="H (height)" unit="m" value={p.H} onChange={f('H')} min={1} max={30} step={0.5} />
          <NumInput label="β (slope angle)" unit="°" value={p.beta} onChange={f('beta')} min={10} max={70} />
          <NumInput label="hw (water table)" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} step={0.5} tooltip="Depth of WT below crest" />
        </Section>

        <div className="px-3 py-3">
          <button onClick={runAnalysis} disabled={running}
            className={`w-full py-2 rounded text-white text-sm font-bold transition-colors ${running ? 'bg-gray-400 cursor-wait' : 'bg-primary hover:bg-green-800'}`}>
            {running ? 'Searching…' : '▶ Find Critical Circle'}
          </button>
          <div className="mt-2 text-[10px] text-gray-400 text-center">
            Grid search: 8×8 centres × 5 radii = 320 circles
          </div>
        </div>

        {result && (
          <div className="px-3 pb-3 text-xs space-y-1">
            <div className="font-bold text-primary">Critical Circle</div>
            <div className="flex justify-between"><span className="text-gray-400">xc</span><span>{fmt(result.xc)} m</span></div>
            <div className="flex justify-between"><span className="text-gray-400">yc</span><span>{fmt(result.yc)} m</span></div>
            <div className="flex justify-between"><span className="text-gray-400">R</span><span>{fmt(result.R)} m</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Slices</span><span>{result.slices?.length}</span></div>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="overflow-y-auto px-4 py-3">
        <SlopeSVG res={result} />

        {/* FS result */}
        {result ? (
          <>
            <div className={`rounded-lg border-2 p-3 mb-4 text-center ${result.FS_min >= 1.5 ? 'border-pass bg-green-50' : result.FS_min >= 1.25 ? 'border-amber-400 bg-amber-50' : 'border-fail bg-red-50'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Minimum Factor of Safety (Bishop's)</div>
              <div className={`text-4xl font-bold font-mono ${result.FS_min >= 1.5 ? 'text-pass' : result.FS_min >= 1.25 ? 'text-amber-500' : 'text-fail'}`}>
                {fmt(result.FS_min, 3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {result.FS_min >= 1.5 ? '✓ Satisfactory (FS ≥ 1.5)' : result.FS_min >= 1.25 ? '⚠ Marginal' : '✗ Unsatisfactory'}
              </div>
            </div>

            {/* Slice table */}
            {result.slices?.length > 0 && (
              <div className="mb-3 overflow-x-auto rounded border border-gray-200">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-charcoal text-white">
                      {['Slice', 'Width b', 'Height h', 'α (°)', 'W (kN/m)', 'u (kPa)'].map(h => (
                        <th key={h} className="px-2 py-1 text-right border-r border-gray-600 last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.slices.slice(0, 12).map((sl, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-0.5 border-r border-gray-100 text-right">{i + 1}</td>
                        <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(sl.bi, 2)}</td>
                        <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(sl.hi, 2)}</td>
                        <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(sl.alphai * 180 / Math.PI, 1)}</td>
                        <td className="px-2 py-0.5 border-r border-gray-100 text-right font-mono">{fmt(sl.Wi, 2)}</td>
                        <td className="px-2 py-0.5 text-right font-mono">{fmt(sl.ui, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.slices.length > 12 && (
                  <div className="text-center text-[10px] text-gray-400 py-1">
                    … {result.slices.length - 12} more slices
                  </div>
                )}
              </div>
            )}

            <CalcBreakdown title="Bishop's Simplified — Key Equations">
              <CalcLine label="FS = Σ[(c'b + (W−ub)·tanφ')/mα] / Σ(W·sinα)" />
              <CalcLine label="mα = cosα + sinα·tanφ'/FS (iterate)" />
              <CalcLine label="FS converged" result={fmt(result.FS_min, 4)} pass={result.FS_min >= 1.5} />
            </CalcBreakdown>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Press "Find Critical Circle" to run the analysis
          </div>
        )}
      </div>
    </div>
  )
}

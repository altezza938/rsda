/**
 * Infinite Slope Stability — closed-form factor of safety.
 * FS = (c' + (γz·cos²β − u)·tanφ') / (γz·sinβ·cosβ)
 */
import { useState, useMemo } from 'react'
import { infiniteSlope } from '../calculations/slopeStability.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const DEFAULTS = { c: 5, phi: 28, gamma: 19, gammaSat: 20, z: 3, beta: 26, hw: 0 }

const FS_LIMITS = { stable: 1.5, marginal: 1.25 }

export default function InfiniteSlopeTab() {
  const [p, setP] = useState(DEFAULTS)
  const f = k => v => setP(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => { try { return infiniteSlope(p) } catch { return null } }, [p])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  const fsColor = r
    ? r.FS >= FS_LIMITS.stable ? 'text-pass' : r.FS >= FS_LIMITS.marginal ? 'text-amber-500' : 'text-fail'
    : 'text-gray-400'

  /* ── SVG slope cross-section ── */
  const SlopeSVG = () => {
    const W = 300, H_svg = 180
    const margin = { l: 40, r: 20, t: 20, b: 30 }
    const iW = W - margin.l - margin.r, iH = H_svg - margin.t - margin.b

    const beta_r = p.beta * Math.PI / 180
    const L_slope = p.z / Math.sin(beta_r)   // slope length
    const H_wall  = p.z                        // retained height
    const xSpan   = H_wall / Math.tan(beta_r) * 1.5

    const sx = x => margin.l + (x / xSpan) * iW
    const sy = y => margin.t + iH - (y / (H_wall * 1.4)) * iH

    const x0 = 0, y0 = 0
    const xToe = H_wall / Math.tan(beta_r), yTop = H_wall
    const xBase = xSpan, yBase = 0

    // Water table line (hw below surface)
    const hwY = p.hw > 0 ? yTop - p.hw : null

    return (
      <svg viewBox={`0 0 ${W} ${H_svg}`} className="w-full h-44">
        <defs>
          <pattern id="is-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#8B7355" strokeWidth="1" />
          </pattern>
          <pattern id="is-water" width="8" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3" x2="8" y2="3" stroke="#93C5FD" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* Soil mass */}
        <polygon
          points={`${sx(x0)},${sy(y0)} ${sx(xToe)},${sy(yTop)} ${sx(xBase)},${sy(yTop)} ${sx(xBase)},${sy(yBase)}`}
          fill="url(#is-hatch)" opacity="0.6" />

        {/* Slope face */}
        <line x1={sx(x0)} y1={sy(y0)} x2={sx(xToe)} y2={sy(yTop)} stroke="#555" strokeWidth="2" />
        {/* Ground base */}
        <line x1={sx(x0 - xSpan * 0.1)} y1={sy(y0)} x2={sx(xBase)} y2={sy(y0)} stroke="#555" strokeWidth="1.5" />
        {/* Top */}
        <line x1={sx(xToe)} y1={sy(yTop)} x2={sx(xBase)} y2={sy(yTop)} stroke="#555" strokeWidth="1.5" />

        {/* Water table */}
        {hwY != null && (
          <line x1={sx(xToe * 0.3)} y1={sy(hwY)} x2={sx(xBase)} y2={sy(hwY)}
            stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="6,3" />
        )}

        {/* Slice being analysed */}
        {(() => {
          const xMid = xToe * 0.55
          const yBot = 0
          const yTop2 = yMid => yMid * Math.tan(beta_r)
          const sliceW = xToe * 0.12
          const sl = sx(xMid - sliceW / 2), sr = sx(xMid + sliceW / 2)
          const sBot = sy(yBot), sTop = sy(xMid * Math.tan(beta_r))
          return (
            <g>
              <rect x={sl} y={sTop} width={sr - sl} height={sBot - sTop}
                fill="#2D6A4F" fillOpacity="0.3" stroke="#2D6A4F" strokeWidth="1" />
              {/* z dimension */}
              <line x1={(sl + sr) / 2} y1={sTop} x2={(sl + sr) / 2} y2={sBot}
                stroke="#2D6A4F" strokeWidth="0.8" strokeDasharray="3,2" />
              <text x={sr + 3} y={(sTop + sBot) / 2 + 4} fontSize="9" fill="#2D6A4F">z={p.z}m</text>
            </g>
          )
        })()}

        {/* Beta angle */}
        <text x={sx(x0) + 20} y={sy(y0) - 5} fontSize="9" fill="#555">β={p.beta}°</text>

        {/* FS badge */}
        <text x={W / 2} y={H_svg - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">
          Infinite Slope — FS = {r ? fmt(r.FS, 3) : '—'}
        </text>
      </svg>
    )
  }

  /* ── FS bar chart for β sweep ── */
  const SweepChart = () => {
    const pts = []
    for (let b = 10; b <= 60; b += 2) {
      const res = infiniteSlope({ ...p, beta: b })
      pts.push({ b, FS: res.FS })
    }
    const W = 280, H_c = 80, pl = 28, pb = 18, pr = 8, pt = 8
    const iW = W - pl - pr, iH = H_c - pb - pt
    const maxFS = 4
    const px = b => pl + ((b - 10) / 50) * iW
    const py = fs => pt + iH - Math.min(fs, maxFS) / maxFS * iH
    const path = pts.map((pt2, i) => `${i === 0 ? 'M' : 'L'}${px(pt2.b)},${py(pt2.FS)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H_c}`} className="w-full" style={{ height: H_c }}>
        <line x1={pl} y1={pt} x2={pl} y2={pt + iH} stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1={pl} y1={pt + iH} x2={pl + iW} y2={pt + iH} stroke="#e5e7eb" strokeWidth="0.5" />
        {[1.0, 1.25, 1.5, 2.0].map(v => (
          <g key={v}>
            <line x1={pl} y1={py(v)} x2={pl + iW} y2={py(v)} stroke={v >= 1.5 ? '#27AE60' : v >= 1.25 ? '#F59E0B' : '#E74C3C'} strokeWidth="0.7" strokeDasharray="3,2" />
            <text x={pl - 2} y={py(v) + 3} fontSize="6" fill="#999" textAnchor="end">{v}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#2D6A4F" strokeWidth="1.5" />
        {/* current beta */}
        <line x1={px(p.beta)} y1={pt} x2={px(p.beta)} y2={pt + iH} stroke="#E74C3C" strokeWidth="1" strokeDasharray="3,2" />
        <text x={pl} y={H_c - 3} fontSize="7" fill="#999">10°</text>
        <text x={pl + iW} y={H_c - 3} fontSize="7" fill="#999" textAnchor="end">60° β</text>
        <text x={pl + iW / 2} y={pt + 8} fontSize="7" fill="#555" textAnchor="middle">FS vs slope angle β</text>
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[250px_1fr] gap-0 min-h-0">
      {/* Left: inputs */}
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Infinite Slope Analysis
        </div>
        <Section title="Soil Properties">
          <NumInput label="c'" unit="kPa" value={p.c} onChange={f('c')} min={0} max={50} step={1} />
          <NumInput label="φ'" unit="°" value={p.phi} onChange={f('phi')} min={0} max={45} />
          <NumInput label="γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={24} />
          <NumInput label="γsat" unit="kN/m³" value={p.gammaSat} onChange={f('gammaSat')} min={16} max={24} />
        </Section>
        <Section title="Geometry">
          <NumInput label="z (depth)" unit="m" value={p.z} onChange={f('z')} min={0.5} max={20} step={0.5} tooltip="Depth of failure plane" />
          <NumInput label="β (slope)" unit="°" value={p.beta} onChange={f('beta')} min={5} max={60} tooltip="Slope angle from horizontal" />
          <NumInput label="hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.z} step={0.1} tooltip="Water table height above failure plane" />
        </Section>
      </div>

      {/* Right: results */}
      <div className="overflow-y-auto px-4 py-3">
        <SlopeSVG />

        {/* FS banner */}
        <div className={`rounded-lg border-2 p-4 mb-4 text-center ${r?.FS >= 1.5 ? 'border-pass bg-green-50' : r?.FS >= 1.25 ? 'border-amber-400 bg-amber-50' : 'border-fail bg-red-50'}`}>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Factor of Safety</div>
          <div className={`text-5xl font-bold font-mono ${fsColor}`}>{fmt(r?.FS, 3)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {r?.FS >= 1.5 ? '✓ Stable' : r?.FS >= 1.25 ? '⚠ Marginal (1.25–1.5)' : '✗ Unstable'}
          </div>
        </div>

        {/* Component cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Normal stress σn', val: r?.sigma_n, unit: 'kPa' },
            { label: "Pore pressure u",  val: r?.u,       unit: 'kPa' },
            { label: 'σn effective',      val: r?.sigma_n_eff, unit: 'kPa' },
            { label: 'Shear demand τd',  val: r?.tau_d,   unit: 'kPa' },
            { label: 'Shear strength τf', val: r?.tau_f,  unit: 'kPa' },
            { label: 'Critical height Hc', val: r?.Hc,   unit: 'm' },
          ].map(({ label, val, unit }) => (
            <div key={label} className="rounded border border-gray-200 p-2 bg-gray-50 text-center">
              <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
              <div className="font-mono font-bold text-gray-700">{fmt(val, 2)}</div>
              <div className="text-[9px] text-gray-400">{unit}</div>
            </div>
          ))}
        </div>

        {/* FS vs β sweep */}
        <div className="mb-4 rounded border border-gray-200 p-2">
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Sensitivity — FS vs Slope Angle</div>
          <SweepChart />
        </div>

        <CalcBreakdown title="Infinite Slope Calculation">
          <CalcLine label="Pore pressure" expr={`u = γw·hw·cos²β = 9.81×${p.hw}×cos²(${p.beta}°)`} result={`${fmt(r?.u, 2)} kPa`} />
          <CalcLine label="Normal stress" expr={`σn = γ·z·cos²β = ${p.gamma}×${p.z}×cos²(${p.beta}°)`} result={`${fmt(r?.sigma_n, 2)} kPa`} />
          <CalcLine label="σn effective" expr={`σn' = σn − u`} result={`${fmt(r?.sigma_n_eff, 2)} kPa`} />
          <CalcLine label="Shear demand" expr={`τd = γ·z·sinβ·cosβ = ${p.gamma}×${p.z}×sin(${p.beta}°)×cos(${p.beta}°)`} result={`${fmt(r?.tau_d, 2)} kPa`} />
          <CalcLine label="Shear strength" expr={`τf = c' + σn'·tanφ' = ${p.c} + ${fmt(r?.sigma_n_eff,2)}×tan(${p.phi}°)`} result={`${fmt(r?.tau_f, 2)} kPa`} />
          <CalcLine label="FS" expr={`τf / τd = ${fmt(r?.tau_f,2)} / ${fmt(r?.tau_d,2)}`} result={fmt(r?.FS, 4)} pass={r?.FS >= 1.5} />
          {r?.Hc != null && <CalcLine label="Critical height Hc" result={`${fmt(r.Hc, 2)} m`} />}
        </CalcBreakdown>
      </div>
    </div>
  )
}

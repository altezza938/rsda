/**
 * Single Pile Capacity — Meyerhof (sand) + Alpha method (clay).
 */
import { useState, useMemo } from 'react'
import { singlePileSand, singlePileClay } from '../calculations/pileCapacity.js'
import { NumInput, Section } from '../components/NumInput.jsx'
import { CalcBreakdown, CalcLine } from '../components/CalcBreakdown.jsx'

const SAND_DEF = { D: 0.5, L: 12, phi: 32, gamma: 19, delta: 24, K: 1.0, FOS: 3 }
const CLAY_DEF = { D: 0.5, L: 12, su: 40, su_tip: 60, alpha: null, FOS: 3 }

export default function SinglePileTab() {
  const [mode, setMode] = useState('sand')
  const [ps, setPs] = useState(SAND_DEF)
  const [pc, setPc] = useState(CLAY_DEF)
  const fs = k => v => setPs(prev => ({ ...prev, [k]: v }))
  const fc = k => v => setPc(prev => ({ ...prev, [k]: v }))

  const r = useMemo(() => {
    try { return mode === 'sand' ? singlePileSand(ps) : singlePileClay(pc) }
    catch { return null }
  }, [mode, ps, pc])

  const fmt = (v, d = 3) => v == null ? '—' : Number(v).toFixed(d)
  const p = mode === 'sand' ? ps : pc

  /* ── SVG pile cross-section ── */
  const PileSVG = () => {
    const W = 200, H_s = 220, ml = 40, mr = 20, mt = 15, mb = 25
    const iH = H_s - mt - mb, iW = W - ml - mr
    const D_px = Math.max(12, Math.min(30, p.D * 20))
    const L_px = iH * 0.85
    const cx = ml + iW / 2

    const pile_top = mt + iH * 0.05
    const pile_bot = pile_top + L_px
    const pl = cx - D_px / 2, pr2 = cx + D_px / 2

    // Skin friction arrows
    const nArr = 6
    const arrowColor = '#52B788'

    return (
      <svg viewBox={`0 0 ${W} ${H_s}`} className="w-full h-48">
        {/* Soil */}
        <rect x={ml} y={mt} width={iW} height={iH} fill="#D4C5A9" opacity="0.4" />
        {/* Pile */}
        <rect x={pl} y={pile_top} width={D_px} height={L_px} fill="#aaa" stroke="#555" strokeWidth="1.5" />
        {/* Tip */}
        <polygon points={`${pl},${pile_bot} ${pr2},${pile_bot} ${cx},${pile_bot + D_px * 0.7}`} fill="#777" />

        {/* Skin friction arrows */}
        {Array.from({ length: nArr }).map((_, i) => {
          const y = pile_top + (i + 0.5) * (L_px / nArr)
          return (
            <g key={i}>
              <line x1={pl - 14} y1={y} x2={pl - 2} y2={y} stroke={arrowColor} strokeWidth="1.2" />
              <polygon points={`${pl - 2},${y} ${pl - 7},${y - 3} ${pl - 7},${y + 3}`} fill={arrowColor} />
            </g>
          )
        })}

        {/* End bearing arrow */}
        <line x1={cx} y1={pile_bot + D_px + 12} x2={cx} y2={pile_bot + D_px + 2} stroke="#E74C3C" strokeWidth="1.5" />
        <polygon points={`${cx},${pile_bot + D_px + 2} ${cx-4},${pile_bot+D_px+8} ${cx+4},${pile_bot+D_px+8}`} fill="#E74C3C" />

        {/* Labels */}
        <text x={cx} y={pile_top - 4} textAnchor="middle" fontSize="8" fill="#555">D={p.D}m</text>
        <text x={ml - 3} y={(pile_top + pile_bot) / 2 + 3} textAnchor="end" fontSize="8" fill="#555"
          transform={`rotate(-90,${ml-3},${(pile_top+pile_bot)/2})`}>L={p.L}m</text>
        <text x={pl - 16} y={(pile_top + pile_bot) / 2} textAnchor="end" fontSize="8" fill={arrowColor}>Qs</text>
        <text x={cx + D_px} y={pile_bot + D_px + 8} fontSize="8" fill="#E74C3C">Qp</text>

        {/* Result */}
        {r && (
          <text x={W / 2} y={H_s - 5} textAnchor="middle" fontSize="8" fill="#2D6A4F">
            Qt = {fmt(r.Qt, 1)} kN · Qa = {fmt(r.Qa, 1)} kN
          </text>
        )}
      </svg>
    )
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-0 min-h-0">
      <div className="overflow-y-auto border-r border-gray-200">
        <div className="px-3 py-2 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
          Single Pile Capacity
        </div>

        {/* Mode toggle */}
        <div className="px-3 py-2 border-b border-gray-100 flex gap-2">
          {['sand', 'clay'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${mode === m ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {m === 'sand' ? '🏖 Sand (Meyerhof)' : '🏔 Clay (Alpha)'}
            </button>
          ))}
        </div>

        {mode === 'sand' ? (
          <>
            <Section title="Pile Geometry">
              <NumInput label="Diameter D" unit="m" value={ps.D} onChange={fs('D')} min={0.1} max={2} step={0.05} />
              <NumInput label="Length L" unit="m" value={ps.L} onChange={fs('L')} min={1} max={60} step={0.5} />
            </Section>
            <Section title="Soil (Sand)">
              <NumInput label="φ'" unit="°" value={ps.phi} onChange={fs('phi')} min={20} max={45} />
              <NumInput label="γ" unit="kN/m³" value={ps.gamma} onChange={fs('gamma')} min={14} max={22} />
              <NumInput label="δ (pile-soil)" unit="°" value={ps.delta} onChange={fs('delta')} min={10} max={40} tooltip="Skin friction angle ≈ 0.75φ'" />
              <NumInput label="K (lateral)" unit="" value={ps.K} onChange={fs('K')} min={0.5} max={2} step={0.1} tooltip="Lateral earth pressure coeff" />
            </Section>
            <Section title="Design">
              <NumInput label="FOS" unit="" value={ps.FOS} onChange={fs('FOS')} min={1} max={5} step={0.5} />
            </Section>
          </>
        ) : (
          <>
            <Section title="Pile Geometry">
              <NumInput label="Diameter D" unit="m" value={pc.D} onChange={fc('D')} min={0.1} max={2} step={0.05} />
              <NumInput label="Length L" unit="m" value={pc.L} onChange={fc('L')} min={1} max={60} step={0.5} />
            </Section>
            <Section title="Soil (Clay)">
              <NumInput label="su (avg)" unit="kPa" value={pc.su} onChange={fc('su')} min={5} max={200} step={5} tooltip="Average undrained shear strength" />
              <NumInput label="su (tip)" unit="kPa" value={pc.su_tip ?? pc.su} onChange={v => fc('su_tip')(v)} min={5} max={400} step={5} tooltip="su at pile tip" />
            </Section>
            <Section title="Design">
              <NumInput label="FOS" unit="" value={pc.FOS} onChange={fc('FOS')} min={1} max={5} step={0.5} />
            </Section>
          </>
        )}
      </div>

      <div className="overflow-y-auto px-4 py-3">
        <PileSVG />

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Skin Friction Qs', val: r?.Qs, color: 'text-secondary' },
            { label: 'End Bearing Qp', val: r?.Qp, color: 'text-fail' },
            { label: 'Total Qt', val: r?.Qt, color: 'text-primary' },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded border border-gray-200 p-2 text-center">
              <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
              <div className={`text-xl font-bold font-mono ${color}`}>{fmt(val, 1)}</div>
              <div className="text-[10px] text-gray-400">kN</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border-2 border-primary bg-pale p-3 mb-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Allowable Pile Capacity</div>
          <div className="text-4xl font-bold text-primary font-mono">{fmt(r?.Qa, 1)} kN</div>
          <div className="text-sm text-gray-500">Qt / FOS = {fmt(r?.Qt,1)} / {p.FOS}</div>
        </div>

        {r && (
          <div className="mb-4 rounded border border-gray-200 p-3 text-xs grid grid-cols-2 gap-1">
            <div className="flex justify-between"><span className="text-gray-400">Shaft area As</span><span className="font-mono">{fmt(r.As, 3)} m²</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Tip area Ap</span><span className="font-mono">{fmt(r.Ap, 4)} m²</span></div>
            {mode === 'sand' && <>
              <div className="flex justify-between"><span className="text-gray-400">Nq</span><span className="font-mono">{fmt(r.Nq, 1)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">fs (unit skin)</span><span className="font-mono">{fmt(r.fs, 2)} kPa</span></div>
              <div className="flex justify-between"><span className="text-gray-400">qp (unit tip)</span><span className="font-mono">{fmt(r.qp, 1)} kPa</span></div>
            </>}
            {mode === 'clay' && <>
              <div className="flex justify-between"><span className="text-gray-400">α (adhesion)</span><span className="font-mono">{fmt(r.alpha, 3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Nc=9 (deep)</span><span className="font-mono">9.00</span></div>
            </>}
          </div>
        )}

        <CalcBreakdown title={`${mode === 'sand' ? 'Meyerhof' : 'Alpha'} Method — Calculation`}>
          {mode === 'sand' && r && <>
            <CalcLine label="Nq" expr={`exp(π·tanφ')·tan²(45+φ'/2)`} result={fmt(r.Nq, 2)} />
            <CalcLine label="σv_avg (capped 150 kPa)" result={`${fmt(Math.min(ps.gamma*ps.L/2, 150), 1)} kPa`} />
            <CalcLine label="fs = K·σv·tanδ" result={`${fmt(r.fs, 2)} kPa`} />
            <CalcLine label="Qs = fs·As" expr={`${fmt(r.fs,2)}×${fmt(r.As,3)}`} result={`${fmt(r.Qs, 2)} kN`} />
            <CalcLine label="qp (capped)" result={`${fmt(r.qp, 1)} kPa`} />
            <CalcLine label="Qp = qp·Ap" expr={`${fmt(r.qp,1)}×${fmt(r.Ap,4)}`} result={`${fmt(r.Qp, 2)} kN`} />
            <CalcLine label="Qa = Qt/FOS" expr={`${fmt(r.Qt,1)}/${ps.FOS}`} result={`${fmt(r.Qa, 2)} kN`} />
          </>}
          {mode === 'clay' && r && <>
            <CalcLine label="α (Tomlinson)" result={fmt(r.alpha, 3)} />
            <CalcLine label="Qs = α·su·As" expr={`${fmt(r.alpha,3)}×${pc.su}×${fmt(r.As,3)}`} result={`${fmt(r.Qs, 2)} kN`} />
            <CalcLine label="Qp = 9·su_tip·Ap" expr={`9×${pc.su_tip??pc.su}×${fmt(r.Ap,4)}`} result={`${fmt(r.Qp, 2)} kN`} />
            <CalcLine label="Qa = Qt/FOS" expr={`${fmt(r.Qt,1)}/${pc.FOS}`} result={`${fmt(r.Qa, 2)} kN`} />
          </>}
        </CalcBreakdown>
      </div>
    </div>
  )
}

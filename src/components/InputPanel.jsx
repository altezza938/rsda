import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { MATERIAL_PRESETS } from '../calculations/constants'
import { gravityWallCheck, cantileverWallCheck } from '../calculations/fosChecks'
import { trialWedge } from '../calculations/trialWedge'
import { miniPileCheck } from '../calculations/miniPile'
import { soilNailCapacity, skinWallFOS } from '../calculations/soilNail'

/* ── Default parameters per wall type ── */
const DEFAULTS = {
  0: {
    H: 3.5, B: 1.8, bt: 0.4, batter: 0,
    gamma: 19, cohesion: 0, phi: 35,
    hw: 0, surcharge: 0,
    gamma_f: 19, cf: 5, phif: 21, Df: 0.5,
    gamma_wall: 24, delta: 23.3,
  },
  1: {
    H: 4.0, batter: 0,
    ts: 0.3, hs: 3.5, tb: 0.5, Lh: 2.0, Lt: 0.5,
    gamma: 19, cohesion: 0, phi: 35,
    hw: 0, surcharge: 0,
    gamma_f: 19, cf: 0, phif: 30, Df: 0.5,
    gamma_wall: 24, delta: 23.3,
  },
  2: {
    H: 3.0, d: 2.0,
    D: 0.3, L: 10, s: 1.5,
    gamma: 19, cohesion: 0, phi: 35,
    gamma_p: 19, phi_p: 35, cohesion_p: 0,
    surcharge: 0,
  },
  3: {
    H: 5.0, batter: 10, hw: 0, surcharge: 0,
    gamma: 19, cohesion: 5, phi: 35,
    delta: 23.3, omega: 10,
    nails: [
      { level_mPD: 4.0, sh: 1.5, inclination_deg: 10, length: 6, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 5.0 },
      { level_mPD: 2.5, sh: 1.5, inclination_deg: 10, length: 8, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 5.0 },
      { level_mPD: 1.0, sh: 1.5, inclination_deg: 10, length: 8, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 5.0 },
    ],
  },
}

/* ── Test cases for each wall type ── */
const TEST_CASES = {
  0: [
    {
      label: 'Default (H=3.5 m)',
      params: DEFAULTS[0],
    },
    {
      label: 'Verify A — H=4 m B=3.2 m (FR146)',
      params: { H: 4, B: 3.2, bt: 0.6, batter: 0, gamma: 20, cohesion: 0, phi: 35, delta: 23.3, hw: 0, surcharge: 0, gamma_f: 20, cf: 0, phif: 35, Df: 0.5, gamma_wall: 24 },
    },
    {
      label: 'Wet fill — H=4 m hw=2 m',
      params: { H: 4, B: 3.2, bt: 0.6, batter: 0, gamma: 20, cohesion: 0, phi: 35, delta: 23.3, hw: 2, surcharge: 0, gamma_f: 20, cf: 0, phif: 35, Df: 0.5, gamma_wall: 24 },
    },
    {
      label: 'Surcharge q=20 kPa',
      params: { H: 4, B: 3.0, bt: 0.5, batter: 0, gamma: 19, cohesion: 0, phi: 35, delta: 23.3, hw: 0, surcharge: 20, gamma_f: 19, cf: 5, phif: 30, Df: 0.5, gamma_wall: 24 },
    },
  ],
  1: [
    {
      label: 'Default (H=4 m)',
      params: DEFAULTS[1],
    },
    {
      label: 'Verify B — H=4.5 m (FR146)',
      params: { H: 4.5, ts: 0.3, tb: 0.5, Lh: 2.5, Lt: 0.6, batter: 0, gamma: 19, cohesion: 0, phi: 32, delta: 21.3, hw: 0, surcharge: 0, gamma_f: 20, cf: 0, phif: 32, Df: 0.5, gamma_wall: 24 },
    },
    {
      label: 'Highway loading — q=20 kPa',
      params: { H: 5, ts: 0.4, tb: 0.6, Lh: 3.0, Lt: 0.8, batter: 0, gamma: 19, cohesion: 0, phi: 35, delta: 23.3, hw: 0, surcharge: 20, gamma_f: 19, cf: 0, phif: 30, Df: 0.5, gamma_wall: 24 },
    },
    {
      label: 'Partial water — H=5 m hw=2 m',
      params: { H: 5, ts: 0.35, tb: 0.55, Lh: 2.8, Lt: 0.7, batter: 0, gamma: 19, cohesion: 0, phi: 33, delta: 22, hw: 2, surcharge: 0, gamma_f: 19, cf: 0, phif: 30, Df: 0.5, gamma_wall: 24 },
    },
  ],
  2: [
    {
      label: 'Default (H=3 m, d=2 m)',
      params: DEFAULTS[2],
    },
    {
      label: 'Larger pile — H=4 m d=3 m',
      params: { H: 4, d: 3, D: 0.4, L: 12, s: 1.5, gamma: 19, cohesion: 0, phi: 35, gamma_p: 19, phi_p: 35, cohesion_p: 0, surcharge: 0 },
    },
    {
      label: 'Dense spacing — s=1.2 m',
      params: { H: 3, d: 2.5, D: 0.3, L: 10, s: 1.2, gamma: 19, cohesion: 0, phi: 33, gamma_p: 19, phi_p: 33, cohesion_p: 0, surcharge: 0 },
    },
  ],
  3: [
    {
      label: 'Default (H=5 m, 3 nails)',
      params: DEFAULTS[3],
    },
    {
      label: 'Tall wall — H=8 m, 4 nails',
      params: {
        H: 8, batter: 10, hw: 0, surcharge: 0,
        gamma: 19, cohesion: 5, phi: 35, delta: 23.3, omega: 10,
        nails: [
          { level_mPD: 7.0, sh: 1.5, inclination_deg: 10, length: 8,  diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 8.0 },
          { level_mPD: 5.5, sh: 1.5, inclination_deg: 10, length: 9,  diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 8.0 },
          { level_mPD: 4.0, sh: 1.5, inclination_deg: 10, length: 10, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 8.0 },
          { level_mPD: 2.5, sh: 1.5, inclination_deg: 10, length: 10, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 8.0 },
        ],
      },
    },
    {
      label: 'Low wall — H=3 m, 2 nails',
      params: {
        H: 3, batter: 8, hw: 0, surcharge: 0,
        gamma: 19, cohesion: 5, phi: 35, delta: 23.3, omega: 8,
        nails: [
          { level_mPD: 2.5, sh: 1.5, inclination_deg: 10, length: 5, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 3.0 },
          { level_mPD: 1.0, sh: 1.5, inclination_deg: 10, length: 6, diameter_mm: 32, drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: 3.0 },
        ],
      },
    },
  ],
}

/* ── Context so all NumInputs know whether sliders are visible ── */
const SliderCtx = createContext(false)

/* ── Shared styled input with internal string state (fixes 0-deletion) ── */
function NumInput({ label, unit, value, onChange, min, max, step = 0.01, tooltip, warning }) {
  const showSliders = useContext(SliderCtx)

  // Keep a raw string so the user can clear/retype freely
  const [raw, setRaw] = useState(value != null ? String(value) : '')
  const focused = useRef(false)

  // Sync from parent only when the input is not focused (e.g. preset / test case loaded)
  useEffect(() => {
    if (!focused.current) {
      setRaw(value != null ? String(value) : '')
    }
  }, [value])

  const numVal = parseFloat(raw)
  const isWarn = warning || (!isNaN(numVal) && (
    (min !== undefined && numVal < min) || (max !== undefined && numVal > max)
  ))

  const handleChange = (e) => {
    setRaw(e.target.value)
    const n = parseFloat(e.target.value)
    if (!isNaN(n)) onChange(n)
  }

  const handleBlur = () => {
    focused.current = false
    const n = parseFloat(raw)
    if (isNaN(n)) {
      // Reset display to last valid value; don't fire onChange
      setRaw(value != null ? String(value) : '0')
    } else {
      onChange(n)
    }
  }

  const sliderVal = isNaN(numVal)
    ? (min ?? 0)
    : Math.min(Math.max(numVal, min ?? -Infinity), max ?? Infinity)

  return (
    <label className="block" title={tooltip}>
      <span className="text-xs text-gray-500 flex items-center gap-1">
        {label}
        {tooltip && <span className="text-gray-400 cursor-help" title={tooltip}>ⓘ</span>}
      </span>
      <div className={`flex items-center border rounded mt-0.5 overflow-hidden ${isWarn ? 'border-fail' : 'border-gray-300'}`}>
        <input
          type="number"
          value={raw}
          step={step}
          min={min}
          max={max}
          onFocus={() => { focused.current = true }}
          onChange={handleChange}
          onBlur={handleBlur}
          className="flex-1 px-2 py-1.5 text-sm focus:outline-none w-0"
        />
        {unit && (
          <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {/* Slider — only when both min and max are defined and sliders are toggled on */}
      {showSliders && min !== undefined && max !== undefined && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderVal}
          onChange={e => {
            const n = parseFloat(e.target.value)
            setRaw(String(n))
            onChange(n)
          }}
          className="w-full mt-1 h-1 cursor-pointer rounded-full appearance-none"
          style={{ accentColor: '#2D6A4F' }}
        />
      )}
    </label>
  )
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-primary bg-pale hover:bg-secondary/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-4 py-3 grid grid-cols-2 gap-3">{children}</div>}
    </div>
  )
}

function PresetButtons({ onApply }) {
  return (
    <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-gray-100">
      <span className="text-xs text-gray-400 w-full mb-1">Material presets:</span>
      {Object.entries(MATERIAL_PRESETS).map(([name, vals]) => (
        <button
          key={name}
          onClick={() => onApply(vals)}
          className="text-xs px-2 py-1 rounded bg-pale text-primary border border-secondary/30 hover:bg-secondary/20 transition-colors"
        >
          {name}
        </button>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   GRAVITY WALL INPUT
════════════════════════════════════════════════ */
function GravityInputs({ p, setP, onApplyPreset }) {
  const f = (k) => (v) => setP(prev => ({ ...prev, [k]: v }))
  return (
    <>
      <PresetButtons onApply={({ gamma, cohesion, phi }) => onApplyPreset({ gamma, cohesion, phi })} />
      <Section title="Wall Geometry">
        <NumInput label="Retained height H" unit="m" value={p.H} onChange={f('H')} min={0.5} max={20} tooltip="Total height of retained fill above wall base" />
        <NumInput label="Base width B" unit="m" value={p.B} onChange={f('B')} min={0.1} max={15} tooltip="Total base width" />
        <NumInput label="Top width bt" unit="m" value={p.bt} onChange={f('bt')} min={0.1} max={5} tooltip="Width at wall crest" />
        <NumInput label="Face batter ω" unit="°" value={p.batter} onChange={f('batter')} min={0} max={20} tooltip="Wall face inclination from vertical" />
        <NumInput label="Wall friction δ" unit="°" value={p.delta} onChange={f('delta')} min={0} max={p.phi} tooltip="Interface friction angle (typically 2/3 φ')" />
        <NumInput label="Wall unit wt γ" unit="kN/m³" value={p.gamma_wall} onChange={f('gamma_wall')} min={18} max={26} />
      </Section>
      <Section title="Retained Soil">
        <NumInput label="Unit weight γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={25} />
        <NumInput label="Cohesion c'" unit="kPa" value={p.cohesion} onChange={f('cohesion')} min={0} max={100} />
        <NumInput label="Friction angle φ'" unit="°" value={p.phi} onChange={f('phi')} min={0} max={45} />
        <NumInput label="Groundwater hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} tooltip="Height of water above wall base" />
        <NumInput label="Surcharge q" unit="kPa" value={p.surcharge} onChange={f('surcharge')} min={0} max={100} />
      </Section>
      <Section title="Foundation">
        <NumInput label="Fd. unit wt γf" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={25} />
        <NumInput label="Fd. cohesion cf'" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={200} />
        <NumInput label="Fd. friction φf'" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
        <NumInput label="Embedment Df" unit="m" value={p.Df} onChange={f('Df')} min={0} max={5} />
      </Section>
    </>
  )
}

/* ════════════════════════════════════════════════
   L-CANTILEVER INPUT
════════════════════════════════════════════════ */
function CantileverInputs({ p, setP, onApplyPreset }) {
  const f = (k) => (v) => setP(prev => ({ ...prev, [k]: v }))
  return (
    <>
      <PresetButtons onApply={({ gamma, cohesion, phi }) => onApplyPreset({ gamma, cohesion, phi })} />
      <Section title="Stem">
        <NumInput label="Stem thickness ts" unit="m" value={p.ts} onChange={f('ts')} min={0.1} max={2} />
        <NumInput label="Stem height hs" unit="m" value={p.hs} onChange={f('hs')} min={0.5} max={20} />
      </Section>
      <Section title="Base">
        <NumInput label="Base thickness tb" unit="m" value={p.tb} onChange={f('tb')} min={0.1} max={2} />
        <NumInput label="Heel length Lh" unit="m" value={p.Lh} onChange={f('Lh')} min={0} max={10} />
        <NumInput label="Toe length Lt" unit="m" value={p.Lt} onChange={f('Lt')} min={0} max={5} />
      </Section>
      <Section title="Wall Geometry">
        <NumInput label="Retained height H" unit="m" value={p.H} onChange={f('H')} min={0.5} max={20} />
        <NumInput label="Wall friction δ" unit="°" value={p.delta} onChange={f('delta')} min={0} max={p.phi} />
        <NumInput label="Wall unit wt γ" unit="kN/m³" value={p.gamma_wall} onChange={f('gamma_wall')} min={18} max={26} />
      </Section>
      <Section title="Retained Soil">
        <NumInput label="Unit weight γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={25} />
        <NumInput label="Cohesion c'" unit="kPa" value={p.cohesion} onChange={f('cohesion')} min={0} max={100} />
        <NumInput label="Friction angle φ'" unit="°" value={p.phi} onChange={f('phi')} min={0} max={45} />
        <NumInput label="Groundwater hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} />
        <NumInput label="Surcharge q" unit="kPa" value={p.surcharge} onChange={f('surcharge')} min={0} max={100} />
      </Section>
      <Section title="Foundation">
        <NumInput label="Fd. unit wt γf" unit="kN/m³" value={p.gamma_f} onChange={f('gamma_f')} min={14} max={25} />
        <NumInput label="Fd. cohesion cf'" unit="kPa" value={p.cf} onChange={f('cf')} min={0} max={200} />
        <NumInput label="Fd. friction φf'" unit="°" value={p.phif} onChange={f('phif')} min={0} max={45} />
        <NumInput label="Embedment Df" unit="m" value={p.Df} onChange={f('Df')} min={0} max={5} />
      </Section>
    </>
  )
}

/* ════════════════════════════════════════════════
   MINI PILE INPUT
════════════════════════════════════════════════ */
function MiniPileInputs({ p, setP }) {
  const f = (k) => (v) => setP(prev => ({ ...prev, [k]: v }))
  return (
    <>
      <Section title="Pile Geometry">
        <NumInput label="Pile diameter D" unit="m" value={p.D} onChange={f('D')} min={0.1} max={1} />
        <NumInput label="Pile length L" unit="m" value={p.L} onChange={f('L')} min={1} max={30} />
        <NumInput label="Pile spacing s" unit="m" value={p.s} onChange={f('s')} min={0.3} max={5} tooltip="Centre-to-centre pile spacing" />
      </Section>
      <Section title="Wall Geometry">
        <NumInput label="Retained height H" unit="m" value={p.H} onChange={f('H')} min={0.5} max={15} />
        <NumInput label="Embedment depth d" unit="m" value={p.d} onChange={f('d')} min={0.5} max={15} />
        <NumInput label="Surcharge q" unit="kPa" value={p.surcharge} onChange={f('surcharge')} min={0} max={100} />
      </Section>
      <Section title="Retained Soil">
        <NumInput label="Unit weight γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={25} />
        <NumInput label="Cohesion c'" unit="kPa" value={p.cohesion} onChange={f('cohesion')} min={0} max={100} />
        <NumInput label="Friction angle φ'" unit="°" value={p.phi} onChange={f('phi')} min={0} max={45} />
      </Section>
      <Section title="Passive Side Soil">
        <NumInput label="Unit weight γp" unit="kN/m³" value={p.gamma_p} onChange={f('gamma_p')} min={14} max={25} />
        <NumInput label="Cohesion cp'" unit="kPa" value={p.cohesion_p} onChange={f('cohesion_p')} min={0} max={100} />
        <NumInput label="Friction angle φp'" unit="°" value={p.phi_p} onChange={f('phi_p')} min={0} max={45} />
      </Section>
    </>
  )
}

/* ════════════════════════════════════════════════
   SKIN WALL + SOIL NAILS INPUT
════════════════════════════════════════════════ */
function SkinWallInputs({ p, setP, onApplyPreset }) {
  if (!p.nails) return null
  const f = (k) => (v) => setP(prev => ({ ...prev, [k]: v }))

  const updateNail = (i, k, v) => setP(prev => {
    const nails = prev.nails.map((n, idx) => idx === i ? { ...n, [k]: v } : n)
    return { ...prev, nails }
  })
  const addNail = () => setP(prev => ({
    ...prev,
    nails: [...prev.nails, {
      level_mPD: prev.H - prev.nails.length - 1, sh: 1.5,
      inclination_deg: 10, length: 6, diameter_mm: 32,
      drill_dia_mm: 100, grout_fcu: 25, steel_fy: 460, wallTopLevel: prev.H,
    }],
  }))
  const removeNail = (i) => setP(prev => ({ ...prev, nails: prev.nails.filter((_, idx) => idx !== i) }))

  return (
    <>
      <PresetButtons onApply={({ gamma, cohesion, phi }) => onApplyPreset({ gamma, cohesion, phi })} />
      <Section title="Wall Geometry">
        <NumInput label="Wall height H" unit="m" value={p.H} onChange={f('H')} min={0.5} max={20} />
        <NumInput label="Batter angle ω" unit="°" value={p.batter} onChange={f('batter')} min={0} max={30} tooltip="Wall face inclination from vertical" />
        <NumInput label="Wall friction δ" unit="°" value={p.delta} onChange={f('delta')} min={0} max={45} />
        <NumInput label="Groundwater hw" unit="m" value={p.hw} onChange={f('hw')} min={0} max={p.H} />
        <NumInput label="Surcharge q" unit="kPa" value={p.surcharge} onChange={f('surcharge')} min={0} max={100} />
      </Section>
      <Section title="Soil Properties">
        <NumInput label="Unit weight γ" unit="kN/m³" value={p.gamma} onChange={f('gamma')} min={14} max={25} />
        <NumInput label="Cohesion c'" unit="kPa" value={p.cohesion} onChange={f('cohesion')} min={0} max={100} />
        <NumInput label="Friction angle φ'" unit="°" value={p.phi} onChange={f('phi')} min={0} max={45} />
      </Section>

      <div className="border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-2.5 bg-pale">
          <span className="text-sm font-semibold text-primary">Soil Nail Rows ({p.nails.length})</span>
          {p.nails.length < 5 && (
            <button onClick={addNail} className="text-xs text-primary border border-primary/30 px-2 py-0.5 rounded hover:bg-primary/10">
              + Add Row
            </button>
          )}
        </div>
        {p.nails.map((nail, i) => (
          <div key={i} className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Row {i + 1}</span>
              <button onClick={() => removeNail(i)} className="text-xs text-fail hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumInput label="Nail level" unit="mPD" value={nail.level_mPD} onChange={v => updateNail(i, 'level_mPD', v)} />
              <NumInput label="Wall top" unit="mPD" value={nail.wallTopLevel} onChange={v => updateNail(i, 'wallTopLevel', v)} />
              <NumInput label="H-spacing sh" unit="m" value={nail.sh} onChange={v => updateNail(i, 'sh', v)} min={0.3} max={3} />
              <NumInput label="Inclination" unit="°" value={nail.inclination_deg} onChange={v => updateNail(i, 'inclination_deg', v)} min={0} max={45} />
              <NumInput label="Length L" unit="m" value={nail.length} onChange={v => updateNail(i, 'length', v)} min={1} max={20} />
              <NumInput label="Bar dia" unit="mm" value={nail.diameter_mm} onChange={v => updateNail(i, 'diameter_mm', v)} min={16} max={50} step={2} />
              <NumInput label="Drill dia" unit="mm" value={nail.drill_dia_mm} onChange={v => updateNail(i, 'drill_dia_mm', v)} min={75} max={200} step={25} />
              <NumInput label="Grout fcu" unit="MPa" value={nail.grout_fcu} onChange={v => updateNail(i, 'grout_fcu', v)} min={15} max={50} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ════════════════════════════════════════════════
   MAIN INPUT PANEL
════════════════════════════════════════════════ */
export default function InputPanel({ wallType, onResults, onParams }) {
  const [params, setParams]         = useState(DEFAULTS[wallType] ?? DEFAULTS[0])
  const [showSliders, setShowSliders] = useState(false)
  const [testCaseIdx, setTestCaseIdx] = useState('')

  // Reset when wall type changes
  useEffect(() => {
    setParams(DEFAULTS[wallType] ?? DEFAULTS[0])
    setTestCaseIdx('')
  }, [wallType])

  // Run calculations on every param change
  useEffect(() => {
    try {
      let results = null
      if (wallType === 0) {
        results = gravityWallCheck(params)
        results.wallType = 0
      } else if (wallType === 1) {
        const B = params.Lt + params.ts + params.Lh
        results = cantileverWallCheck({ ...params, B })
        results.wallType = 1
      } else if (wallType === 2) {
        results = miniPileCheck(params)
        results.wallType = 2
      } else if (wallType === 3) {
        if (!params.nails) return
        const { Pa, thetaCrit, rows: wedgeDetails } = trialWedge({
          H: params.H, gamma: params.gamma, cohesion: params.cohesion,
          phi: params.phi, delta: params.delta, omega: params.batter,
          hw: params.hw, surcharge: params.surcharge,
        })
        const Pa_h = Pa * Math.cos((params.delta + params.batter) * Math.PI / 180)
        const n = params.nails.length || 1
        const T_per_nail = Pa_h / n
        const nailResults = params.nails.map(nail => {
          const T = T_per_nail * nail.sh
          return { ...soilNailCapacity({ ...nail, T_demand: T }), T, nail }
        })
        const fosSlide = skinWallFOS({
          Pa, Pa_h, gamma: params.gamma, phi: params.phi,
          cohesion: params.cohesion, B: params.H * Math.tan(45 * Math.PI / 180),
          hw: params.hw,
          nailRows: params.nails.map((nail, i) => ({
            T: nailResults[i].T, sh: nail.sh, inclination_deg: nail.inclination_deg,
          })),
        })
        results = { Pa, Pa_h, thetaCrit, wedgeDetails, nailResults, fosSlide, wallType: 3 }
      }
      onResults(results)
      onParams(params)
    } catch (e) {
      console.error('Calculation error:', e)
    }
  }, [params, wallType])

  const applyPreset = useCallback(({ gamma, cohesion, phi }) => {
    setParams(prev => ({
      ...prev,
      gamma, cohesion, phi,
      delta: parseFloat((2 / 3 * phi).toFixed(1)),
    }))
  }, [])

  const loadTestCase = (e) => {
    const idx = e.target.value
    setTestCaseIdx(idx)
    if (idx !== '' && TEST_CASES[wallType]?.[parseInt(idx)]) {
      setParams(TEST_CASES[wallType][parseInt(idx)].params)
    }
  }

  return (
    <SliderCtx.Provider value={showSliders}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-between gap-2">
          <span className="shrink-0">Parameters</span>
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Test case dropdown */}
            <select
              value={testCaseIdx}
              onChange={loadTestCase}
              className="min-w-0 flex-1 text-xs bg-gray-700 text-white border border-gray-600 rounded px-1.5 py-0.5 truncate"
            >
              <option value="">Load test case…</option>
              {TEST_CASES[wallType]?.map((tc, i) => (
                <option key={i} value={i}>{tc.label}</option>
              ))}
            </select>
            {/* Slider toggle */}
            <button
              onClick={() => setShowSliders(v => !v)}
              title="Toggle sensitivity sliders"
              className={`shrink-0 text-xs border px-2 py-0.5 rounded transition-colors ${
                showSliders
                  ? 'bg-secondary text-white border-secondary'
                  : 'text-gray-400 border-gray-600 hover:text-white hover:border-gray-400'
              }`}
            >
              {showSliders ? '⇥ Sliders ✓' : '⇥ Sliders'}
            </button>
          </div>
        </div>

        {wallType === 0 && <GravityInputs    p={params} setP={setParams} onApplyPreset={applyPreset} />}
        {wallType === 1 && <CantileverInputs p={params} setP={setParams} onApplyPreset={applyPreset} />}
        {wallType === 2 && <MiniPileInputs   p={params} setP={setParams} />}
        {wallType === 3 && <SkinWallInputs   p={params} setP={setParams} onApplyPreset={applyPreset} />}
      </div>
    </SliderCtx.Provider>
  )
}

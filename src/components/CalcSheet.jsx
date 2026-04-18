/**
 * XLS-style calculation output sheets.
 * Mirrors R376 (gravity/cantilever) and FR146 (soil nails) workbook layout.
 */
import TrialWedgeTable from './TrialWedgeTable'

/* ── Shared helpers ── */
const fmt3 = (v) => (v == null || !isFinite(v) ? '—' : Number(v).toFixed(3))
const fmt1 = (v) => (v == null || !isFinite(v) ? '—' : Number(v).toFixed(1))

function SheetHeader({ title, subtitle }) {
  return (
    <div className="bg-charcoal text-white px-4 py-2 flex items-center justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-secondary">{title}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
      <div className="text-xs text-gray-500">GEO RSDA</div>
    </div>
  )
}

function SectionHead({ children }) {
  return (
    <div className="bg-primary/10 border-l-4 border-primary px-3 py-1 text-xs font-bold text-primary uppercase tracking-wide mt-3 mb-1">
      {children}
    </div>
  )
}

function Row({ label, value, unit, highlight, formula }) {
  return (
    <div className={`flex items-center text-xs border-b border-gray-100 py-0.5 px-3 gap-1 ${highlight ? 'bg-pale font-bold' : ''}`}>
      <span className="flex-1 text-gray-600">{label}</span>
      {formula && <span className="text-gray-300 font-mono text-xs mr-2 hidden xl:inline">{formula}</span>}
      <span className={`font-mono w-20 text-right ${highlight ? 'text-primary' : 'text-charcoal'}`}>{value}</span>
      <span className="text-gray-400 w-12">{unit}</span>
    </div>
  )
}

function TwoCol({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
      <div className="border-r border-gray-100">{left}</div>
      <div>{right}</div>
    </div>
  )
}

function FOSSummaryBar({ label, value, threshold, level }) {
  const pass = value >= threshold
  return (
    <div className={`flex items-center justify-between px-3 py-2 border-b text-xs ${pass ? 'bg-pass/10 border-pass/30' : 'bg-fail/10 border-fail/30'}`}>
      <div className="flex items-center gap-2">
        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-xs ${pass ? 'bg-pass' : 'bg-fail'}`}>
          {pass ? '✓' : '✗'}
        </span>
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${level === 'SLS' ? 'bg-sls text-white' : 'bg-uls text-white'}`}>{level}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500">Req ≥ {threshold.toFixed(1)}</span>
        <span className={`text-xl font-bold font-mono ${pass ? 'text-pass' : 'text-fail'}`}>
          {isFinite(value) ? value.toFixed(3) : '∞'}
        </span>
        <span className={`font-bold ${pass ? 'text-pass' : 'text-fail'}`}>{pass ? 'PASS' : 'FAIL'}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   GRAVITY / CANTILEVER WALL  (R376-style)
════════════════════════════════════════════════════════════ */
export function GravityCalcSheet({ results, params, wallType }) {
  if (!results) return null
  const r = results
  const p = params
  const B = wallType === 1 ? (p.Lt + p.ts + p.Lh) : p.B

  return (
    <div className="text-xs rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-4">
      <SheetHeader
        title={wallType === 0 ? 'Gravity Wall — Stability Check (R376)' : 'L-Cantilever Wall — Stability Check (R376)'}
        subtitle="GeoGuide 1 (2011) — SLS Checks"
      />

      {/* Input summary */}
      <SectionHead>1. Design Parameters</SectionHead>
      <TwoCol
        left={<>
          <Row label="Retained height H"     value={p.H}             unit="m" />
          <Row label="Base width B"          value={fmt3(B)}         unit="m" />
          {wallType === 0 && <Row label="Top width bt"    value={p.bt}           unit="m" />}
          {wallType === 0 && <Row label="Face batter ω"   value={p.batter}       unit="°" />}
          {wallType === 1 && <Row label="Stem thickness"  value={p.ts}           unit="m" />}
          {wallType === 1 && <Row label="Heel length Lh"  value={p.Lh}           unit="m" />}
          {wallType === 1 && <Row label="Toe length Lt"   value={p.Lt}           unit="m" />}
          {wallType === 1 && <Row label="Base thickness"  value={p.tb}           unit="m" />}
          <Row label="Wall unit weight γc"   value={p.gamma_wall}    unit="kN/m³" />
          <Row label="Wall friction δ"       value={p.delta}         unit="°" />
        </>}
        right={<>
          <Row label="Soil unit weight γ"    value={p.gamma}         unit="kN/m³" />
          <Row label="Cohesion c'"           value={p.cohesion}      unit="kPa" />
          <Row label="Friction angle φ'"     value={p.phi}           unit="°" />
          <Row label="Groundwater hw"        value={p.hw}            unit="m" />
          <Row label="Surcharge q"           value={p.surcharge}     unit="kPa" />
          <Row label="Fd. unit weight γf"    value={p.gamma_f}       unit="kN/m³" />
          <Row label="Fd. cohesion cf'"      value={p.cf}            unit="kPa" />
          <Row label="Fd. friction φf'"      value={p.phif}          unit="°" />
          <Row label="Embedment Df"          value={p.Df}            unit="m" />
        </>}
      />

      {/* Trial wedge */}
      <SectionHead>2. Active Earth Pressure — Trial Wedge Method</SectionHead>
      <div className="px-3">
        <Row label="Critical wedge angle θ"  value={r.thetaCrit}      unit="°"     highlight />
        <Row label="Active force Pa"          value={fmt3(r.Pa)}       unit="kN/m"  highlight />
        <Row label="Pa horizontal (Pa·cos δ)" value={fmt3(r.Pa_h)}    unit="kN/m" />
        <Row label="Pa vertical (Pa·sin δ)"   value={fmt3(r.Pa_v)}    unit="kN/m" />
      </div>
      <div className="px-3 pb-3">
        <TrialWedgeTable
          rows={r.wedgeDetails}
          Pa={r.Pa}
          thetaCrit={r.thetaCrit}
          hasWater={p.hw > 0}
          hasCohesion={p.cohesion > 0}
        />
      </div>

      {/* Forces */}
      <SectionHead>3. Vertical Forces on Base</SectionHead>
      {wallType === 0
        ? <>
            <Row label="Wall weight Wc = γc·A"    value={fmt3(r.W_wall)}   unit="kN/m" formula="γc·½(B+bt)·H" />
            <Row label="Pa vertical component"     value={fmt3(r.Pa_v)}    unit="kN/m" formula="Pa·sin(δ+ω)" />
            <Row label="Water uplift U"             value={fmt3(r.U_base)}  unit="kN/m" formula="½·γw·hw²" />
            <Row label="Normal force N"             value={fmt3(r.N)}       unit="kN/m" formula="Wc + Pa_v - U" highlight />
          </>
        : <>
            <Row label="Stem weight Ws"             value={fmt3(r.W_stem)}  unit="kN/m" formula="γc·ts·H" />
            <Row label="Base slab weight Wb"        value={fmt3(r.W_base)}  unit="kN/m" formula="γc·B·tb" />
            <Row label="Fill on heel Wf"            value={fmt3(r.W_fill)}  unit="kN/m" formula="γ·Lh·H" />
            <Row label="Pa vertical component"      value={fmt3(r.Pa_v)}    unit="kN/m" formula="Pa·sin(δ+ω)" />
            <Row label="Water uplift U"             value={fmt3(r.U_base)}  unit="kN/m" formula="½·γw·hw²" />
            <Row label="Normal force N"             value={fmt3(r.N)}       unit="kN/m" formula="ΣW + Pa_v - U" highlight />
          </>
      }

      {/* Sliding */}
      <SectionHead>4. FOS Against Sliding</SectionHead>
      <Row label="Driving force (Pa·cosδ + U·cosω)" value={fmt3(r.F_drive_slide)} unit="kN/m" formula="Pa_h + U_h" />
      <Row label="Resisting = N·tan φf' + cf'·B"     value={fmt3(r.F_resist_slide)} unit="kN/m" />
      <FOSSummaryBar label="FOS Sliding" value={r.FOS_sliding} threshold={1.5} level="SLS" />

      {/* Overturning */}
      <SectionHead>5. FOS Against Overturning (about Toe A)</SectionHead>
      <Row label="Overturning moment ΣMo"   value={fmt3(r.ΣMo)}  unit="kN·m/m" formula="Pa_h·H/3 + U·B/3" />
      <Row label="Stabilising moment ΣMr"   value={fmt3(r.ΣMr)}  unit="kN·m/m" formula="W·xc + Pa_v·B" />
      <FOSSummaryBar label="FOS Overturning" value={r.FOS_overturning} threshold={2.0} level="SLS" />

      {/* Eccentricity + bearing */}
      <SectionHead>6. Bearing Capacity — Vesic Formula</SectionHead>
      <Row label="Eccentricity e = B/2 − ΣM/N" value={fmt3(r.e)}        unit="m"   formula="B/2 − (ΣMr−ΣMo)/N" />
      <Row label="Effective base B' = B − 2e"   value={fmt3(r.B_eff)}   unit="m" />
      <Row label="Applied pressure q = N/B'"     value={fmt1(r.bearing?.qapplied)} unit="kPa" highlight />
      {r.bearing && <>
        <TwoCol
          left={<>
            <Row label="Nq"  value={fmt3(r.bearing.Nq)}  unit="" />
            <Row label="Nc"  value={fmt3(r.bearing.Nc)}  unit="" />
            <Row label="Nγ"  value={fmt3(r.bearing.Ng)}  unit="" />
          </>}
          right={<>
            <Row label="sc·dc·ic" value={fmt3(r.bearing.sc * r.bearing.dc * r.bearing.ic)} unit="" />
            <Row label="sq·dq·iq" value={fmt3(r.bearing.sq * r.bearing.dq * r.bearing.iq)} unit="" />
            <Row label="sγ·dγ·iγ" value={fmt3(r.bearing.sg * r.bearing.dg * r.bearing.ig)} unit="" />
          </>}
        />
        <Row label="Ultimate bearing capacity qu" value={fmt1(r.bearing.qu)} unit="kPa" highlight />
      </>}
      <FOSSummaryBar label="FOS Bearing" value={r.FOS_bearing} threshold={1.0} level="SLS" />

      {/* Base pressure (cantilever only) */}
      {wallType === 1 && r.q_max != null && <>
        <SectionHead>7. Base Pressure Distribution</SectionHead>
        <Row label="Maximum base pressure q_max" value={fmt1(r.q_max)} unit="kPa" highlight />
        <Row label="Minimum base pressure q_min" value={fmt1(r.q_min)} unit="kPa" />
        <Row label="Pressure distribution"
          value={r.q_min >= 0 ? 'Trapezoidal' : 'Triangular (uplift)'} unit="" />
      </>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MINI PILE WALL
════════════════════════════════════════════════════════════ */
export function MiniPileCalcSheet({ results, params }) {
  if (!results) return null
  const r = results, p = params
  return (
    <div className="text-xs rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-4">
      <SheetHeader title="Mini Pile Wall — Lateral Stability Check" subtitle="Rankine Active/Passive Pressure" />

      <SectionHead>1. Design Parameters</SectionHead>
      <TwoCol
        left={<>
          <Row label="Retained height H"  value={p.H}    unit="m" />
          <Row label="Embedment depth d"  value={p.d}    unit="m" />
          <Row label="Pile diameter D"    value={p.D}    unit="m" />
          <Row label="Pile spacing s"     value={p.s}    unit="m" />
        </>}
        right={<>
          <Row label="Retained γ"         value={p.gamma}     unit="kN/m³" />
          <Row label="Retained φ'"        value={p.phi}       unit="°" />
          <Row label="Passive γp"         value={p.gamma_p}   unit="kN/m³" />
          <Row label="Passive φp'"        value={p.phi_p}     unit="°" />
        </>}
      />

      <SectionHead>2. Earth Pressure Coefficients</SectionHead>
      <Row label="Active Ka = tan²(45 − φ/2)"   value={fmt3(r.Ka)}  unit=""  formula="tan²(45−φ/2)" />
      <Row label="Passive Kp = tan²(45 + φ/2)"  value={fmt3(r.Kp)}  unit=""  formula="tan²(45+φp/2)" />

      <SectionHead>3. Forces per Pile</SectionHead>
      <Row label="Active force Pa (per pile)"   value={fmt3(r.Pa_pile)}  unit="kN"   highlight formula="Ka·γ·H²/2·s" />
      <Row label="Passive Rp (per pile)"        value={fmt3(r.Rp_pile)}  unit="kN"   highlight formula="Kp·γp·d²/2·D" />
      <FOSSummaryBar label="FOS (Rp / Pa)" value={r.FOS_sliding} threshold={1.5} level="SLS" />

      <SectionHead>4. Pile Structural Response</SectionHead>
      <Row label="Max bending moment Mmax"  value={fmt3(r.M_max)}        unit="kN·m" highlight />
      <Row label="EI (concrete pile)"       value={fmt1(r.EI / 1000)}    unit="MN·m²" />
      <Row label="Estimated deflection δ"   value={fmt1(r.delta * 1000)} unit="mm" />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SKIN WALL + SOIL NAILS  (FR146-style)
════════════════════════════════════════════════════════════ */
export function SoilNailCalcSheet({ results, params }) {
  if (!results) return null
  const r = results, p = params

  return (
    <div className="text-xs rounded-lg border border-gray-200 overflow-hidden shadow-sm mt-4">
      <SheetHeader title="Skin Wall + Soil Nails — Design Check (FR146)" subtitle="Trial Wedge with Nail Forces" />

      <SectionHead>1. Design Parameters</SectionHead>
      <TwoCol
        left={<>
          <Row label="Wall height H"      value={p.H}         unit="m" />
          <Row label="Batter angle ω"     value={p.batter}    unit="°" />
          <Row label="Groundwater hw"     value={p.hw}        unit="m" />
          <Row label="Surcharge q"        value={p.surcharge} unit="kPa" />
        </>}
        right={<>
          <Row label="Soil unit weight γ" value={p.gamma}     unit="kN/m³" />
          <Row label="Cohesion c'"        value={p.cohesion}  unit="kPa" />
          <Row label="Friction angle φ'"  value={p.phi}       unit="°" />
          <Row label="Wall friction δ"    value={p.delta}     unit="°" />
        </>}
      />

      <SectionHead>2. Active Earth Pressure — Trial Wedge (without nails)</SectionHead>
      <div className="px-3">
        <Row label="Critical wedge angle θ"   value={r.thetaCrit}     unit="°"    highlight />
        <Row label="Active force Pa"          value={fmt3(r.Pa)}      unit="kN/m" highlight />
        <Row label="Pa horizontal"            value={fmt3(r.Pa_h)}    unit="kN/m" />
      </div>
      <div className="px-3 pb-3">
        <TrialWedgeTable
          rows={r.wedgeDetails}
          Pa={r.Pa}
          thetaCrit={r.thetaCrit}
          hasWater={p.hw > 0}
          hasCohesion={p.cohesion > 0}
        />
      </div>

      <SectionHead>3. Overall Sliding Stability</SectionHead>
      {r.fosSlide && <>
        <Row label="Total nail horizontal ΣTh"  value={fmt3(r.fosSlide.nail_H)} unit="kN/m" />
        <Row label="Total nail vertical ΣTv"    value={fmt3(r.fosSlide.nail_V)} unit="kN/m" />
        <Row label="Driving force"              value={fmt3(r.fosSlide.F_drive)}   unit="kN/m" />
        <Row label="Resisting force"            value={fmt3(r.fosSlide.F_resist)}  unit="kN/m" />
      </>}
      <FOSSummaryBar label="FOS Overall Sliding" value={r.fosSlide?.FOS ?? 0} threshold={1.5} level="SLS" />

      <SectionHead>4. Soil Nail Schedule</SectionHead>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-charcoal text-white">
              {['Row','Level (mPD)','sh (m)','i (°)','L (m)','d (mm)','T (kN)','Ta (kN)','TDL1 (kN)','TDL2 (kN)','Tp (kN)','Util.','Status'].map(h => (
                <th key={h} className="px-2 py-1.5 text-center font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.nailResults?.map((nr, i) => {
              const nail = p.nails[i]
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 text-center font-bold">R{i + 1}</td>
                  <td className="px-2 py-1 text-center">{nail.level_mPD}</td>
                  <td className="px-2 py-1 text-center">{nail.sh}</td>
                  <td className="px-2 py-1 text-center">{nail.inclination_deg}</td>
                  <td className="px-2 py-1 text-center">{nail.length}</td>
                  <td className="px-2 py-1 text-center">{nail.diameter_mm}</td>
                  <td className="px-2 py-1 text-center font-mono">{nr.T.toFixed(1)}</td>
                  <td className="px-2 py-1 text-center font-mono text-primary">{nr.Ta.toFixed(1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{nr.TDL1.toFixed(1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{nr.TDL2.toFixed(1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{nr.Tp.toFixed(1)}</td>
                  <td className="px-2 py-1 text-center font-mono">{(nr.util * 100).toFixed(0)}%</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-white ${nr.pass ? 'bg-pass' : 'bg-fail'}`}>
                      {nr.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <SectionHead>5. Nail Capacity Derivation</SectionHead>
      {r.nailResults?.map((nr, i) => {
        const nail = p.nails[i]
        return (
          <div key={i} className="border-b border-gray-100 px-3 py-1.5">
            <div className="font-bold text-primary mb-0.5">Row {i + 1} — Level {nail.level_mPD} mPD</div>
            <div className="grid grid-cols-2 gap-x-6 text-xs text-gray-600">
              <div>Bar area A = π/4·d² = {(nr.A_bar * 1e4).toFixed(2)} cm²</div>
              <div>Ta (steel) = 0.55·fy·A = {nr.Ta_steel.toFixed(1)} kN</div>
              <div>Bond stress fbu = {nr.fbu.toFixed(2)} MPa</div>
              <div>Ta (grout) = π·D·L·fbu/2.5 = {nr.Ta_grout.toFixed(1)} kN</div>
              <div className="font-bold text-primary">Ta = min(steel, grout) = {nr.Ta.toFixed(1)} kN</div>
              <div className="font-bold text-primary">Tp = 1.25·Ta = {nr.Tp.toFixed(1)} kN</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

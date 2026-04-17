import FOSCards from './FOSCards'
import ExportButton from './ExportButton'
import { useState } from 'react'

function BreakdownRow({ label, value, unit = '' }) {
  return (
    <div className="flex justify-between text-xs py-0.5 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono font-medium text-gray-700">{typeof value === 'number' ? value.toFixed(3) : value} {unit}</span>
    </div>
  )
}

function CalcBreakdown({ results, wallType }) {
  const [open, setOpen] = useState(false)
  if (!results) return null
  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        onClick={() => setOpen(o => !o)}
      >
        <span>Calculation Breakdown</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 py-2 bg-white">
          {(wallType === 0 || wallType === 1) && results.Pa !== undefined && (
            <>
              <div className="text-xs font-semibold text-primary mb-1">Earth Pressure (Trial Wedge)</div>
              <BreakdownRow label="Pa"         value={results.Pa}            unit="kN/m" />
              <BreakdownRow label="θ_crit"     value={results.thetaCrit}     unit="°" />
              <BreakdownRow label="Pa_h"       value={results.Pa_h}          unit="kN/m" />
              <BreakdownRow label="Pa_v"       value={results.Pa_v}          unit="kN/m" />
              <div className="text-xs font-semibold text-primary mt-2 mb-1">Wall Forces</div>
              <BreakdownRow label="W_wall"     value={results.W_wall}        unit="kN/m" />
              <BreakdownRow label="W_fill"     value={results.W_fill}        unit="kN/m" />
              <BreakdownRow label="U_base"     value={results.U_base}        unit="kN/m" />
              <BreakdownRow label="N (normal)" value={results.N}             unit="kN/m" />
              <div className="text-xs font-semibold text-primary mt-2 mb-1">Sliding</div>
              <BreakdownRow label="Resisting"  value={results.F_resist_slide} unit="kN/m" />
              <BreakdownRow label="Driving"    value={results.F_drive_slide}  unit="kN/m" />
              <div className="text-xs font-semibold text-primary mt-2 mb-1">Overturning</div>
              <BreakdownRow label="ΣMr"        value={results.ΣMr}           unit="kN·m/m" />
              <BreakdownRow label="ΣMo"        value={results.ΣMo}           unit="kN·m/m" />
              <div className="text-xs font-semibold text-primary mt-2 mb-1">Bearing (Vesic)</div>
              <BreakdownRow label="Eccentricity e" value={results.e}         unit="m" />
              <BreakdownRow label="Effective B"    value={results.B_eff}     unit="m" />
              {results.bearing && (
                <>
                  <BreakdownRow label="qu"          value={results.bearing.qu}        unit="kPa" />
                  <BreakdownRow label="q_applied"   value={results.bearing.qapplied}  unit="kPa" />
                  <BreakdownRow label="Nq"          value={results.bearing.Nq}        unit="" />
                  <BreakdownRow label="Nc"          value={results.bearing.Nc}        unit="" />
                  <BreakdownRow label="Nγ"          value={results.bearing.Ng}        unit="" />
                </>
              )}
            </>
          )}
          {wallType === 2 && (
            <>
              <div className="text-xs font-semibold text-primary mb-1">Pile Check</div>
              <BreakdownRow label="Ka"         value={results.Ka}            unit="" />
              <BreakdownRow label="Kp"         value={results.Kp}            unit="" />
              <BreakdownRow label="Pa (pile)"  value={results.Pa_pile}       unit="kN" />
              <BreakdownRow label="Rp (pile)"  value={results.Rp_pile}       unit="kN" />
              <BreakdownRow label="M_max"      value={results.M_max}         unit="kN·m" />
              <BreakdownRow label="Deflection" value={results.delta * 1000}  unit="mm" />
            </>
          )}
          {wallType === 3 && results.Pa !== undefined && (
            <>
              <div className="text-xs font-semibold text-primary mb-1">Trial Wedge</div>
              <BreakdownRow label="Pa"         value={results.Pa}            unit="kN/m" />
              <BreakdownRow label="θ_crit"     value={results.thetaCrit}     unit="°" />
              <BreakdownRow label="Pa_h"       value={results.Pa_h}          unit="kN/m" />
              {results.fosSlide && (
                <>
                  <div className="text-xs font-semibold text-primary mt-2 mb-1">Sliding</div>
                  <BreakdownRow label="Nail_H"      value={results.fosSlide.nail_H}    unit="kN/m" />
                  <BreakdownRow label="F_resist"    value={results.fosSlide.F_resist}  unit="kN/m" />
                  <BreakdownRow label="F_drive"     value={results.fosSlide.F_drive}   unit="kN/m" />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* Soil Nail Schedule (Type 4) */
function NailSchedule({ results }) {
  if (!results?.nailResults?.length) return null
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Soil Nail Schedule</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-charcoal text-white">
              <th className="px-2 py-1.5 text-left font-medium">Row</th>
              <th className="px-2 py-1.5 font-medium">T (kN)</th>
              <th className="px-2 py-1.5 font-medium">Ta (kN)</th>
              <th className="px-2 py-1.5 font-medium">TDL1</th>
              <th className="px-2 py-1.5 font-medium">TDL2</th>
              <th className="px-2 py-1.5 font-medium">Tp (kN)</th>
              <th className="px-2 py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.nailResults.map((nr, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1.5 font-medium">R{i + 1}</td>
                <td className="px-2 py-1.5 text-center">{nr.T.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-center">{nr.Ta.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-center">{nr.TDL1.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-center">{nr.TDL2.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-center">{nr.Tp.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-white font-bold ${nr.pass ? 'bg-pass' : 'bg-fail'}`}>
                    {nr.pass ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ResultsPanel({ results, wallType, params, project }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest">
        Design Results
      </div>
      <div className="p-4">
        <FOSCards results={results} wallType={wallType} />
        {wallType === 3 && <NailSchedule results={results} />}
        <CalcBreakdown results={results} wallType={wallType} />
        <div className="mt-4 flex flex-col gap-2">
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="csv" />
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="pdf" />
        </div>
      </div>
    </div>
  )
}

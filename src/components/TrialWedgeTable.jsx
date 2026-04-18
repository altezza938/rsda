/**
 * Full trial wedge iteration table – mirrors FR146 workbook output.
 * Shows every θ from 20°–80° with W, U1, U2, C, Li, Pa columns.
 * Highlights the critical (maximum Pa) row in green.
 */
export default function TrialWedgeTable({ rows, Pa, thetaCrit, hasWater, hasCohesion }) {
  if (!rows || rows.length === 0) return null

  const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d))

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Trial Wedge Iteration Table (FR146)
        </span>
        <span className="text-xs text-gray-500">
          Pa = <span className="font-bold text-primary">{Pa?.toFixed(3)}</span> kN/m
          &nbsp;@&nbsp;θ = <span className="font-bold text-primary">{thetaCrit}°</span>
        </span>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200 shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-charcoal text-white">
              <th className="px-2 py-1.5 text-center font-medium border-r border-gray-600">θ (°)</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">W (kN/m)</th>
              {hasWater && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">U₁ (kN/m)</th>}
              {hasWater && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">U₂ (kN/m)</th>}
              {hasCohesion && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Li (m)</th>}
              {hasCohesion && <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">C (kN/m)</th>}
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Numerator</th>
              <th className="px-2 py-1.5 text-right font-medium border-r border-gray-600">Denominator</th>
              <th className="px-2 py-1.5 text-right font-medium">Pa (kN/m)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.theta}
                className={r.active
                  ? 'bg-primary text-white font-bold'
                  : r.theta % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }
              >
                <td className="px-2 py-1 text-center border-r border-gray-200">
                  {r.theta}{r.active ? ' ★' : ''}
                </td>
                <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.W)}</td>
                {hasWater && <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.U1)}</td>}
                {hasWater && <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.U2)}</td>}
                {hasCohesion && <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.Li)}</td>}
                {hasCohesion && <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.C)}</td>}
                <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.numerator)}</td>
                <td className="px-2 py-1 text-right font-mono border-r border-gray-200">{fmt(r.denominator)}</td>
                <td className={`px-2 py-1 text-right font-mono ${r.active ? '' : r.Pa != null && r.Pa > 0 ? 'text-charcoal' : 'text-gray-400'}`}>
                  {r.Pa != null ? fmt(r.Pa) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-pale border-t-2 border-primary">
              <td colSpan={2 + (hasWater ? 2 : 0) + (hasCohesion ? 2 : 0) + 2}
                className="px-2 py-1.5 text-right text-xs font-bold text-primary">
                Pa (max) =
              </td>
              <td className="px-2 py-1.5 text-right font-bold text-primary font-mono">
                {Pa?.toFixed(3)} kN/m
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

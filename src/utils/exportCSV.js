const WALL_NAMES = ['Gravity Wall', 'L-Cantilever Wall', 'Mini Pile Wall', 'Skin Wall + Soil Nails']

function row(...cells) {
  return cells.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',') + '\n'
}

export function exportCSV({ results, params, wallType, project }) {
  if (!results) return

  let csv = ''
  csv += row('AECOM GEO – Retaining Structure Design App')
  csv += row('Feature No.', project?.featureNo ?? '', 'Agreement No.', project?.agreementNo ?? '')
  csv += row('Calculated By', project?.calcBy ?? '', 'Checked By', project?.checkedBy ?? '')
  csv += row('Date', project?.date ?? '', 'Wall Type', WALL_NAMES[wallType])
  csv += '\n'

  csv += row('=== INPUT PARAMETERS ===')
  for (const [k, v] of Object.entries(params ?? {})) {
    if (k === 'nails') continue
    csv += row(k, v)
  }
  csv += '\n'

  csv += row('=== DESIGN RESULTS ===')
  if (wallType === 0 || wallType === 1) {
    csv += row('Pa (kN/m)',              results.Pa?.toFixed(3))
    csv += row('θ_crit (°)',             results.thetaCrit)
    csv += row('FOS Sliding (SLS≥1.5)', results.FOS_sliding?.toFixed(3))
    csv += row('FOS Overturning (SLS≥2.0)', results.FOS_overturning?.toFixed(3))
    csv += row('FOS Bearing (SLS≥1.0)', results.FOS_bearing?.toFixed(3))
    csv += row('Bearing qu (kPa)',       results.bearing?.qu?.toFixed(1))
    csv += row('q applied (kPa)',        results.bearing?.qapplied?.toFixed(1))
    csv += row('Eccentricity e (m)',     results.e?.toFixed(3))
    if (wallType === 1) {
      csv += row('q_max (kPa)',  results.q_max?.toFixed(1))
      csv += row('q_min (kPa)',  results.q_min?.toFixed(1))
    }
  }

  if (wallType === 2) {
    csv += row('Ka',                     results.Ka?.toFixed(3))
    csv += row('Kp',                     results.Kp?.toFixed(3))
    csv += row('Pa per pile (kN)',       results.Pa_pile?.toFixed(1))
    csv += row('Rp per pile (kN)',       results.Rp_pile?.toFixed(1))
    csv += row('FOS (≥1.5)',             results.FOS_sliding?.toFixed(3))
    csv += row('Max BM (kN·m)',          results.M_max?.toFixed(1))
    csv += row('Deflection (mm)',        (results.delta * 1000)?.toFixed(1))
  }

  if (wallType === 3) {
    csv += row('Pa (kN/m)',              results.Pa?.toFixed(3))
    csv += row('Pa_h (kN/m)',            results.Pa_h?.toFixed(3))
    csv += row('θ_crit (°)',             results.thetaCrit)
    csv += row('FOS Sliding (≥1.5)',     results.fosSlide?.FOS?.toFixed(3))
    csv += '\n'
    csv += row('=== SOIL NAIL SCHEDULE ===')
    csv += row('Row', 'Level (mPD)', 'sh (m)', 'L (m)', 'Bar (mm)', 'T (kN)', 'Ta (kN)', 'TDL1 (kN)', 'TDL2 (kN)', 'Tp (kN)', 'Status')
    results.nailResults?.forEach((nr, i) => {
      const nail = params.nails[i]
      csv += row(
        `R${i + 1}`, nail.level_mPD, nail.sh, nail.length, nail.diameter_mm,
        nr.T.toFixed(1), nr.Ta.toFixed(1), nr.TDL1.toFixed(1), nr.TDL2.toFixed(1), nr.Tp.toFixed(1),
        nr.pass ? 'PASS' : 'FAIL',
      )
    })
  }

  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `RSDA_${WALL_NAMES[wallType].replace(/ /g, '_')}_${project?.featureNo ?? 'report'}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

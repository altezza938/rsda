import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const WALL_NAMES = ['Gravity Wall', 'L-Cantilever Wall', 'Mini Pile Wall', 'Skin Wall + Soil Nails']
const PRIMARY = [45, 106, 79]      // #2D6A4F
const CHARCOAL = [27, 27, 27]      // #1B1B1B
const PASS_COLOR = [39, 174, 96]
const FAIL_COLOR = [231, 76, 60]

function header(doc, project, wallType, pageNum) {
  doc.setFillColor(...CHARCOAL)
  doc.rect(0, 0, 210, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('AECOM GEO · Retaining Structure Design App', 8, 9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${WALL_NAMES[wallType]}  |  ${project?.featureNo ?? ''}  |  Page ${pageNum}`, 210 - 8, 9, { align: 'right' })
  doc.setTextColor(...CHARCOAL)
}

function footer(doc) {
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text('For checking use only — GeoGuide 1 (2011) — AECOM GEO', 105, 292, { align: 'center' })
}

function sectionTitle(doc, text, y) {
  doc.setFillColor(...PRIMARY)
  doc.rect(8, y, 194, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(text.toUpperCase(), 10, y + 4.2)
  doc.setTextColor(...CHARCOAL)
  doc.setFont('helvetica', 'normal')
  return y + 8
}

function kv(doc, label, value, x, y, unitW = 90) {
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(label, x, y)
  doc.setTextColor(...CHARCOAL)
  doc.setFont('helvetica', 'bold')
  doc.text(String(value ?? ''), x + unitW, y)
  doc.setFont('helvetica', 'normal')
}

export async function exportPDF({ results, params, wallType, project, diagramEl }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  /* ── Page 1: Project info + inputs + diagram ── */
  header(doc, project, wallType, 1)

  let y = 20
  // Project block
  y = sectionTitle(doc, 'Project Information', y)
  kv(doc, 'Feature No.:', project?.featureNo  ?? '—', 10, y + 5)
  kv(doc, 'Agreement No.:', project?.agreementNo ?? '—', 110, y + 5)
  kv(doc, 'Calc. By:', project?.calcBy    ?? '—', 10, y + 11)
  kv(doc, 'Checked By:', project?.checkedBy  ?? '—', 110, y + 11)
  kv(doc, 'Date:', project?.date       ?? '—', 10, y + 17)
  kv(doc, 'Wall Type:', WALL_NAMES[wallType], 110, y + 17)
  y += 24

  // Input parameters
  y = sectionTitle(doc, 'Input Parameters', y)
  const skip = ['nails']
  let col = 0
  for (const [k, v] of Object.entries(params ?? {})) {
    if (skip.includes(k)) continue
    const xPos = col === 0 ? 10 : 110
    kv(doc, `${k}:`, v, xPos, y + 5)
    col++
    if (col >= 2) { col = 0; y += 6 }
  }
  y += 10

  // Diagram
  if (diagramEl) {
    try {
      const canvas = await html2canvas(diagramEl, { scale: 2, backgroundColor: '#f9fafb' })
      const imgData = canvas.toDataURL('image/png')
      const ratio   = canvas.width / canvas.height
      const imgW    = 100
      const imgH    = imgW / ratio
      y = sectionTitle(doc, 'Wall Cross-Section', y)
      doc.addImage(imgData, 'PNG', 55, y, imgW, imgH)
      y += imgH + 6
    } catch (e) {
      console.warn('Diagram capture failed:', e)
    }
  }

  footer(doc)

  /* ── Page 2: FOS Results ── */
  doc.addPage()
  header(doc, project, wallType, 2)
  y = 20

  y = sectionTitle(doc, 'Design Results — FOS Summary', y)
  y += 4

  if (wallType === 0 || wallType === 1) {
    const checks = [
      ['FOS Sliding',     results?.FOS_sliding,     1.5, 'SLS'],
      ['FOS Overturning', results?.FOS_overturning,  2.0, 'SLS'],
      ['FOS Bearing',     results?.FOS_bearing,      1.0, 'SLS'],
    ]
    checks.forEach(([label, val, req, lvl]) => {
      const pass = val >= req
      const clr = pass ? PASS_COLOR : FAIL_COLOR
      doc.setFillColor(clr[0], clr[1], clr[2])
      doc.rect(10, y, 4, 4, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...CHARCOAL)
      doc.text(`${label}:  ${val?.toFixed(3) ?? '—'}`, 16, y + 3.2)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Required ≥ ${req}  [${lvl}]  →  ${pass ? 'PASS' : 'FAIL'}`, 80, y + 3.2)
      y += 9
    })

    y += 4
    y = sectionTitle(doc, 'Calculation Breakdown', y)
    const bd = [
      ['Pa (kN/m)',      results?.Pa?.toFixed(3)],
      ['θ_crit (°)',     results?.thetaCrit],
      ['W_wall (kN/m)',  results?.W_wall?.toFixed(3)],
      ['N normal (kN/m)',results?.N?.toFixed(3)],
      ['ΣMr (kN·m/m)',   results?.ΣMr?.toFixed(3)],
      ['ΣMo (kN·m/m)',   results?.ΣMo?.toFixed(3)],
      ['e (m)',          results?.e?.toFixed(3)],
      ['B_eff (m)',      results?.B_eff?.toFixed(3)],
      ['qu (kPa)',       results?.bearing?.qu?.toFixed(1)],
      ['q_applied (kPa)',results?.bearing?.qapplied?.toFixed(1)],
    ]
    col = 0
    bd.forEach(([lbl, val]) => {
      const xPos = col === 0 ? 10 : 110
      kv(doc, `${lbl}:`, val, xPos, y + 5, 55)
      col++
      if (col >= 2) { col = 0; y += 6 }
    })
  }

  if (wallType === 2) {
    const pass = results?.FOS_sliding >= 1.5
    const clr2 = pass ? PASS_COLOR : FAIL_COLOR
    doc.setFillColor(clr2[0], clr2[1], clr2[2])
    doc.rect(10, y, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`FOS (Passive/Active):  ${results?.FOS_sliding?.toFixed(3) ?? '—'}`, 16, y + 3.2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Required ≥ 1.5  [SLS]  →  ${pass ? 'PASS' : 'FAIL'}`, 90, y + 3.2)
    y += 14
    y = sectionTitle(doc, 'Pile Calculation', y)
    ;[
      ['Ka', results?.Ka?.toFixed(3)],
      ['Kp', results?.Kp?.toFixed(3)],
      ['Pa per pile (kN)', results?.Pa_pile?.toFixed(1)],
      ['Rp per pile (kN)', results?.Rp_pile?.toFixed(1)],
      ['Max BM (kN·m)', results?.M_max?.toFixed(1)],
      ['Deflection (mm)', (results?.delta * 1000)?.toFixed(1)],
    ].forEach(([lbl, val], idx) => {
      const xPos = idx % 2 === 0 ? 10 : 110
      kv(doc, `${lbl}:`, val, xPos, y + 5, 55)
      if (idx % 2 === 1) y += 6
    })
  }

  footer(doc)

  /* ── Page 3 (Type 4 only): Soil nail schedule ── */
  if (wallType === 3 && results?.nailResults?.length) {
    doc.addPage()
    header(doc, project, wallType, 3)
    y = 20
    y = sectionTitle(doc, 'Soil Nail Schedule', y)
    y += 4

    // Table header
    const cols = ['Row', 'Level', 'sh(m)', 'L(m)', 'Bar(mm)', 'T(kN)', 'Ta(kN)', 'TDL1', 'TDL2', 'Tp(kN)', 'Status']
    const cw   = [12, 20, 16, 12, 18, 14, 14, 14, 14, 14, 16]
    let xc = 10
    doc.setFillColor(...CHARCOAL)
    doc.rect(10, y, 190, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    cols.forEach((c, i) => { doc.text(c, xc + 1, y + 4); xc += cw[i] })
    doc.setTextColor(...CHARCOAL)
    y += 6

    results.nailResults.forEach((nr, i) => {
      const nail = params?.nails?.[i]
      const pass = nr.pass
      if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(10, y, 190, 6, 'F') }
      xc = 10
      doc.setFontSize(7)
      const cells = [
        `R${i + 1}`, nail?.level_mPD, nail?.sh, nail?.length, nail?.diameter_mm,
        nr.T.toFixed(1), nr.Ta.toFixed(1), nr.TDL1.toFixed(1), nr.TDL2.toFixed(1), nr.Tp.toFixed(1),
        pass ? 'PASS' : 'FAIL',
      ]
      cells.forEach((c, ci) => {
        if (ci === cells.length - 1) { const pc = pass ? PASS_COLOR : FAIL_COLOR; doc.setTextColor(pc[0], pc[1], pc[2]) }
        doc.text(String(c ?? ''), xc + 1, y + 4)
        doc.setTextColor(...CHARCOAL)
        xc += cw[ci]
      })
      y += 6
    })
    footer(doc)
  }

  doc.save(`RSDA_${WALL_NAMES[wallType].replace(/ /g, '_')}_${project?.featureNo ?? 'report'}.pdf`)
}

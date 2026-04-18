/**
 * Live SVG cross-section diagram — updates as inputs change.
 * Draws the critical trial-wedge failure plane on each wall type.
 */

const DEG = Math.PI / 180
const FILL_HATCH = '#8B7355'
const CONC_COLOR = '#D4C5A9'
const WATER_COLOR = '#60A5FA'
const WEDGE_COLOR = '#E9A820'

function HatchPattern({ id, color = '#8B7355', angle = 45, spacing = 8 }) {
  return (
    <defs>
      <pattern id={id} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
        <line x1="0" y1="0" x2="0" y2={spacing} stroke={color} strokeWidth="1.2" />
      </pattern>
    </defs>
  )
}

function scaler(maxDim, svgSize = 340) {
  return svgSize / (maxDim * 1.25)
}

/**
 * Draw the critical failure plane from the wall heel base.
 * In SVG coords, the scale factor cancels when computing dy_svg = dx_svg * tan(theta).
 * Returns SVG line element or null.
 */
function WedgeLine({ heelX, baseY, topY, fillRight, thetaCrit, omega = 0, scale }) {
  if (!thetaCrit) return null
  const theta_r = thetaCrit * DEG
  const omega_r = omega * DEG

  // Failure plane starts at heel base, angles up through fill at theta from horizontal
  // Distance along surface to where plane starts (accounting for batter)
  const fullDx = (topY - baseY < 0 ? Math.abs(topY - baseY) / scale : 0)

  // End x at surface level (y = topY)
  const H_svg = baseY - topY                // SVG pixels of wall height
  const endXfull = heelX + H_svg / Math.tan(theta_r)   // failure plane full reach
  const endX = Math.min(endXfull, fillRight)
  const endY = baseY - (endX - heelX) * Math.tan(theta_r)

  // Angle arc (small arc to label the angle)
  const arcR = Math.min(30, H_svg * 0.15)
  const arcX = heelX + arcR * Math.cos(Math.PI - theta_r)
  const arcY = baseY - arcR * Math.sin(theta_r)

  return (
    <g>
      {/* Wedge fill */}
      <polygon
        points={`${heelX},${baseY} ${endX},${endY} ${endX},${baseY}`}
        fill={WEDGE_COLOR} opacity="0.08"
      />
      {/* Failure plane dashed line */}
      <line x1={heelX} y1={baseY} x2={endX} y2={endY}
        stroke={WEDGE_COLOR} strokeWidth="1.8" strokeDasharray="6,3" />
      {/* Continuation arrow if clipped */}
      {endX >= fillRight - 1 && (
        <text x={endX - 2} y={endY - 4} fontSize="9" fill={WEDGE_COLOR} textAnchor="end">→</text>
      )}
      {/* Angle arc */}
      <path
        d={`M ${heelX + arcR} ${baseY} A ${arcR} ${arcR} 0 0 0 ${heelX + arcR * Math.cos(theta_r)} ${baseY - arcR * Math.sin(theta_r)}`}
        fill="none" stroke={WEDGE_COLOR} strokeWidth="1" />
      {/* Angle label */}
      <text
        x={heelX + arcR * 1.5 * Math.cos(theta_r / 2)}
        y={baseY - arcR * 1.5 * Math.sin(theta_r / 2)}
        fontSize="8" fill={WEDGE_COLOR} fontWeight="bold">
        {thetaCrit}°
      </text>
    </g>
  )
}

/* ── Type 0: Gravity Wall ── */
function GravityDiagram({ params, results }) {
  if (!params) return null
  const { H = 3.5, B = 2.8, bt = 0.6, batter = 0, hw = 0 } = params
  const vb = 460
  const scale = Math.min(scaler(Math.max(H, B)), 80)
  const margin = 40
  const baseY = vb - 80
  const topY  = baseY - H * scale

  const face_offset = H * Math.tan(batter * DEG) * scale
  const toe  = margin
  const heel = margin + B * scale
  const pts  = [
    [toe, baseY],
    [heel, baseY],
    [heel, topY],
    [toe + face_offset, topY],
  ].map(p => p.join(',')).join(' ')

  const fillRight = margin + (B + 2.5) * scale
  const fillPts = [
    [heel, baseY],
    [fillRight, baseY],
    [fillRight, topY],
    [heel, topY],
  ].map(p => p.join(',')).join(' ')

  const hwY = baseY - hw * scale

  return (
    <svg viewBox={`0 0 460 ${vb}`} className="w-full max-h-80 drop-shadow">
      <HatchPattern id="fill" color={FILL_HATCH} />
      <line x1={toe - 5} y1={baseY} x2={fillRight + 5} y2={baseY} stroke="#555" strokeWidth="2" />
      <polygon points={fillPts} fill="url(#fill)" opacity="0.6" />
      {/* Critical failure wedge */}
      <WedgeLine heelX={heel} baseY={baseY} topY={topY} fillRight={fillRight}
        thetaCrit={results?.thetaCrit} omega={batter} scale={scale} />
      <polygon points={pts} fill={CONC_COLOR} stroke="#888" strokeWidth="1.5" />
      {hw > 0 && (
        <line x1={heel} y1={hwY} x2={fillRight} y2={hwY} stroke={WATER_COLOR} strokeWidth="2" strokeDasharray="6,4" />
      )}
      <text x={toe + B * scale / 2} y={baseY + 22} textAnchor="middle" fontSize="11" fill="#555">B = {B}m</text>
      <text x={toe - 14} y={(baseY + topY) / 2} textAnchor="middle" fontSize="11" fill="#555"
        transform={`rotate(-90,${toe - 14},${(baseY + topY) / 2})`}>H = {H}m</text>
      {hw > 0 && <text x={fillRight + 4} y={hwY - 3} fontSize="9" fill={WATER_COLOR}>hw={hw}m</text>}
      <text x={margin + B * scale / 2} y={topY - 6} textAnchor="middle" fontSize="9" fill="#888">bt={bt}m</text>
    </svg>
  )
}

/* ── Type 1: L-Cantilever ── */
function CantileverDiagram({ params, results }) {
  if (!params) return null
  const { H = 4.0, ts = 0.3, tb = 0.5, Lh = 2.2, Lt = 0.5, hw = 0 } = params
  const B = Lt + ts + Lh
  const vb = 460
  const scale = Math.min(scaler(Math.max(H, B)), 75)
  const margin = 40
  const baseY = vb - 80

  const baseX  = margin
  const baseW  = B * scale
  const baseH2 = tb * scale
  const stemX = margin + Lt * scale
  const stemW = ts * scale
  const stemH = (H - tb) * scale
  const stemTop = baseY - baseH2 - stemH

  const fillRight = margin + B * scale + 2.5 * scale
  const fillTop   = baseY - baseH2 - stemH
  const heelX = margin + B * scale

  return (
    <svg viewBox={`0 0 460 ${vb}`} className="w-full max-h-80 drop-shadow">
      <HatchPattern id="fill2" color={FILL_HATCH} />
      <line x1={margin - 5} y1={baseY} x2={fillRight + 5} y2={baseY} stroke="#555" strokeWidth="2" />
      <rect x={stemX + stemW} y={fillTop} width={fillRight - stemX - stemW} height={(H - tb) * scale}
        fill="url(#fill2)" opacity="0.6" />
      {/* Critical failure wedge */}
      <WedgeLine heelX={heelX} baseY={baseY} topY={fillTop} fillRight={fillRight}
        thetaCrit={results?.thetaCrit} scale={scale} />
      <rect x={baseX} y={baseY - baseH2} width={baseW} height={baseH2} fill={CONC_COLOR} stroke="#888" strokeWidth="1.5" />
      <rect x={stemX} y={stemTop} width={stemW} height={stemH} fill={CONC_COLOR} stroke="#888" strokeWidth="1.5" />
      {hw > 0 && (
        <line x1={stemX + stemW} y1={baseY - hw * scale} x2={fillRight} y2={baseY - hw * scale}
          stroke={WATER_COLOR} strokeWidth="2" strokeDasharray="6,4" />
      )}
      <text x={margin + B * scale / 2} y={baseY + 22} textAnchor="middle" fontSize="11" fill="#555">B = {B.toFixed(1)}m</text>
      <text x={margin - 16} y={(baseY - baseH2 / 2 + stemTop) / 2} textAnchor="middle" fontSize="11" fill="#555"
        transform={`rotate(-90,${margin - 16},${(baseY - baseH2 / 2 + stemTop) / 2})`}>H = {H}m</text>
    </svg>
  )
}

/* ── Type 2: Mini Pile Wall ── */
function MiniPileDiagram({ params }) {
  if (!params) return null
  const { H = 3.0, d = 2.0, D = 0.3, s = 1.5 } = params
  const totalH = H + d
  const vb = 460
  const scale = Math.min(scaler(totalH), 75)
  const margin = 50
  const groundY = vb - 80 - d * scale
  const baseY   = vb - 80

  const pileW = D * scale
  const positions = [margin, margin + s * scale, margin + 2 * s * scale]

  return (
    <svg viewBox={`0 0 460 ${vb}`} className="w-full max-h-80 drop-shadow">
      <HatchPattern id="fill3" color={FILL_HATCH} />
      <HatchPattern id="fill4" color="#9B8C75" angle={-45} />
      <rect x={positions[positions.length - 1] + pileW} y={groundY - H * scale} width={120} height={H * scale}
        fill="url(#fill3)" opacity="0.6" />
      <line x1={margin - 10} y1={groundY} x2={margin + 3 * s * scale + pileW + 120} y2={groundY}
        stroke="#555" strokeWidth="2" />
      <rect x={margin - 20} y={groundY} width={positions[0] + 20} height={d * scale}
        fill="url(#fill4)" opacity="0.4" />
      {positions.map((x, i) => (
        <g key={i}>
          <rect x={x} y={groundY - H * scale} width={pileW} height={(H + d) * scale}
            fill="#B0A090" stroke="#888" strokeWidth="1.5" rx="2" />
        </g>
      ))}
      <text x={positions[0] - 22} y={(groundY - H * scale + groundY) / 2} textAnchor="middle" fontSize="11" fill="#555"
        transform={`rotate(-90,${positions[0] - 22},${(groundY - H * scale + groundY) / 2})`}>H = {H}m</text>
      <text x={positions[0] - 22} y={(groundY + baseY) / 2} textAnchor="middle" fontSize="11" fill="#888"
        transform={`rotate(-90,${positions[0] - 22},${(groundY + baseY) / 2})`}>d = {d}m</text>
      <text x={positions[0] + pileW / 2} y={baseY + 22} textAnchor="middle" fontSize="9" fill="#555">D={D}m</text>
    </svg>
  )
}

/* ── Type 3: Skin Wall + Soil Nails ── */
function SkinWallDiagram({ params, results }) {
  if (!params) return null
  const { H = 5.0, batter = 10, hw = 0, nails = [] } = params
  const vb = 460
  const scale = Math.min(scaler(H * 1.5), 60)
  const margin = 60
  const baseY  = vb - 80
  const topY   = baseY - H * scale
  const faceOffset = H * Math.tan(batter * DEG) * scale
  const wallThick  = 0.2 * scale

  const pts = [
    [margin, baseY],
    [margin + wallThick, baseY],
    [margin + wallThick + faceOffset, topY],
    [margin + faceOffset, topY],
  ].map(p => p.join(',')).join(' ')

  const fillRight = margin + H * scale + 50
  const fillPts = [
    [margin + wallThick + faceOffset, topY],
    [fillRight, topY],
    [fillRight, baseY],
    [margin + wallThick, baseY],
  ].map(p => p.join(',')).join(' ')

  const hwY = baseY - hw * scale
  const heelX = margin + wallThick

  return (
    <svg viewBox={`0 0 460 ${vb}`} className="w-full max-h-80 drop-shadow">
      <HatchPattern id="fill5" color={FILL_HATCH} />
      <line x1={margin - 5} y1={baseY} x2={fillRight + 5} y2={baseY} stroke="#555" strokeWidth="2" />
      <polygon points={fillPts} fill="url(#fill5)" opacity="0.6" />
      {/* Critical failure wedge */}
      <WedgeLine heelX={heelX} baseY={baseY} topY={topY} fillRight={fillRight}
        thetaCrit={results?.thetaCrit} omega={batter} scale={scale} />
      <polygon points={pts} fill={CONC_COLOR} stroke="#888" strokeWidth="1.5" />
      {hw > 0 && (
        <line x1={margin + wallThick} y1={hwY} x2={fillRight} y2={hwY}
          stroke={WATER_COLOR} strokeWidth="2" strokeDasharray="6,4" />
      )}
      {nails.map((nail, i) => {
        const depth   = nail.wallTopLevel - nail.level_mPD
        if (depth < 0 || depth > H) return null
        const nailY   = baseY - (H - depth) * scale
        const nailX0  = margin + (H - depth) * Math.tan(batter * DEG) * scale + wallThick
        const nailLen = nail.length * scale * 0.8
        const inc_r   = nail.inclination_deg * DEG
        const nailX1  = nailX0 + nailLen * Math.cos(inc_r)
        const nailY1  = nailY  + nailLen * Math.sin(inc_r)
        const passed  = results?.nailResults?.[i]?.pass
        const color   = passed === false ? '#E74C3C' : '#2D6A4F'
        return (
          <g key={i}>
            <line x1={nailX0} y1={nailY} x2={nailX1} y2={nailY1} stroke={color} strokeWidth="2.5" />
            <circle cx={nailX0} cy={nailY} r="4" fill={color} />
            <text x={nailX0 - 5} y={nailY - 5} fontSize="8" fill={color}>R{i + 1}</text>
          </g>
        )
      })}
      <text x={margin - 16} y={(baseY + topY) / 2} textAnchor="middle" fontSize="11" fill="#555"
        transform={`rotate(-90,${margin - 16},${(baseY + topY) / 2})`}>H = {H}m</text>
      {hw > 0 && <text x={fillRight + 4} y={hwY - 3} fontSize="9" fill={WATER_COLOR}>hw={hw}m</text>}
    </svg>
  )
}

export default function WallDiagram({ wallType, params, results }) {
  return (
    <div className="w-full">
      <div className="text-xs text-gray-400 text-center mb-2 uppercase tracking-widest">Cross-section (not to scale)</div>
      {wallType === 0 && <GravityDiagram params={params} results={results} />}
      {wallType === 1 && <CantileverDiagram params={params} results={results} />}
      {wallType === 2 && <MiniPileDiagram params={params} />}
      {wallType === 3 && <SkinWallDiagram params={params} results={results} />}
    </div>
  )
}

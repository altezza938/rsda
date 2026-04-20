/**
 * Live SVG cross-section for Wall Design tabs (SLS/ULS).
 * Draws wall body, fill, groundwater, force arrows, soil nails.
 */

const DEG = Math.PI / 180
const SCALE_BASE = 60   // px per metre (auto-adjusted)

function scl(val, s) { return val * s }

export default function WallSVG({ H = 3, B = 0.5, B2 = 0.6, hw = 1.0, Pa_h = 22.83, Pa_v = 8.31, nailRows = [] }) {
  const W_svg  = 320
  const H_svg  = 300
  const margin = { left: 50, right: 50, top: 30, bottom: 40 }

  // Auto scale to fit
  const maxDim = Math.max(H, B + B2 + 1.5)
  const s = Math.min(SCALE_BASE, (H_svg - margin.top - margin.bottom) / maxDim)

  const baseY = H_svg - margin.bottom
  const topY  = baseY - scl(H, s)
  const toeX  = margin.left

  // Wall body rect (B wide)
  const wallRight = toeX + scl(B, s)
  // Fill area to the right
  const fillRight = wallRight + scl(B2 + 1.2, s)
  // Water level
  const hwY = hw > 0 ? baseY - scl(hw, s) : null

  // Arrow helper
  function arrow(x1, y1, x2, y2, color, label) {
    const dx = x2 - x1, dy = y2 - y1
    const angle = Math.atan2(dy, dx)
    const headLen = 8
    const h1x = x2 - headLen * Math.cos(angle - 0.4)
    const h1y = y2 - headLen * Math.sin(angle - 0.4)
    const h2x = x2 - headLen * Math.cos(angle + 0.4)
    const h2y = y2 - headLen * Math.sin(angle + 0.4)
    return (
      <g key={label}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
        <polygon points={`${x2},${y2} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />
        {label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} fontSize="8" fill={color} textAnchor="middle">{label}</text>}
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W_svg} ${H_svg}`} className="w-full h-56 drop-shadow-sm">
      {/* Hatch pattern for fill */}
      <defs>
        <pattern id="wsvg-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#8B7355" strokeWidth="1.2" />
        </pattern>
        <pattern id="wsvg-water" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="8" y2="4" stroke="#93C5FD" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Ground line */}
      <line x1={toeX - 8} y1={baseY} x2={fillRight + 8} y2={baseY} stroke="#555" strokeWidth="2" />

      {/* Fill (behind wall) */}
      <rect x={wallRight} y={topY} width={fillRight - wallRight} height={baseY - topY}
        fill="url(#wsvg-hatch)" opacity="0.7" />

      {/* Water in fill */}
      {hwY && (
        <rect x={wallRight} y={hwY} width={fillRight - wallRight} height={baseY - hwY}
          fill="url(#wsvg-water)" opacity="0.5" />
      )}

      {/* Wall body */}
      <rect x={toeX} y={topY} width={scl(B, s)} height={scl(H, s)}
        fill="#D4C5A9" stroke="#888" strokeWidth="1.5" />

      {/* Water line */}
      {hwY && (
        <line x1={wallRight} y1={hwY} x2={fillRight} y2={hwY}
          stroke="#60A5FA" strokeWidth="2" strokeDasharray="6,3" />
      )}

      {/* Force arrows */}
      {Pa_h > 0 && arrow(fillRight - 10, baseY - scl(H / 3, s),
        wallRight + 4, baseY - scl(H / 3, s), '#E74C3C', `Pah=${Pa_h.toFixed(1)}`)}
      {arrow(toeX + scl(B / 2, s), topY - 4, toeX + scl(B / 2, s), topY - 24, '#27AE60', `W`)}

      {/* Soil nail lines */}
      {nailRows.map((n, i) => {
        const yN = baseY - scl(n.depth || 0, s)
        const xN0 = wallRight
        const xN1 = xN0 + scl(n.length * 0.7, s)
        const inc_r = (n.inclination_deg || 10) * DEG
        const yN1 = yN + scl(n.length * 0.7, s) * Math.tan(inc_r)
        return (
          <g key={i}>
            <line x1={xN0} y1={yN} x2={xN1} y2={yN1} stroke="#2D6A4F" strokeWidth="2" />
            <circle cx={xN0} cy={yN} r="3" fill="#2D6A4F" />
          </g>
        )
      })}

      {/* Dimension labels */}
      <text x={toeX + scl(B / 2, s)} y={baseY + 16} textAnchor="middle" fontSize="10" fill="#555">
        B={B}m
      </text>
      <text x={toeX - 12} y={(baseY + topY) / 2} textAnchor="middle" fontSize="10" fill="#555"
        transform={`rotate(-90,${toeX - 12},${(baseY + topY) / 2})`}>H={H}m</text>
      {hwY && (
        <text x={fillRight + 4} y={hwY - 3} fontSize="9" fill="#60A5FA">hw={hw}m</text>
      )}

      {/* Label */}
      <text x={W_svg / 2} y={16} textAnchor="middle" fontSize="9" fill="#9ca3af" letterSpacing="1">
        CROSS-SECTION (not to scale)
      </text>
    </svg>
  )
}

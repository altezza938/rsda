/**
 * FR146 Trial Wedge — coordinate-based polygon area method.
 *
 * Points:  O(x0,y0) wall base toe, A(xA,yA) top of wall face
 * Wedge points [{ x, y }] traced along the slope profile outward from O.
 *
 * Key angles (from VERTICAL):
 *   ω = -arctan((xA-x0)/(yA-y0))   wall batter from vertical
 *   θi = arctan((xi-x0)/(yi-y0))   failure plane angle from vertical
 *
 * Area of triangle O–P(i-1)–P(i) using shoelace:
 *   Gi = |0.5*(x0*y(i-1) + x(i-1)*yi + xi*y0 - y0*x(i-1) - y(i-1)*xi - yi*x0)|
 *   Ai = cumulative Σ Gi
 *
 * Pa formula (exact FR146):
 *   num = W+q - U1sinω - U2sinθ - c'Licosθ + tan(θ+φ')*(U2cosθ - U1cosω - c'Lisinθ) - nailNum
 *   den = cos(δ+ω)*tan(θ+φ') + sin(δ+ω)
 *   Pa  = num / den   (if den>0 && Pa>0, else null)
 */

const GAMMA_W = 9.81

export function trialWedgeFR146({
  origin    = { x: 0, y: 48.7 },
  wallTop   = { x: 0, y: 49.7 },
  wedgePoints = [],              // [{ x, y }] — profile points from toe outward
  gamma  = 19,
  phi    = 30,
  cohesion = 0,
  delta  = 20,                   // wall friction angle °
  hw     = 0.333,                // water height (m)
  surcharges = [],               // [{ x1, x2, q }] — loaded strips
  nailRows   = [],               // [{ yLevel, force, inclination_deg }]
}) {
  const phi_r   = phi   * Math.PI / 180
  const delta_r = delta * Math.PI / 180

  const { x: x0, y: y0 } = origin
  const { x: xA, y: yA } = wallTop

  // Wall batter ω (positive = wall leans into fill)
  const omega   = -Math.atan2(xA - x0, yA - y0)     // radians
  const omega_r = omega

  // Seed: point before first wedge is the wall top A (first slice)
  // The "0th" profile point is A for the running wedge
  // Build cumulative polygon starting from toe O

  const rows = []
  let Aprev   = 0
  let xPrev   = xA
  let yPrev   = yA

  for (let i = 0; i < wedgePoints.length; i++) {
    const { x: xi, y: yi } = wedgePoints[i]

    // Triangle area (shoelace)
    const Gi = Math.abs(
      0.5 * (x0 * yPrev + xPrev * yi + xi * y0 - y0 * xPrev - yPrev * xi - yi * x0)
    )
    const Ai = Aprev + Gi

    // Weight
    const W = gamma * Ai

    // Failure plane geometry from O to current point i
    const dx  = xi - x0
    const dy  = yi - y0
    const Li  = Math.sqrt(dx * dx + dy * dy)
    const theta_r = Math.atan2(dx, dy)   // angle from vertical

    // Surcharge on this wedge's horizontal extent [xPrev, xi]
    const xLeft  = Math.min(xPrev, xi)
    const xRight = Math.max(xPrev, xi)
    let q = 0
    for (const sur of surcharges) {
      const overlap = Math.max(0, Math.min(sur.x2, xRight) - Math.max(sur.x1, xLeft))
      q += sur.q * overlap
    }

    // Water pressures
    const U1 = hw > 0 ? 0.5 * GAMMA_W * hw * hw / Math.cos(omega_r) : 0
    const U2 = hw > 0 ? 0.5 * GAMMA_W * hw * hw / Math.cos(theta_r) : 0

    // Cohesion along failure plane
    const C = cohesion * Li

    // Nails: contribute if failure plane has passed nail's x-position at that level
    let nailH = 0, nailV = 0
    for (const nail of nailRows) {
      const yNail = nail.yLevel
      if (yNail >= y0 && yNail <= yi) {
        // x-position of failure plane at nail level
        const xFail = x0 + (yNail - y0) * Math.tan(theta_r)
        // x-position of wall face at nail level
        const xWall = x0 + (yNail - y0) * Math.tan(omega_r)
        if (xFail > xWall) {
          const inc_r = (nail.inclination_deg || 0) * Math.PI / 180
          nailH += nail.force * Math.cos(inc_r)
          nailV += nail.force * Math.sin(inc_r)
        }
      }
    }

    const tpf = Math.tan(theta_r + phi_r)

    const numerator = (W + q - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                    + tpf * (U2 * Math.cos(theta_r) - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
                    - nailH - tpf * nailV

    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)

    const Pa = (denominator > 0) ? numerator / denominator : null

    rows.push({
      wedge: i + 1,
      xi, yi,
      theta_deg: theta_r / (Math.PI / 180),
      Gi, Ai, W, q, U1, U2, Li,
      nailH, nailV, C,
      numerator, denominator, Pa,
    })

    Aprev = Ai
    xPrev = xi
    yPrev = yi
  }

  // Critical Pa = maximum positive Pa
  let PaMax = -Infinity
  let critIdx = -1
  rows.forEach((r, i) => {
    if (r.Pa !== null && r.Pa > PaMax) { PaMax = r.Pa; critIdx = i }
  })

  rows.forEach((r, i) => { r.active = i === critIdx })

  return {
    Pa: PaMax > 0 ? PaMax : 0,
    criticalWedge: critIdx + 1,
    omega_deg: omega_r / (Math.PI / 180),
    rows,
  }
}

/** Simple θ-sweep (H-based) trial wedge for wall design tabs */
export function trialWedgeSimple({
  H, gamma, cohesion = 0, phi, delta, omega = 0, hw = 0, surcharge = 0,
}) {
  const phi_r   = phi   * Math.PI / 180
  const delta_r = delta * Math.PI / 180
  const omega_r = omega * Math.PI / 180

  let PaMax = -Infinity, thetaCrit = 45
  const rows = []

  for (let theta_deg = 20; theta_deg <= 80; theta_deg++) {
    const theta_r = theta_deg * Math.PI / 180

    const W_area = 0.5 * H * H * (Math.tan(theta_r) - Math.tan(omega_r))
    if (W_area <= 0) { rows.push({ theta: theta_deg, Pa: null, active: false }); continue }

    const W    = gamma * W_area + surcharge * H * (Math.tan(theta_r) - Math.tan(omega_r))
    const hw_e = Math.min(hw, H)
    const U1   = hw_e > 0 ? 0.5 * GAMMA_W * hw_e * hw_e / Math.cos(omega_r) : 0
    const U2   = hw_e > 0 ? 0.5 * GAMMA_W * hw_e * hw_e / Math.cos(theta_r) : 0
    const Li   = H / Math.cos(theta_r)
    const C    = cohesion * Li
    const tpf  = Math.tan(theta_r + phi_r)

    const numerator   = (W - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                      + tpf * (U2 * Math.cos(theta_r) - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)
    const Pa = denominator > 0 ? numerator / denominator : null

    rows.push({ theta: theta_deg, W_area, W, U1, U2, C, Li, numerator, denominator, Pa, active: false })
    if (Pa !== null && Pa > PaMax) { PaMax = Pa; thetaCrit = theta_deg }
  }

  rows.forEach(r => { r.active = r.theta === thetaCrit })
  return { Pa: Math.max(0, PaMax), thetaCrit, rows }
}

/**
 * Trial Wedge Method for Active Earth Pressure Pa (kN/m)
 * Based on FR146 workbook logic.
 *
 * Wall face batter ω (rad) measured from vertical (positive = wall leans into fill).
 * Wedge failure angle θ measured from vertical on fill side.
 * Iterates θ from 20° to 80° in 1° steps; Pa = maximum over all θ.
 *
 * Soil nail forces (optional) reduce the driving force on each wedge.
 */

const DEG = Math.PI / 180
const GAMMA_W = 9.81

/**
 * Compute Pa for a single wall height/geometry without soil nails.
 * Returns { Pa, theta_crit, details[] }
 */
export function trialWedge({ H, gamma, cohesion, phi, delta, omega, hw, surcharge = 0 }) {
  const phi_r  = phi   * DEG
  const delta_r = delta * DEG
  const omega_r = omega * DEG   // wall face batter from vertical (positive leans back)

  let PaMax = -Infinity
  let thetaCrit = 45
  const details = []

  for (let theta_deg = 20; theta_deg <= 80; theta_deg++) {
    const theta_r = theta_deg * DEG

    // Wedge geometry
    // Wall face: from base of wall at origin upward; retained fill behind.
    // Failure plane angle θ from vertical.
    // Height of wedge on failure plane:
    const h = H   // retained height

    // Length of failure plane from toe
    const Li = h / Math.cos(theta_r)

    // Wedge area (triangle) between wall face and failure plane
    // x-width of wedge at top = H*(tan θ - tan ω)
    const W_area = 0.5 * h * h * (Math.tan(theta_r) - Math.tan(omega_r))
    if (W_area <= 0) continue

    const W = gamma * W_area + surcharge * h * (Math.tan(theta_r) - Math.tan(omega_r))

    // Water pressures (triangular, up to hw)
    const hw_eff = Math.min(hw, h)
    // U1: water pressure on wall face (inclined at ω from vertical)
    const U1 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(omega_r)
    // U2: water pressure on failure plane
    const U2 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(theta_r)

    // Cohesion force on failure plane
    const C = cohesion * Li

    // FR146 formula for Pa:
    // Pa = [W - U1·sin(ω) - U2·sin(θ) - C·cos(θ)
    //       + tan(θ+φ')·(U2·cos(θ) - U1·cos(ω) - C·sin(θ))]
    //      / [cos(δ+ω)·tan(θ+φ') + sin(δ+ω)]
    const tpf = Math.tan(theta_r + phi_r)
    const numerator = (W - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                    + tpf * (U2 * Math.cos(theta_r) - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)

    if (denominator <= 0) continue
    const Pa = numerator / denominator

    details.push({ theta: theta_deg, Pa, W, U1, U2, C, Li })

    if (Pa > PaMax) {
      PaMax = Pa
      thetaCrit = theta_deg
    }
  }

  return { Pa: Math.max(0, PaMax), thetaCrit, details }
}

/**
 * Trial wedge WITH soil nails (Type 4 skin wall).
 * Each nail provides a stabilising horizontal force component.
 * nails: [{ T, inclination_deg, level_mPD, wallTopLevel }]
 * Returns { Pa, thetaCrit }
 */
export function trialWedgeWithNails({ H, gamma, cohesion, phi, delta, omega, hw, surcharge = 0, nails = [] }) {
  const phi_r   = phi   * DEG
  const delta_r = delta * DEG
  const omega_r = omega * DEG

  let PaMax = -Infinity
  let thetaCrit = 45
  const details = []

  for (let theta_deg = 20; theta_deg <= 80; theta_deg++) {
    const theta_r = theta_deg * DEG

    const W_area = 0.5 * H * H * (Math.tan(theta_r) - Math.tan(omega_r))
    if (W_area <= 0) continue

    const W = gamma * W_area + surcharge * H * (Math.tan(theta_r) - Math.tan(omega_r))
    const hw_eff = Math.min(hw, H)
    const U1 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(omega_r)
    const U2 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(theta_r)
    const Li = H / Math.cos(theta_r)
    const C  = cohesion * Li

    // Sum nail forces intersecting this wedge
    let nailH = 0
    let nailV = 0
    for (const nail of nails) {
      const depthFromTop = nail.wallTopLevel - nail.level_mPD
      if (depthFromTop < 0 || depthFromTop > H) continue
      // Check if nail intersects failure plane at this wedge angle
      const xNail = depthFromTop * Math.tan(theta_r)  // horizontal position of failure plane at nail depth
      const xNailWall = depthFromTop * Math.tan(omega_r)
      // nail length projection at this depth – simplified: nail contributes if its horizontal extent > 0
      if (xNail > xNailWall) {
        const inc_r = nail.inclination_deg * DEG
        nailH += nail.T * Math.cos(inc_r)
        nailV += nail.T * Math.sin(inc_r)
      }
    }

    const tpf = Math.tan(theta_r + phi_r)
    const numerator = (W - nailV - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                    + tpf * (U2 * Math.cos(theta_r) - nailH - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)

    if (denominator <= 0) continue
    const Pa = numerator / denominator
    details.push({ theta: theta_deg, Pa })
    if (Pa > PaMax) { PaMax = Pa; thetaCrit = theta_deg }
  }

  return { Pa: Math.max(0, PaMax), thetaCrit, details }
}

/**
 * Trial Wedge Method for Active Earth Pressure Pa (kN/m)
 * Based on FR146 workbook logic.
 * Returns full iteration table as well as the critical Pa.
 */

const DEG = Math.PI / 180
const GAMMA_W = 9.81

export function trialWedge({ H, gamma, cohesion, phi, delta, omega, hw = 0, surcharge = 0 }) {
  const phi_r   = phi   * DEG
  const delta_r = delta * DEG
  const omega_r = omega * DEG

  let PaMax = -Infinity
  let thetaCrit = 45
  const rows = []   // full iteration table

  for (let theta_deg = 20; theta_deg <= 80; theta_deg++) {
    const theta_r = theta_deg * DEG

    const W_area = 0.5 * H * H * (Math.tan(theta_r) - Math.tan(omega_r))
    if (W_area <= 0) {
      rows.push({ theta: theta_deg, W: 0, U1: 0, U2: 0, C: 0, Li: 0, Pa: null, active: false })
      continue
    }

    const W  = gamma * W_area + surcharge * H * (Math.tan(theta_r) - Math.tan(omega_r))
    const hw_eff = Math.min(hw, H)
    const U1 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(omega_r)
    const U2 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(theta_r)
    const Li = H / Math.cos(theta_r)
    const C  = cohesion * Li

    const tpf = Math.tan(theta_r + phi_r)
    const numerator = (W - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                    + tpf * (U2 * Math.cos(theta_r) - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)

    const Pa = denominator > 0 ? numerator / denominator : null

    rows.push({ theta: theta_deg, W_area, W, U1, U2, C, Li, numerator, denominator, Pa, active: false })

    if (Pa !== null && Pa > PaMax) {
      PaMax = Pa
      thetaCrit = theta_deg
    }
  }

  // Mark the critical row
  rows.forEach(r => { r.active = r.theta === thetaCrit })

  return { Pa: Math.max(0, PaMax), thetaCrit, rows }
}

export function trialWedgeWithNails({ H, gamma, cohesion, phi, delta, omega, hw = 0, surcharge = 0, nails = [] }) {
  const phi_r   = phi   * DEG
  const delta_r = delta * DEG
  const omega_r = omega * DEG

  let PaMax = -Infinity
  let thetaCrit = 45
  const rows = []

  for (let theta_deg = 20; theta_deg <= 80; theta_deg++) {
    const theta_r = theta_deg * DEG

    const W_area = 0.5 * H * H * (Math.tan(theta_r) - Math.tan(omega_r))
    if (W_area <= 0) {
      rows.push({ theta: theta_deg, Pa: null, active: false })
      continue
    }

    const W  = gamma * W_area + surcharge * H * (Math.tan(theta_r) - Math.tan(omega_r))
    const hw_eff = Math.min(hw, H)
    const U1 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(omega_r)
    const U2 = 0.5 * GAMMA_W * hw_eff * hw_eff / Math.cos(theta_r)
    const Li = H / Math.cos(theta_r)
    const C  = cohesion * Li

    let nailH = 0, nailV = 0
    for (const nail of nails) {
      const depth = nail.wallTopLevel - nail.level_mPD
      if (depth < 0 || depth > H) continue
      const xNail = depth * Math.tan(theta_r)
      const xWall = depth * Math.tan(omega_r)
      if (xNail > xWall) {
        const inc_r = nail.inclination_deg * DEG
        nailH += nail.T * Math.cos(inc_r)
        nailV += nail.T * Math.sin(inc_r)
      }
    }

    const tpf = Math.tan(theta_r + phi_r)
    const numerator = (W - nailV - U1 * Math.sin(omega_r) - U2 * Math.sin(theta_r) - C * Math.cos(theta_r))
                    + tpf * (U2 * Math.cos(theta_r) - nailH - U1 * Math.cos(omega_r) - C * Math.sin(theta_r))
    const denominator = Math.cos(delta_r + omega_r) * tpf + Math.sin(delta_r + omega_r)

    const Pa = denominator > 0 ? numerator / denominator : null
    rows.push({ theta: theta_deg, W, U1, U2, C, Li, nailH, nailV, Pa, active: false })
    if (Pa !== null && Pa > PaMax) { PaMax = Pa; thetaCrit = theta_deg }
  }

  rows.forEach(r => { r.active = r.theta === thetaCrit })
  return { Pa: Math.max(0, PaMax), thetaCrit, rows }
}

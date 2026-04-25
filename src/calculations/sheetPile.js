/**
 * Sheet Pile Design Calculations
 *
 * Implements:
 *  - rankineCoeffs        : Rankine Ka, Kp for cohesionless soil
 *  - cantileverSheetPile  : cantilever wall – net pressure method (Das, 2022 Ch.11)
 *  - proppedSheetPile     : propped / anchored wall – free earth support method
 *
 * Conventions:
 *  - All depths/heights in metres (m)
 *  - Pressures in kPa, forces in kN/m (per metre run of wall)
 *  - Positive active pressure acts toward the wall (driving)
 *  - Positive passive pressure acts away from the wall (resisting)
 *
 * References:
 *  Das, B. M. (2022) Principles of Foundation Engineering, 10th ed., Ch.11.
 *
 * Verification – rankineCoeffs:
 *   phi=30° → Ka = tan²(30°) = 0.3333, Kp = tan²(60°) = 3.0000  ✓
 *   phi=32° → Ka = 0.3073, Kp = 3.2546  ✓
 *
 * Verification – cantileverSheetPile (Das Example 11.1 style):
 *   H=6m, phi=32°, gamma=15.9 kN/m³, dry → D ≈ 3.09 m (Das ≈ 2.96–3.0 m, within 5%)  ✓
 *
 * Verification – proppedSheetPile:
 *   H=5m, phi=30°, gamma=18 kN/m³, dry, prop at top → D ≈ 1.305 m  ✓
 */

const DEG    = Math.PI / 180
const gammaW = 9.81      // kN/m³

// ---------------------------------------------------------------------------
// 1. Rankine Coefficients
// ---------------------------------------------------------------------------

/**
 * Rankine lateral earth pressure coefficients for cohesionless soil.
 *
 * Ka = tan²(45 − φ/2)
 * Kp = tan²(45 + φ/2)
 *
 * @param {number} phi – friction angle (°)
 * @returns {{ Ka, Kp }}
 */
export function rankineCoeffs(phi) {
  const Ka = Math.pow(Math.tan((45 - phi / 2) * DEG), 2)
  const Kp = Math.pow(Math.tan((45 + phi / 2) * DEG), 2)
  return { Ka, Kp }
}

// ---------------------------------------------------------------------------
// Shared helper: active resultant components above the dredge line
// Returns { Pa, y_Pa, sigma_a_dredge }
// ---------------------------------------------------------------------------

function activeResultant({ H, Ka, gamma, gammaSat, hw_ret }) {
  const gamma_sub  = gammaSat - gammaW
  const H_dry = Math.max(0, H - hw_ret)   // zone above water table
  const H_wet = H - H_dry                 // zone below WT (above dredge)

  const sigma_a_WT     = Ka * gamma * H_dry
  const sigma_a_dredge = sigma_a_WT
                       + Ka * gamma_sub * H_wet
                       + gammaW * H_wet   // effective + hydrostatic

  let Pa = 0, sum_moment = 0

  // 1. Triangular above WT
  if (H_dry > 0) {
    const F = 0.5 * Ka * gamma * H_dry * H_dry
    const arm = H_wet + H_dry / 3
    Pa += F; sum_moment += F * arm
  }

  // 2. Rectangular from WT to dredge (due to dry-zone pressure step)
  if (H_wet > 0 && sigma_a_WT > 0) {
    const F = sigma_a_WT * H_wet
    const arm = H_wet / 2
    Pa += F; sum_moment += F * arm
  }

  // 3. Triangular from WT to dredge (effective soil increment below WT)
  if (H_wet > 0) {
    const F = 0.5 * Ka * gamma_sub * H_wet * H_wet
    const arm = H_wet / 3
    Pa += F; sum_moment += F * arm

    // 4. Hydrostatic water triangle
    const Fw = 0.5 * gammaW * H_wet * H_wet
    Pa += Fw; sum_moment += Fw * (H_wet / 3)
  }

  const y_Pa = Pa > 0 ? sum_moment / Pa : H / 3

  return { Pa, y_Pa, sigma_a_dredge }
}

// ---------------------------------------------------------------------------
// 2. Cantilever Sheet Pile  (net pressure method – Das Ch.11)
// ---------------------------------------------------------------------------

/**
 * Cantilever sheet pile in cohesionless soil.
 *
 * Net pressure distribution below the dredge line (Das net-pressure approach):
 *   p_net(d) = (Kp − Ka) · γ_below · d − σ_a_dredge    (d = depth below dredge)
 *   Zero at:  z1 = σ_a_dredge / [(Kp−Ka)·γ_below]
 *
 * The active resultant Pa (from H above dredge) plus the net active
 * triangle (0 to z1) must be balanced by the net passive triangle (z1 to D).
 * Taking moments about the zero-net-pressure point z1:
 *
 *   Pa·(y_Pa + z1)  +  P2·(z1/3)  =  P3·(2a/3)
 *   where a = D − z1, P2 = ½σ_a_dredge·z1, P3 = ½·Knet·a²
 *
 * Solving:  a³ = 3·[Pa·(y_Pa+z1) + P2·z1/3] / Knet   → a = ∛(rhs)
 *
 * γ_below:
 *   No WT below dredge (hw_ret=0): γ_below = γ      (dry soil)
 *   Submerged below dredge:        γ_below = γ_sub   (effective weight)
 *
 * @param {object} p
 * @param {number} p.H           – retained height above dredge (m)
 * @param {number} p.phi         – friction angle (°)
 * @param {number} p.gamma       – bulk unit weight above WT (kN/m³)
 * @param {number} p.gammaSat    – saturated unit weight (kN/m³); default gamma+1
 * @param {number} p.hw_ret      – height of water table above dredge, retained side (m)
 * @param {number} p.FOS_embed   – embedment factor applied to D (default 1.3)
 * @returns {{ Ka, Kp, Pa, y_Pa, z1, D, D_design, z0, M_max, sigma_a_dredge }}
 */
export function cantileverSheetPile({
  H,
  phi,
  gamma,
  gammaSat  = gamma + 1,
  hw_ret    = 0,
  FOS_embed = 1.3,
}) {
  const { Ka, Kp } = rankineCoeffs(phi)

  // Active resultant and point of action
  const { Pa, y_Pa, sigma_a_dredge } = activeResultant({
    H, Ka, gamma, gammaSat, hw_ret,
  })

  // Effective unit weight for net pressure below dredge
  // When hw_ret = 0 (fully dry): use gamma; when submerged: use gamma' = gammaSat-gammaW
  const gamma_below = hw_ret > 0 ? (gammaSat - gammaW) : gamma

  // Net pressure gradient below dredge (kPa per metre)
  const Knet = (Kp - Ka) * gamma_below

  // Depth of zero net pressure below dredge
  const z1 = Knet > 0 ? sigma_a_dredge / Knet : 0

  // Net active force over 0 to z1 (triangle, drives pile)
  const P2 = 0.5 * sigma_a_dredge * z1

  // Solve cubic for a = D − z1 (moment equilibrium about z1 point):
  //   Pa*(y_Pa+z1) + P2*(z1/3) = P3*(2a/3) = (0.5*Knet*a²)*(2a/3) = Knet*a³/3
  // → a³ = 3*(Pa*(y_Pa+z1) + P2*z1/3) / Knet
  const rhs = Pa * (y_Pa + z1) + P2 * (z1 / 3)
  const a   = Knet > 0 ? Math.cbrt(3 * rhs / Knet) : 0
  const D   = a + z1

  const D_design = D * FOS_embed

  // Depth of zero shear below dredge (z0), for maximum bending moment.
  // Shear below dredge: V(d) = Pa + P2_part(d) − passive_integral(d)
  // For d ≤ z1: V = Pa + [0.5*sigma_a_d*(z1²-(z1-d)²)/z1] ... simplified:
  //   net active still dominates; shear = Pa + delta_V_from_active_triangle_above
  //   V(d) = Pa + 0.5*sigma_a_dredge*d - ... let's use net pressure directly.
  //
  // Net shear at depth d below dredge = Pa (from above) + ∫₀ᵈ p_net(δ) dδ, where p_net is negative for d<z1
  //   V(d) = Pa − ∫₀ᵈ |p_net(δ)| dδ  for d ≤ z1
  //        = Pa − (sigma_a_dredge*d − 0.5*Knet*d²)   ... linear in active, quadratic passve
  //   OR more simply with net: V(d) = Pa − sigma_a_dredge*d + 0.5*Knet*d²  (taking active as negative)
  //
  // Set V(z0) = 0:  0 = Pa − sigma_a_dredge*z0 + 0.5*Knet*z0²
  // Solve quadratic: 0.5*Knet*z0² − sigma_a_dredge*z0 + Pa = 0

  let z0 = D  // fallback
  if (Knet > 0) {
    const A_q = 0.5 * Knet
    const B_q = -sigma_a_dredge
    const C_q = Pa
    const disc = B_q * B_q - 4 * A_q * C_q
    if (disc >= 0) {
      const z0a = (-B_q - Math.sqrt(disc)) / (2 * A_q)
      const z0b = (-B_q + Math.sqrt(disc)) / (2 * A_q)
      // Take the smallest positive root below D
      const candidates = [z0a, z0b].filter(v => v > 0 && v <= D)
      if (candidates.length > 0) {
        z0 = Math.min(...candidates)
      }
    }
  }

  // Maximum bending moment at z0:
  // M_max = Pa*(y_Pa + z0) − (integral of net pressure from 0 to z0, weighted by arm)
  // = Pa*(y_Pa + z0) − [sigma_a_dredge*z0²/2 − Knet*z0³/6]
  const M_max = Pa * (y_Pa + z0)
              - (sigma_a_dredge * z0 * z0 / 2 - Knet * z0 * z0 * z0 / 6)

  return {
    Ka, Kp,
    Pa,             // active resultant above dredge (kN/m)
    y_Pa,           // height of Pa above dredge (m)
    z1,             // depth of zero net pressure below dredge (m)
    D,              // theoretical embedment depth (m)
    D_design,       // design embedment = D × FOS_embed (m)
    z0,             // depth of maximum bending moment below dredge (m)
    M_max,          // maximum bending moment (kN·m/m)
    sigma_a_dredge, // active pressure at dredge level (kPa)
  }
}

// ---------------------------------------------------------------------------
// 3. Propped Sheet Pile  (Free Earth Support Method)
// ---------------------------------------------------------------------------

/**
 * Propped / anchored sheet pile in cohesionless soil – free earth support.
 *
 * The prop (anchor) is at depth `prop_depth` from the top of the wall
 * (i.e. at height h_prop = H − prop_depth above the dredge level).
 *
 * Active pressure distribution:
 *   Above WT: σ_a = Ka·γ·z
 *   Below WT: σ_a = Ka·(γ·H_dry + γ'·(z−H_dry)) + γw·(z−H_dry)
 *
 * Passive pressure below dredge (using γ_below):
 *   σ_p(d) = Kp · γ_below · d
 *
 * Free earth support: moments about the prop location → find D.
 *
 * Moment of passive about prop:
 *   Pp = 0.5·Kp·γ_below·D²   acts at h_prop + D/3 below prop
 *   Pp·(h_prop + D/3) = M_active_about_prop
 *   This is a cubic in D; solved analytically (same pattern as cantilever).
 *
 * γ_below = γ (dry) or γ' = γ_sat − γ_w (submerged).
 *
 * @param {object} p
 * @param {number} p.H           – retained height above dredge (m)
 * @param {number} p.phi         – friction angle (°)
 * @param {number} p.gamma       – bulk unit weight above WT (kN/m³)
 * @param {number} p.gammaSat    – saturated unit weight (kN/m³)
 * @param {number} p.hw_ret      – water table height above dredge, retained side (m)
 * @param {number} p.prop_depth  – depth of prop from top of wall (m); 0 = prop at top
 * @param {number} p.FOS_embed   – embedment factor (default 1.3)
 * @returns {{ Ka, Kp, Pa, D, D_design, T, M_max }}
 */
export function proppedSheetPile({
  H,
  phi,
  gamma,
  gammaSat   = gamma + 1,
  hw_ret     = 0,
  prop_depth = 0,
  FOS_embed  = 1.3,
}) {
  const { Ka, Kp } = rankineCoeffs(phi)

  // Effective unit weight below dredge
  const gamma_below = hw_ret > 0 ? (gammaSat - gammaW) : gamma

  // Active resultant
  const { Pa, y_Pa } = activeResultant({ H, Ka, gamma, gammaSat, hw_ret })

  // Height of prop above dredge
  const h_prop = H - prop_depth

  // Moment of active forces about prop location (positive = anti-clockwise when viewed
  // from the right, i.e. in the direction the wall deflects)
  // Active resultant acts at y_Pa above dredge → arm from prop = h_prop − y_Pa
  const M_active = Pa * (h_prop - y_Pa)

  // Passive resultant: Pp = 0.5*Kp*gamma_below*D^2, acts at D/3 above dredge
  // Arm from prop (below prop): h_prop + D/3
  // Moment balance: Pp * (h_prop + D/3) = M_active
  //   0.5*Kp*gamma_below*D^2 * (h_prop + D/3) = M_active
  //   (Kp*gamma_below/6)*D^3 + (0.5*Kp*gamma_below*h_prop)*D^2 − M_active = 0
  //
  // Solve cubic by bisection (numerically stable).

  function f(D) {
    const Pp  = 0.5 * Kp * gamma_below * D * D
    const arm = h_prop + D / 3
    return Pp * arm - M_active
  }

  let D_lo = 0.01, D_hi = 20 * H
  for (let iter = 0; iter < 120; iter++) {
    const mid = (D_lo + D_hi) / 2
    if (f(mid) < 0) D_lo = mid
    else             D_hi = mid
    if (D_hi - D_lo < 1e-6) break
  }
  const D = (D_lo + D_hi) / 2

  const D_design = D * FOS_embed

  // Prop / anchor force (horizontal equilibrium)
  const Pp_total = 0.5 * Kp * gamma_below * D * D
  const T        = Math.max(0, Pa - Pp_total)

  // Maximum bending moment – located where shear V = 0 below the prop.
  // Taking downward positive, shear at depth z below prop:
  //   V(z) = T − ∫₀ᶻ σ_a(prop+z') dz'
  // Simplified for uniform effective active gradient Ka*gamma_avg:
  const gamma_a_avg = hw_ret > 0
    ? (H * Ka * gamma + hw_ret * Ka * (gammaSat - gammaW)) / H
    : Ka * gamma
  // V(z) = T − 0.5*gamma_a_avg*z² (below prop, ignoring step change for simplicity)
  // V(z0) = 0 → z0 = sqrt(2T / gamma_a_avg)
  let M_max = 0
  if (gamma_a_avg > 0) {
    const z0 = Math.sqrt(2 * T / gamma_a_avg)
    // M at z0 below prop
    M_max = T * z0 - (gamma_a_avg * z0 * z0 * z0) / 6
  }

  return {
    Ka, Kp,
    Pa,        // active resultant (kN/m)
    D,         // theoretical embedment (m)
    D_design,  // design embedment = D × FOS_embed (m)
    T,         // prop/anchor force (kN/m)
    M_max,     // maximum bending moment (kN·m/m)
  }
}

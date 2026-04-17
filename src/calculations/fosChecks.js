/**
 * FOS checks for Gravity and L-Cantilever walls.
 * All forces in kN/m (per metre run of wall).
 *
 * Gravity wall: trapezoidal concrete mass, back face vertical (or battering).
 *   - Wall weight only (no fill on heel – pure gravity section).
 *   - Pa applied on back face via trial wedge.
 *
 * L-Cantilever wall: concrete stem + base slab.
 *   - Fill weight on heel slab contributes to resistance.
 */

import { trialWedge } from './trialWedge.js'
import { vesicBearing } from './bearingCapacity.js'

const DEG = Math.PI / 180
const GAMMA_W = 9.81

/** Centroid of trapezoid from TOE.
 *  Assumes back face is vertical at x = B, front face tapered.
 *  Bottom width B, top width bt (< B), height H.
 */
function trapezoidCentroid(B, bt, H) {
  // Split into rectangle (bt × H) at heel side + triangle ((B-bt) × H) at toe side
  const A_rect = bt * H
  const A_tri  = 0.5 * (B - bt) * H
  const x_rect = B - bt / 2                 // rectangle centroid from toe
  const x_tri  = (B - bt) / 3              // triangle centroid from toe
  return (A_rect * x_rect + A_tri * x_tri) / (A_rect + A_tri)
}

/**
 * Full gravity-wall stability check (pure concrete mass, no fill on base).
 */
export function gravityWallCheck(p) {
  const {
    H, B, bt = 0.4, batter = 0,
    gamma, cohesion, phi,
    hw = 0, surcharge = 0,
    gamma_f, cf, phif,
    Df = 0.5,
    gamma_wall = 24,
    delta,
  } = p

  const omega_r = batter * DEG
  const delta_r = delta  * DEG

  // Active earth pressure (trial wedge on back face)
  const { Pa, thetaCrit, details: wedgeDetails } = trialWedge({
    H, gamma, cohesion, phi, delta, omega: batter, hw, surcharge,
  })

  const Pa_h = Pa * Math.cos(delta_r + omega_r)
  const Pa_v = Pa * Math.sin(delta_r + omega_r)   // upward at back face

  // Wall concrete weight
  const A_wall = 0.5 * (bt + B) * H
  const W_wall = gamma_wall * A_wall

  // Vertical load on base: wall + Pa_v (upward = adds to normal)
  const hw_eff = Math.min(hw, H)
  const U_base = 0.5 * GAMMA_W * hw_eff * hw_eff   // uplift (triangular)
  const N = W_wall + Pa_v - U_base

  // --- FOS Sliding ---
  const F_resist_slide = N * Math.tan(phif * DEG) + cf * B
  const F_drive_slide  = Pa_h + GAMMA_W * hw_eff * hw_eff * Math.cos(omega_r) / 2  // Pa_h + water horizontal
  const FOS_sliding = F_drive_slide > 0 ? F_resist_slide / F_drive_slide : Infinity

  // --- FOS Overturning about toe ---
  const x_c   = trapezoidCentroid(B, bt, H)
  const Mr_wall = W_wall * x_c
  const Mr_Pa_v = Pa_v  * B               // Pa_v acts at heel (x = B)
  const Mo_Pa   = Pa_h  * H / 3           // triangular distribution
  const Mo_U    = U_base * B / 3

  const ΣMr = Mr_wall + Mr_Pa_v
  const ΣMo = Mo_Pa + Mo_U
  const FOS_overturning = ΣMo > 0 ? ΣMr / ΣMo : Infinity

  // --- FOS Bearing (Vesic) ---
  const e     = B / 2 - (ΣMr - ΣMo) / N
  const B_eff = Math.max(0.01, B - 2 * Math.abs(e))
  const bearing = vesicBearing({ cf, phif, gamma_f, B: B_eff, Df, Q: N, inclineDeg: 0 })

  return {
    Pa, thetaCrit, Pa_h, Pa_v,
    W_wall, W_fill: 0, W_total: W_wall + Pa_v, N, U_base,
    F_resist_slide, F_drive_slide,
    FOS_sliding,
    ΣMr, ΣMo, FOS_overturning,
    e, B_eff, bearing, FOS_bearing: bearing.FOS,
    wedgeDetails,
  }
}

/**
 * L-Cantilever wall: stem + base slab + fill on heel.
 * B = Lt (toe) + ts (stem) + Lh (heel)
 */
export function cantileverWallCheck(p) {
  const {
    H, ts = 0.3, tb = 0.5, Lh = 2.0, Lt = 0.5,
    gamma, cohesion, phi, hw = 0, surcharge = 0,
    gamma_f, cf, phif, Df = 0.5,
    gamma_wall = 24, delta, batter = 0,
  } = p

  const B = Lt + ts + Lh
  const omega_r = batter * DEG
  const delta_r = delta  * DEG

  // Earth pressure on back face of STEM
  const { Pa, thetaCrit, details: wedgeDetails } = trialWedge({
    H, gamma, cohesion, phi, delta, omega: batter, hw, surcharge,
  })
  const Pa_h = Pa * Math.cos(delta_r + omega_r)
  const Pa_v = Pa * Math.sin(delta_r + omega_r)

  // Weights (per metre run)
  const W_stem  = gamma_wall * ts * H
  const W_base  = gamma_wall * B  * tb
  const W_fill  = gamma * Lh * H            // fill on heel slab
  const W_total = W_stem + W_base + W_fill + Pa_v

  const hw_eff = Math.min(hw, H)
  const U_base = 0.5 * GAMMA_W * hw_eff * hw_eff
  const N = W_total - U_base

  // Centroid of each component from toe
  const x_stem  = Lt + ts / 2
  const x_base  = B / 2
  const x_fill  = Lt + ts + Lh / 2   // fill over heel

  // Sliding
  const F_resist_slide = N * Math.tan(phif * DEG) + cf * B
  const F_drive_slide  = Pa_h
  const FOS_sliding = F_drive_slide > 0 ? F_resist_slide / F_drive_slide : Infinity

  // Overturning about toe
  const ΣMr = W_stem * x_stem + W_base * x_base + W_fill * x_fill + Pa_v * B
  const ΣMo = Pa_h * H / 3 + U_base * B / 3
  const FOS_overturning = ΣMo > 0 ? ΣMr / ΣMo : Infinity

  // Bearing
  const e     = B / 2 - (ΣMr - ΣMo) / N
  const B_eff = Math.max(0.01, B - 2 * Math.abs(e))
  const bearing = vesicBearing({ cf, phif, gamma_f, B: B_eff, Df, Q: N, inclineDeg: 0 })

  // Base pressures
  const q_max = N / B + 6 * N * Math.abs(e) / (B * B)
  const q_min = N / B - 6 * N * Math.abs(e) / (B * B)

  return {
    Pa, thetaCrit, Pa_h, Pa_v,
    W_stem, W_base, W_fill, W_total, N, U_base,
    F_resist_slide, F_drive_slide, FOS_sliding,
    ΣMr, ΣMo, FOS_overturning,
    e, B_eff, bearing, FOS_bearing: bearing.FOS,
    q_max, q_min, wedgeDetails,
  }
}

/**
 * FOS checks for Gravity and L-Cantilever walls.
 * All forces in kN/m (per metre run of wall).
 * Returns both SLS (unfactored) and ULS (Pa × GAMMA_E) checks.
 */

import { trialWedge } from './trialWedge.js'
import { vesicBearing } from './bearingCapacity.js'
import { GAMMA_E } from './constants.js'

const DEG = Math.PI / 180
const GAMMA_W = 9.81

/** Centroid of trapezoid from TOE.
 *  Bottom width B, top width bt (< B), height H.
 */
function trapezoidCentroid(B, bt, H) {
  const A_rect = bt * H
  const A_tri  = 0.5 * (B - bt) * H
  const x_rect = B - bt / 2
  const x_tri  = (B - bt) / 3
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

  const { Pa, thetaCrit, rows: wedgeDetails } = trialWedge({
    H, gamma, cohesion, phi, delta, omega: batter, hw, surcharge,
  })

  const Pa_h = Pa * Math.cos(delta_r + omega_r)
  const Pa_v = Pa * Math.sin(delta_r + omega_r)

  const A_wall = 0.5 * (bt + B) * H
  const W_wall = gamma_wall * A_wall

  const hw_eff = Math.min(hw, H)
  const U_base = 0.5 * GAMMA_W * hw_eff * hw_eff
  const N = W_wall + Pa_v - U_base

  // SLS Sliding
  const F_resist_slide = N * Math.tan(phif * DEG) + cf * B
  const F_drive_slide  = Pa_h + GAMMA_W * hw_eff * hw_eff * Math.cos(omega_r) / 2
  const FOS_sliding = F_drive_slide > 0 ? F_resist_slide / F_drive_slide : Infinity

  // SLS Overturning
  const x_c     = trapezoidCentroid(B, bt, H)
  const Mr_wall = W_wall * x_c
  const Mr_Pa_v = Pa_v * B
  const Mo_Pa   = Pa_h * H / 3
  const Mo_U    = U_base * B / 3
  const ΣMr = Mr_wall + Mr_Pa_v
  const ΣMo = Mo_Pa + Mo_U
  const FOS_overturning = ΣMo > 0 ? ΣMr / ΣMo : Infinity

  // SLS Bearing
  const e     = B / 2 - (ΣMr - ΣMo) / N
  const B_eff = Math.max(0.01, B - 2 * Math.abs(e))
  const bearing = vesicBearing({ cf, phif, gamma_f, B: B_eff, Df, Q: N, inclineDeg: 0 })

  // ── ULS: factor active earth pressure by GAMMA_E ──
  const Pa_h_uls = Pa_h * GAMMA_E
  const Pa_v_uls = Pa_v * GAMMA_E
  const N_uls = W_wall + Pa_v_uls - U_base

  const F_drive_slide_uls  = Pa_h_uls + GAMMA_W * hw_eff * hw_eff * Math.cos(omega_r) / 2
  const F_resist_slide_uls = N_uls * Math.tan(phif * DEG) + cf * B
  const FOS_sliding_uls = F_drive_slide_uls > 0 ? F_resist_slide_uls / F_drive_slide_uls : Infinity

  const ΣMr_uls = Mr_wall + Pa_v_uls * B
  const ΣMo_uls = Pa_h_uls * H / 3 + Mo_U
  const FOS_overturning_uls = ΣMo_uls > 0 ? ΣMr_uls / ΣMo_uls : Infinity

  const e_uls     = B / 2 - (ΣMr_uls - ΣMo_uls) / N_uls
  const B_eff_uls = Math.max(0.01, B - 2 * Math.abs(e_uls))
  const bearing_uls = vesicBearing({ cf, phif, gamma_f, B: B_eff_uls, Df, Q: N_uls, inclineDeg: 0 })

  return {
    Pa, thetaCrit, Pa_h, Pa_v,
    W_wall, W_fill: 0, W_total: W_wall + Pa_v, N, U_base,
    F_resist_slide, F_drive_slide, FOS_sliding,
    ΣMr, ΣMo, FOS_overturning,
    e, B_eff, bearing, FOS_bearing: bearing.FOS,
    // ULS
    Pa_h_uls, Pa_v_uls, N_uls,
    F_drive_slide_uls, F_resist_slide_uls, FOS_sliding_uls,
    ΣMr_uls, ΣMo_uls, FOS_overturning_uls,
    e_uls, B_eff_uls, bearing_uls, FOS_bearing_uls: bearing_uls.FOS,
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

  const { Pa, thetaCrit, rows: wedgeDetails } = trialWedge({
    H, gamma, cohesion, phi, delta, omega: batter, hw, surcharge,
  })
  const Pa_h = Pa * Math.cos(delta_r + omega_r)
  const Pa_v = Pa * Math.sin(delta_r + omega_r)

  const W_stem  = gamma_wall * ts * H
  const W_base  = gamma_wall * B  * tb
  const W_fill  = gamma * Lh * H
  const W_total = W_stem + W_base + W_fill + Pa_v

  const hw_eff = Math.min(hw, H)
  const U_base = 0.5 * GAMMA_W * hw_eff * hw_eff
  const N = W_total - U_base

  const x_stem = Lt + ts / 2
  const x_base = B / 2
  const x_fill = Lt + ts + Lh / 2

  // SLS Sliding
  const F_resist_slide = N * Math.tan(phif * DEG) + cf * B
  const F_drive_slide  = Pa_h
  const FOS_sliding = F_drive_slide > 0 ? F_resist_slide / F_drive_slide : Infinity

  // SLS Overturning
  const ΣMr = W_stem * x_stem + W_base * x_base + W_fill * x_fill + Pa_v * B
  const ΣMo = Pa_h * H / 3 + U_base * B / 3
  const FOS_overturning = ΣMo > 0 ? ΣMr / ΣMo : Infinity

  // SLS Bearing
  const e     = B / 2 - (ΣMr - ΣMo) / N
  const B_eff = Math.max(0.01, B - 2 * Math.abs(e))
  const bearing = vesicBearing({ cf, phif, gamma_f, B: B_eff, Df, Q: N, inclineDeg: 0 })

  const q_max = N / B + 6 * N * Math.abs(e) / (B * B)
  const q_min = N / B - 6 * N * Math.abs(e) / (B * B)

  // ── ULS: factor active earth pressure by GAMMA_E ──
  const Pa_h_uls = Pa_h * GAMMA_E
  const Pa_v_uls = Pa_v * GAMMA_E
  const N_uls = W_stem + W_base + W_fill + Pa_v_uls - U_base

  const F_drive_slide_uls  = Pa_h_uls
  const F_resist_slide_uls = N_uls * Math.tan(phif * DEG) + cf * B
  const FOS_sliding_uls = F_drive_slide_uls > 0 ? F_resist_slide_uls / F_drive_slide_uls : Infinity

  const ΣMr_uls = W_stem * x_stem + W_base * x_base + W_fill * x_fill + Pa_v_uls * B
  const ΣMo_uls = Pa_h_uls * H / 3 + U_base * B / 3
  const FOS_overturning_uls = ΣMo_uls > 0 ? ΣMr_uls / ΣMo_uls : Infinity

  const e_uls     = B / 2 - (ΣMr_uls - ΣMo_uls) / N_uls
  const B_eff_uls = Math.max(0.01, B - 2 * Math.abs(e_uls))
  const bearing_uls = vesicBearing({ cf, phif, gamma_f, B: B_eff_uls, Df, Q: N_uls, inclineDeg: 0 })

  return {
    Pa, thetaCrit, Pa_h, Pa_v,
    W_stem, W_base, W_fill, W_total, N, U_base,
    F_resist_slide, F_drive_slide, FOS_sliding,
    ΣMr, ΣMo, FOS_overturning,
    e, B_eff, bearing, FOS_bearing: bearing.FOS,
    q_max, q_min,
    // ULS
    Pa_h_uls, Pa_v_uls, N_uls,
    F_drive_slide_uls, F_resist_slide_uls, FOS_sliding_uls,
    ΣMr_uls, ΣMo_uls, FOS_overturning_uls,
    e_uls, B_eff_uls, bearing_uls, FOS_bearing_uls: bearing_uls.FOS,
    wedgeDetails,
  }
}

/**
 * R376 Wall Design — SLS and ULS stability checks.
 *
 * Sign convention verified against R376 Upgraded Wall SLS:
 *   Mo = Pah*(H/3) + Pw*(hw/3) + Pup*(2B/3) - Pav*B
 *   Mr = Σ(Wi * arm_i)
 *   FOS_ot = Mr / Mo
 *   FOS_sl = (N * tan(δb') + Fsh) / (Pah + Pw)
 *   N = Σ Wi + Pav - Pup
 *
 * Verification: Mo=21.124 Mr=42.810 FOS_ot=2.027 FOS_sl=1.508 ✓
 */

import { GAMMA_W, DEG } from './constants.js'
import { vesicBearing } from './bearingCapacity.js'

/**
 * @param {object} p - all wall design parameters
 * @returns {object} - full results object
 */
export function wallDesignCheck(p) {
  const {
    // Wall geometry
    H = 3.0,
    B = 0.5,           // BASE width used for bearing + Pup

    // Weight blocks (array of { W, arm } — pre-computed by caller)
    weightBlocks = [],  // [{ label, W, arm }]

    // Active earth pressure (from trial wedge or manual)
    Pa = 24.29,
    delta = 20,        // wall friction angle °

    // Foundation
    phif = 30,         // base friction angle °
    deltaB = 27,       // base friction δb' ° (often 0.9×phif)
    cf = 0,            // base cohesion kPa
    gamma_f = 19,
    Df = 0,            // embedment depth m
    B_bearing = 0.5,   // effective base width for bearing (may differ from B)

    // Groundwater
    hw = 0,

    // Soil nails (per unit width of wall, horizontal/vertical components)
    nailRows = [],     // [{ label, Sh, Sv, armH, armV }]

    // Allowable bearing capacity (from Tab 4, or manual)
    q_allow = 167.849,

    // Limit state label
    limitState = 'SLS',
  } = p

  const delta_r  = delta  * DEG
  const deltaB_r = deltaB * DEG

  const Pa_h = Pa * Math.cos(delta_r)
  const Pa_v = Pa * Math.sin(delta_r)

  const hw_e  = Math.min(hw, H)
  const Pw    = hw_e > 0 ? 0.5 * GAMMA_W * hw_e * hw_e : 0
  const Pup   = hw_e > 0 ? 0.5 * GAMMA_W * hw_e * B  : 0

  // Sum weights and their stabilising moments about toe
  let W_total = 0, Mr = 0
  for (const blk of weightBlocks) {
    W_total += blk.W
    Mr      += blk.W * blk.arm
  }

  // Nail contributions
  let Fsh = 0, Fsv = 0, M_nail_stab = 0
  for (const n of nailRows) {
    Fsh         += n.Sh            // horizontal (→ resists sliding)
    Fsv         += n.Sv            // vertical (↓ adds to N)
    M_nail_stab += n.Sh * n.armH  // horizontal nail moment about toe (stabilising)
  }

  // Vertical equilibrium
  const N = W_total + Pa_v + Fsv - Pup

  // Overturning moments (about toe)
  // Mo: destabilising - Pav stabilising contribution of Pa
  const arm_Pah = H / 3
  const arm_Pw  = hw_e / 3
  const arm_Pup = 2 * B / 3

  const Mo = Pa_h * arm_Pah + Pw * arm_Pw + Pup * arm_Pup - Pa_v * B
  // Add any destabilising nail moments (if nails on active side — usually 0)

  // Resisting moments include wall weights + stabilising horizontal nails
  const Mr_total = Mr + M_nail_stab

  const FOS_overturning = Mo > 0 ? Mr_total / Mo : Infinity

  // Sliding
  const Fh = Pa_h + Pw
  const FOS_sliding = Fh > 0 ? (N * Math.tan(deltaB_r) + cf * B + Fsh) / Fh : Infinity

  // Eccentricity and base pressure
  const e     = B / 2 - (Mr_total - Mo) / N
  const B_eff = Math.max(0.01, B - 2 * Math.abs(e))
  const q_base = N / B   // uniform approx (e is usually small)
  const q_max  = e <= B / 6 ? N / B * (1 + 6 * e / B) : 2 * N / (3 * (B / 2 - e))
  const q_min  = e <= B / 6 ? N / B * (1 - 6 * e / B) : 0

  const FOS_bearing = q_base > 0 ? q_allow / q_base : Infinity

  return {
    Pa, Pa_h, Pa_v,
    Pw, Pup,
    W_total, N, Fh, Fsh, Fsv,
    Mr: Mr_total, Mo,
    arm_Pah, arm_Pw, arm_Pup,
    FOS_overturning, FOS_sliding, FOS_bearing,
    e, B_eff, q_base, q_max, q_min, q_allow,
    weightBlocks, nailRows,
    limitState,
  }
}

/**
 * Build weight blocks from standard gravity-wall geometry.
 * Returns array of { label, W, arm } measured from TOE.
 */
export function buildWeightBlocks({
  H, B,
  gamma_wall = 22,
  // optional 2nd block (fill block to heel side)
  B2 = 0, H2 = 0, gamma2 = 24,
  // toe offset (if wall is not sitting at toe x=0)
  toe = 0,
}) {
  const blocks = []
  // Main wall body: width B, height H, arm = B/2 from toe
  if (B > 0 && H > 0) {
    blocks.push({ label: 'W1 (wall body)', W: gamma_wall * B * H, arm: toe + B / 2 })
  }
  // Secondary block (e.g. concrete backing or fill wedge)
  if (B2 > 0 && H2 > 0) {
    blocks.push({ label: 'W2 (fill/backing)', W: gamma2 * B2 * H2, arm: toe + B + B2 / 2 })
  }
  return blocks
}

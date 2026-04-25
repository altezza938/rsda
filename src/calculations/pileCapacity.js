/**
 * Pile Capacity Calculations
 *
 * Implements:
 *  - singlePileSand  : driven pile in cohesionless soil (Meyerhof method)
 *  - singlePileClay  : driven/bored pile in cohesive soil (alpha method, Tomlinson)
 *  - pileGroup       : group efficiency (Converse-Labarre) + block failure check
 *
 * All lengths in metres (m), stresses in kPa, forces in kN.
 *
 * Verification – rankine-based Nq for phi=30°:
 *   Nq = exp(π·tan(30°)) × tan²(60°) = exp(1.8138) × 3 = 6.112 × 3 = 18.34
 *   Matches Das Table 11.1 (Nq ≈ 18.40) ✓
 *
 * Verification – singlePileClay alpha lookup:
 *   su=50 kPa → alpha ≈ 0.55 + (70-50)/(70-25)*(1.0-0.55) = 0.55 + 0.20 = 0.75  ✓
 *
 * Verification – Converse-Labarre (3×3 group, D=0.3m, s=0.9m):
 *   theta = arctan(0.3/0.9) = 18.43°
 *   E = 1 - 18.43/90 * ((3-1)*3 + (3-1)*3) / (3*3) = 1 - 0.2048*12/9 = 0.727  ✓
 */

const DEG = Math.PI / 180

// ---------------------------------------------------------------------------
// 1. Single Pile in Sand – Meyerhof Method
// ---------------------------------------------------------------------------

/**
 * Ultimate pile capacity in cohesionless soil using Meyerhof (1976).
 *
 * Skin friction:
 *   fs = K · σ'v_avg_cap · tan(δ)   [kPa]
 *   Qs = fs · π·D·L                  [kN]
 *
 * Tip resistance:
 *   qp = min(σ'v_tip_cap · Nq,  50·Nq) [kPa]   (Meyerhof upper limit)
 *   Qp = qp · Ap                         [kN]
 *
 * Meyerhof effective stress cap: both σ'v terms limited to 150 kPa.
 *
 * @param {object} p
 * @param {number} p.D      – pile diameter (m)
 * @param {number} p.L      – pile length (m)
 * @param {number} p.phi    – soil friction angle (°)
 * @param {number} p.gamma  – effective unit weight of soil (kN/m³)
 * @param {number} p.delta  – pile-soil interface friction angle (°); default 0.75·phi
 * @param {number} p.K      – lateral earth pressure coefficient; default 1.0
 * @param {number} p.FOS    – factor of safety (default 2.5)
 * @returns {{ Qs, Qp, Qt, Qa, fs, qp, Nq, As, Ap }}
 */
export function singlePileSand({
  D,
  L,
  phi,
  gamma,
  delta,
  K   = 1.0,
  FOS = 2.5,
}) {
  const phi_r   = phi * DEG
  const delta_r = (delta !== undefined ? delta : 0.75 * phi) * DEG

  // Meyerhof bearing capacity factor for piles
  // Nq = exp(π·tan(φ)) · tan²(45 + φ/2)²
  const Nq = Math.exp(Math.PI * Math.tan(phi_r))
           * Math.pow(Math.tan(Math.PI / 4 + phi_r / 2), 2)

  // Effective vertical stresses (capped at 150 kPa per Meyerhof)
  const sigma_v_avg_raw = gamma * L / 2
  const sigma_v_tip_raw = gamma * L
  const sigma_v_avg_cap = Math.min(sigma_v_avg_raw, 150)
  const sigma_v_tip_cap = Math.min(sigma_v_tip_raw, 150)

  // Unit skin friction
  const fs = K * sigma_v_avg_cap * Math.tan(delta_r)   // kPa

  // Areas
  const As = Math.PI * D * L               // shaft area (m²)
  const Ap = Math.PI * D * D / 4           // tip area (m²)

  // Shaft (friction) capacity
  const Qs = fs * As

  // Unit tip resistance (Meyerhof upper limit: 50·Nq kPa)
  const qp = Math.min(sigma_v_tip_cap * Nq, 50 * Nq)
  const Qp = qp * Ap

  const Qt = Qs + Qp
  const Qa = Qt / FOS

  return {
    Qs, Qp, Qt, Qa,
    fs, qp, Nq,
    As, Ap,
    sigma_v_avg_cap, sigma_v_tip_cap,
  }
}

// ---------------------------------------------------------------------------
// 2. Single Pile in Clay – Alpha Method (Tomlinson)
// ---------------------------------------------------------------------------

/**
 * Ultimate pile capacity in cohesive soil using the alpha (adhesion) method.
 *
 * Skin friction:
 *   Qs = α · su · π·D·L
 *
 * Tip resistance (deep pile, Nc=9):
 *   Qp = 9 · su_tip · Ap
 *
 * Alpha auto-selection (Tomlinson / API):
 *   su ≤ 25 kPa  → α = 1.00
 *   25 < su ≤ 70 → α = 1.00 − (su−25)/(70−25) × (1.00−0.55)  [linear interpolation]
 *   su > 70 kPa  → α = 0.55
 *
 * @param {object} p
 * @param {number} p.D       – pile diameter (m)
 * @param {number} p.L       – pile length (m)
 * @param {number} p.su      – average undrained shear strength along shaft (kPa)
 * @param {number} p.su_tip  – undrained shear strength at pile tip (kPa); default = su
 * @param {number} p.alpha   – adhesion factor (overrides auto if provided)
 * @param {number} p.FOS     – factor of safety (default 2.5)
 * @returns {{ Qs, Qp, Qt, Qa, alpha, As, Ap }}
 */
export function singlePileClay({
  D,
  L,
  su,
  su_tip,
  alpha,
  FOS = 2.5,
}) {
  const su_tip_use = su_tip !== undefined ? su_tip : su

  // Auto-select alpha (Tomlinson)
  let alpha_use
  if (alpha !== undefined) {
    alpha_use = alpha
  } else if (su <= 25) {
    alpha_use = 1.00
  } else if (su <= 70) {
    alpha_use = 1.00 - ((su - 25) / (70 - 25)) * (1.00 - 0.55)
  } else {
    alpha_use = 0.55
  }

  // Areas
  const As = Math.PI * D * L         // shaft (m²)
  const Ap = Math.PI * D * D / 4     // tip (m²)

  // Capacity components
  const Qs = alpha_use * su * As
  const Qp = 9 * su_tip_use * Ap    // Nc = 9 for deep pile (Skempton)

  const Qt = Qs + Qp
  const Qa = Qt / FOS

  return {
    Qs, Qp, Qt, Qa,
    alpha: alpha_use,
    As, Ap,
  }
}

// ---------------------------------------------------------------------------
// 3. Pile Group Efficiency (Converse-Labarre)
// ---------------------------------------------------------------------------

/**
 * Pile group capacity using the Converse-Labarre efficiency formula.
 *
 * Group layout: nR rows × nC columns; centre-to-centre spacing s (m).
 *
 * Efficiency:
 *   θ    = arctan(D/s)  [degrees]
 *   E    = 1 − θ/90 × [(nR−1)·nC + (nC−1)·nR] / (nR·nC)
 *   η    = clamp(E, 0, 1)
 *   Q_group_pile = η · nR·nC · Q_single
 *
 * Block failure geometry (for clay, used externally if needed):
 *   Lg = (nR−1)·s + D   [group length]
 *   Bg = (nC−1)·s + D   [group width]
 *
 * Note: block failure capacity (Q_block) is computed only when su is provided,
 * since it requires undrained shear strength.  For sand, only the pile-group
 * formula applies.
 *
 * @param {object} p
 * @param {number} p.D          – pile diameter (m)
 * @param {number} p.s          – centre-to-centre pile spacing (m)
 * @param {number} p.nR         – number of rows
 * @param {number} p.nC         – number of columns
 * @param {number} p.Q_single   – single pile ultimate capacity (kN)
 * @param {number} [p.su]       – undrained shear strength (kPa); for block failure
 * @param {number} [p.L]        – pile length (m); for block failure
 * @returns {{ eta, n, Q_group_pile, Lg, Bg, Q_block? }}
 */
export function pileGroup({ D, s, nR, nC, Q_single, su, L }) {
  const n = nR * nC

  // Converse-Labarre efficiency
  const theta_deg = Math.atan(D / s) / DEG      // degrees
  const E = 1 - (theta_deg / 90)
          * ((nR - 1) * nC + (nC - 1) * nR)
          / (nR * nC)
  const eta = Math.max(0, Math.min(1, E))

  // Group dimensions
  const Lg = (nR - 1) * s + D
  const Bg = (nC - 1) * s + D

  // Group capacity via pile efficiency
  const Q_group_pile = eta * n * Q_single

  const result = { eta, n, Q_group_pile, Lg, Bg }

  // Block failure (clay only – Terzaghi & Peck)
  // Q_block = perimeter·su·L + 9·su·Lg·Bg
  if (su !== undefined && L !== undefined) {
    const perimeter = 2 * (Lg + Bg)
    const Q_block   = perimeter * su * L + 9 * su * Lg * Bg
    result.Q_block = Q_block
    // Critical group capacity = minimum of the two approaches
    result.Q_group = Math.min(Q_group_pile, Q_block)
  }

  return result
}

/**
 * Settlement Calculations
 *
 * Implements:
 *  - elasticSettlement      : immediate (elastic) settlement under flexible load
 *  - consolidationLayer     : primary consolidation (Terzaghi, Cc/Cs method)
 *  - uForTimeFactor         : degree of consolidation U(T) – Terzaghi 1D
 *  - timeSettlementCurve    : time–settlement pairs including t50, t90
 *  - boussinesqCenter       : vertical stress increment at centre below rectangular load
 *  - secondarySettlement    : creep / secondary compression
 *
 * All lengths in metres (m), stresses/pressures in kPa.
 *
 * Verification – elasticSettlement:
 *   q=100 kPa, B=2m, Es=15000 kPa, nu=0.3, Iw=0.82
 *   Se = 100*2*(1-0.09)/15000*0.82 = 0.01002 m ≈ 10.0 mm  ✓
 *
 * Verification – uForTimeFactor:
 *   T=0.197 → U≈0.500 (50% consolidation at T50=0.197)  ✓
 *   T=0.848 → U≈0.900 (90% consolidation at T90=0.848)  ✓
 *
 * Verification – consolidationLayer (NC):
 *   Cc=0.35, e0=1.10, H=4m, sigma_v0=50, delta_sigma=80, sigma_pc=50
 *   sigma_v1=130; Sc = 0.35/2.10 * 4 * log10(130/50) = 0.667*0.414 = 0.276 m  ✓
 */

// ---------------------------------------------------------------------------
// 1. Elastic (Immediate) Settlement
// ---------------------------------------------------------------------------

/**
 * Immediate settlement under a flexible uniformly loaded area (Janbu / Timoshenko).
 *
 * Se = q · B · (1 − ν²) / Es · Iw
 *
 * Influence factor Iw:
 *   Flexible square:  Iw ≈ 0.82 (after Steinbrenner / Harr)
 *   Flexible strip :  Iw ≈ 1.00
 *   Rigid footing  :  Iw ≈ 0.82 × 0.80 ≈ 0.66 (multiply by ~0.8)
 *
 * @param {object} p
 * @param {number} p.q   – net applied stress (kPa)
 * @param {number} p.B   – footing width (m)
 * @param {number} p.L   – footing length (m); not used directly but provided for context
 * @param {number} p.Es  – Young's modulus of soil (kPa)
 * @param {number} p.nu  – Poisson's ratio (dimensionless)
 * @param {number} p.Iw  – influence factor (default 0.82 for flexible square)
 * @returns {{ Se, SeInMM }}
 */
export function elasticSettlement({ q, B, L = B, Es, nu, Iw = 0.82 }) {
  // Se = q * B * (1 - nu²) / Es * Iw
  const Se = q * B * (1 - nu * nu) / Es * Iw
  return {
    Se,              // metres
    SeInMM: Se * 1000,
  }
}

// ---------------------------------------------------------------------------
// 2. Primary Consolidation Settlement (Terzaghi)
// ---------------------------------------------------------------------------

/**
 * Consolidation settlement for a single clay layer using the Cc / Cs method.
 *
 * NC  (sigma_v0 ≥ sigma_pc):
 *   Sc = Cc/(1+e0) · H · log10(sigma_v1/sigma_v0)
 *
 * OC stays OC  (sigma_v1 ≤ sigma_pc):
 *   Sc = Cs/(1+e0) · H · log10(sigma_v1/sigma_v0)
 *
 * OC crosses NC  (sigma_v0 < sigma_pc < sigma_v1):
 *   Sc = Cs/(1+e0)·H·log10(sigma_pc/sigma_v0)
 *      + Cc/(1+e0)·H·log10(sigma_v1/sigma_pc)
 *
 * @param {object} p
 * @param {number} p.Cc          – compression index
 * @param {number} p.Cs          – swelling/recompression index (default Cc/5)
 * @param {number} p.e0          – initial void ratio
 * @param {number} p.H           – layer thickness (m)
 * @param {number} p.sigma_v0    – initial effective vertical stress (kPa)
 * @param {number} p.delta_sigma – stress increment at layer mid-point (kPa)
 * @param {number} p.sigma_pc    – preconsolidation pressure (kPa); default = sigma_v0 (NC)
 * @returns {{ Sc, ScInMM, type }}
 */
export function consolidationLayer({
  Cc, Cs, e0, H, sigma_v0, delta_sigma, sigma_pc = sigma_v0,
}) {
  const Cs_use  = Cs !== undefined ? Cs : Cc / 5
  const sigma_v1 = sigma_v0 + delta_sigma
  const denom   = 1 + e0

  let Sc, type

  if (sigma_v0 >= sigma_pc) {
    // Normally consolidated
    type = 'NC'
    Sc   = (Cc / denom) * H * Math.log10(sigma_v1 / sigma_v0)
  } else if (sigma_v1 <= sigma_pc) {
    // Overconsolidated – stays on recompression curve
    type = 'OC'
    Sc   = (Cs_use / denom) * H * Math.log10(sigma_v1 / sigma_v0)
  } else {
    // OC crossing into NC
    type = 'OC→NC'
    Sc   = (Cs_use / denom) * H * Math.log10(sigma_pc  / sigma_v0)
         + (Cc     / denom) * H * Math.log10(sigma_v1  / sigma_pc)
  }

  return {
    Sc,
    ScInMM: Sc * 1000,
    type,
  }
}

// ---------------------------------------------------------------------------
// 3. Terzaghi Degree of Consolidation U(T)
// ---------------------------------------------------------------------------

/**
 * Terzaghi's average degree of consolidation as a function of time factor T.
 *
 * Uses two-regime approximation (Das, Coduto):
 *   T ≤ 0.217 (i.e. π/4 × 0.527²):  U = 2·√(T/π)       [parabolic – early time]
 *   T > 0.217:                        U = 1 − 10^(−(T+0.085)/0.933)
 *
 * The crossover at T ≈ 0.217 (U ≈ 52.6%) gives a continuous, well-tested curve.
 *
 * @param {number} T – dimensionless time factor (= cv·t / Hd²)
 * @returns {number} U in [0, 1]
 */
export function uForTimeFactor(T) {
  if (T <= 0) return 0
  // Crossover threshold (parabolic valid for U < ~52%)
  const T_cross = Math.PI / 4 * 0.6 * 0.6   // ≈ 0.2827
  if (T <= T_cross) {
    return 2 * Math.sqrt(T / Math.PI)
  }
  // Logarithmic regime
  return 1 - Math.pow(10, -(T + 0.085) / 0.933)
}

// ---------------------------------------------------------------------------
// 4. Time–Settlement Curve
// ---------------------------------------------------------------------------

/**
 * Generate a time–settlement curve for a consolidating layer.
 *
 * @param {object} p
 * @param {number} p.Sc       – total primary consolidation settlement (m)
 * @param {number} p.cv       – coefficient of consolidation (m²/year)
 * @param {number} p.H_drain  – total drainage path height (m)
 * @param {string} p.drainage – 'double' (Hd=H/2) or 'single' (Hd=H)
 * @param {number} p.nPoints  – number of time points (default 50)
 * @returns {{ points: [{t, T, U, s_mm}], t50, t90 }}
 */
export function timeSettlementCurve({
  Sc, cv, H_drain, drainage = 'double', nPoints = 50,
}) {
  const Hd = drainage === 'double' ? H_drain / 2 : H_drain   // drainage path

  // Characteristic times
  const t50 = Hd * Hd * 0.197 / cv
  const t90 = Hd * Hd * 0.848 / cv

  // Maximum time (t95 estimate: T95 ≈ 1.13)
  const t_max = 1.13 * Hd * Hd / cv

  const points = []
  for (let i = 0; i <= nPoints; i++) {
    const t = (i / nPoints) * t_max    // linear time spacing
    const T = cv * t / (Hd * Hd)
    const U = uForTimeFactor(T)
    points.push({
      t,               // years
      T,               // time factor
      U,               // degree of consolidation [0–1]
      s_mm: U * Sc * 1000,   // settlement (mm)
    })
  }

  return { points, t50, t90 }
}

// ---------------------------------------------------------------------------
// 5. Boussinesq Stress at Centre Below Rectangular Load (Newmark, 1935)
// ---------------------------------------------------------------------------

/**
 * Vertical stress increment at depth z below the centre of a uniformly loaded
 * rectangular area B × L, using the Newmark (1935) corner formula applied
 * as 4 × corner contribution.
 *
 * For a single corner (m = L/z, n = B/z):
 *   A = (2mn·√(m²+n²+1)) / (m²+n²+1+m²n²) × (m²+n²+2)/(m²+n²+1)
 *   B_term = arctan(2mn·√(m²+n²+1) / (m²+n²+1-m²n²))
 *   Iσ_corner = 1/(4π) × (A + B_term)
 *
 * σ_z at centre = q × 4 × Iσ_corner  (4 corners of B/2 × L/2 sub-rectangle)
 *
 * Note: "centre" of the load uses m = (L/2)/z, n = (B/2)/z.
 *
 * @param {object} p
 * @param {number} p.q – applied stress (kPa)
 * @param {number} p.B – footing width (m)
 * @param {number} p.L – footing length (m)
 * @param {number} p.z – depth below footing (m)
 * @returns {{ sigma_z, Iz }}  Iz = σ_z / q
 */
export function boussinesqCenter({ q, B, L, z }) {
  if (z <= 0) return { sigma_z: q, Iz: 1 }

  // For centre calculation use half-dimensions
  const m = L / (2 * z)
  const n = B / (2 * z)

  const Iz_corner = newmarkCornerInfluence(m, n)
  // 4 corners of the half-rectangle cover the full rectangle
  const Iz = 4 * Iz_corner
  const sigma_z = q * Iz

  return { sigma_z, Iz }
}

/**
 * Newmark (1935) influence factor for a single corner of a rectangular load.
 * @param {number} m – L/z (or half-length / z for centre calc)
 * @param {number} n – B/z (or half-width  / z for centre calc)
 * @returns {number} Iσ for one corner
 */
function newmarkCornerInfluence(m, n) {
  const m2 = m * m
  const n2 = n * n
  const A  = m2 + n2 + 1
  const mn = m * n

  // Numerator term for the first part
  const rootA = Math.sqrt(A)
  const term1_num = 2 * mn * rootA * (m2 + n2 + 2)
  const term1_den = (A + m2 * n2) * A
  const term1 = term1_num / term1_den

  // arctan argument
  const atan_arg_num = 2 * mn * rootA
  const atan_arg_den = A - m2 * n2

  let atan_val
  if (atan_arg_den > 0) {
    atan_val = Math.atan(atan_arg_num / atan_arg_den)
  } else if (atan_arg_den < 0) {
    // arctan in second/third quadrant – add π to get principal value
    atan_val = Math.atan(atan_arg_num / atan_arg_den) + Math.PI
  } else {
    atan_val = Math.PI / 2
  }

  return (1 / (4 * Math.PI)) * (term1 + atan_val)
}

// ---------------------------------------------------------------------------
// 6. Secondary (Creep) Settlement
// ---------------------------------------------------------------------------

/**
 * Secondary compression settlement.
 *
 * Ss = Cα/(1+e0) · H · log10(t2/t1)
 *
 * where t1 is typically the time at end of primary consolidation (years)
 * and t2 is the time of interest (years).
 *
 * @param {object} p
 * @param {number} p.Calpha – secondary compression index Cα
 * @param {number} p.e0     – void ratio at start of secondary compression
 * @param {number} p.H      – layer thickness (m)
 * @param {number} p.t1     – start time (years, > 0)
 * @param {number} p.t2     – end time (years, > t1)
 * @returns {{ Ss, SsInMM }}
 */
export function secondarySettlement({ Calpha, e0, H, t1, t2 }) {
  const Ss = (Calpha / (1 + e0)) * H * Math.log10(t2 / t1)
  return {
    Ss,
    SsInMM: Ss * 1000,
  }
}

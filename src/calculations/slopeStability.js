/**
 * Slope Stability Calculations
 *
 * Implements:
 *  - infiniteSlope      : infinite slope analysis (drained/submerged)
 *  - generateSlices     : divide a circular slip surface into vertical slices
 *  - bishopCircle       : Bishop's simplified method (iterative)
 *  - criticalCircle     : grid search for minimum FS
 *
 * All angles in degrees unless noted.  Lengths/stresses in metres / kPa.
 *
 * Verification – infinite slope, dry (hw=0):
 *   c=5 kPa, phi=30°, gamma=18 kN/m³, z=3 m, beta=20°
 *   sigma_n = 18*3*cos²(20°) = 47.71 kPa
 *   tau_d   = 18*3*sin(20°)*cos(20°) = 17.37 kPa
 *   tau_f   = 5 + 47.71*tan(30°) = 5 + 27.54 = 32.54 kPa
 *   FS      ≈ 1.874  ✓
 */

const DEG    = Math.PI / 180
const gammaW = 9.81        // kN/m³

// ---------------------------------------------------------------------------
// 1. Infinite Slope
// ---------------------------------------------------------------------------

/**
 * Infinite slope stability (Lambe & Whitman, Das).
 *
 * @param {object} p
 * @param {number} p.c         – cohesion (kPa)
 * @param {number} p.phi       – friction angle (°)
 * @param {number} p.gamma     – bulk unit weight (kN/m³)
 * @param {number} p.gammaSat  – saturated unit weight (kN/m³); used when hw > 0
 * @param {number} p.z         – depth to failure plane (m)
 * @param {number} p.beta      – slope angle from horizontal (°)
 * @param {number} p.hw        – height of water table above failure plane (m); 0 = dry
 * @returns {{ FS, tau_d, tau_f, sigma_n, sigma_n_eff, u, Hc }}
 */
export function infiniteSlope({ c, phi, gamma, gammaSat = gamma, z, beta, hw = 0 }) {
  const phi_r  = phi  * DEG
  const beta_r = beta * DEG

  // Pore-water pressure on failure plane (horizontal water table assumed)
  const u = gammaW * hw * Math.cos(beta_r) * Math.cos(beta_r)

  // Use saturated weight for the slice if any water table exists
  const gamma_eff = hw > 0 ? gammaSat : gamma

  // Total normal stress on failure plane
  const sigma_n     = gamma_eff * z * Math.cos(beta_r) * Math.cos(beta_r)
  const sigma_n_eff = sigma_n - u

  // Driving shear stress
  const tau_d = gamma_eff * z * Math.sin(beta_r) * Math.cos(beta_r)

  // Available shear strength (Mohr-Coulomb)
  const tau_f = c + sigma_n_eff * Math.tan(phi_r)

  // Factor of safety
  const FS = tau_d > 0 ? tau_f / tau_d : Infinity

  // Critical height for c > 0 (Taylor, 1937 – infinite slope form)
  // Hc = 4c·sin(β)·cos(φ') / [γ·(1 − cos(β − φ'))]
  let Hc = Infinity
  if (c > 0 && gamma > 0) {
    const denom = gamma * (1 - Math.cos(beta_r - phi_r))
    Hc = denom > 0
      ? (4 * c * Math.sin(beta_r) * Math.cos(phi_r)) / denom
      : Infinity
  }

  return { FS, tau_d, tau_f, sigma_n, sigma_n_eff, u, Hc }
}

// ---------------------------------------------------------------------------
// 2. Generate Slices for Bishop / Fellenius
// ---------------------------------------------------------------------------

/**
 * Divide a circular arc slip surface into vertical slices.
 *
 * Slope geometry: toe at (0,0), crest at (xCrest, H) where xCrest = H/tan(beta_r).
 * The slip circle is defined by centre (xc, yc) and radius R.
 *
 * @param {object} p
 * @param {number} p.xc       – circle centre x (m)
 * @param {number} p.yc       – circle centre y (m)  [positive = above datum at toe]
 * @param {number} p.R        – radius (m)
 * @param {number} p.H        – slope height (m)
 * @param {number} p.beta_deg – slope angle (°)
 * @param {number} p.nSlices  – number of slices (default 10)
 * @param {number} p.hw       – water table height above slip surface (m); 0 = dry
 * @param {number} p.gamma    – bulk unit weight (kN/m³)
 * @param {number} p.gammaSat – saturated unit weight (kN/m³)
 * @returns {Array<{xm, ySurf, yBase, hi, bi, alphai, Wi, ui}>}
 */
export function generateSlices({
  xc, yc, R, H, beta_deg, nSlices = 10, hw = 0, gamma = 18, gammaSat = 20,
}) {
  const beta_r  = beta_deg * DEG
  const xCrest  = H / Math.tan(beta_r)   // x-coordinate of slope crest

  // Left and right x-extents of circle on the slope/ground surface
  // Circle: (x-xc)² + (y-yc)² = R²
  // We want where the circle exits through the slope surface (rough bounds)
  const xLeft  = Math.max(0,       xc - R)
  const xRight = Math.min(xCrest,  xc + R)

  if (xRight <= xLeft) return []   // circle doesn't intersect slope

  const bTotal = xRight - xLeft
  const b      = bTotal / nSlices  // uniform slice width

  const slices = []

  for (let i = 0; i < nSlices; i++) {
    const xL = xLeft + i * b
    const xR = xL + b
    const xm = 0.5 * (xL + xR)   // mid-point x

    // Elevation of slip circle base at xm
    const dx = xm - xc
    const underRoot = R * R - dx * dx
    if (underRoot < 0) continue   // outside circle
    const yBase = yc - Math.sqrt(underRoot)  // bottom of arc (take lower intercept)

    // Elevation of slope surface at xm
    // Slope: y = x * tan(beta_r) for 0 ≤ x ≤ xCrest; y = H beyond crest
    const ySurf = xm <= xCrest ? xm * Math.tan(beta_r) : H

    const hi = ySurf - yBase   // slice height
    if (hi <= 0) continue       // base is above surface – skip

    // Base inclination: alpha = arcsin((xm - xc)/R), positive when dipping into slope
    const alphai = Math.asin(Math.max(-1, Math.min(1, dx / R)))  // rad

    // Weight of slice (simplified: ignore partial saturation zones)
    // Use gammaSat if hw > 0 (conservative: fully saturated slice)
    const g_use = hw > 0 ? gammaSat : gamma
    const Wi = g_use * hi * b    // kN/m

    // Pore pressure on base of slice
    const hw_slice = Math.max(0, hw)   // water head above base
    const ui = gammaW * hw_slice * Math.cos(alphai) * Math.cos(alphai)  // kPa

    slices.push({ xm, ySurf, yBase, hi, bi: b, alphai, Wi, ui })
  }

  return slices
}

// ---------------------------------------------------------------------------
// 3. Bishop's Simplified Method
// ---------------------------------------------------------------------------

/**
 * Bishop's simplified method for circular slip surfaces.
 *
 * FS = Σ[(c·b + (W - u·b)·tan(φ')) / mα] / Σ[W·sin(α)]
 *
 * where mα = cos(α) + sin(α)·tan(φ')/FS   (iterated)
 *
 * @param {object} p
 * @param {Array}  p.slices – slice array from generateSlices()
 * @param {number} p.c      – cohesion (kPa)
 * @param {number} p.phi    – friction angle (°)
 * @returns {number} FS
 */
export function bishopCircle({ slices, c, phi }) {
  if (!slices || slices.length === 0) return NaN

  const phi_r = phi * DEG

  // Denominator: Σ W·sin(α)  – independent of FS
  const sumWsinA = slices.reduce((s, sl) => s + sl.Wi * Math.sin(sl.alphai), 0)
  if (sumWsinA <= 0) return Infinity

  let FS = 1.5   // initial guess

  for (let iter = 0; iter < 50; iter++) {
    let numerator = 0

    for (const sl of slices) {
      const { Wi, bi, ui, alphai } = sl
      // mα = cos(α) + sin(α)·tan(φ')/FS
      const mAlpha = Math.cos(alphai) + Math.sin(alphai) * Math.tan(phi_r) / FS
      if (Math.abs(mAlpha) < 1e-10) continue   // avoid divide-by-zero
      numerator += (c * bi + (Wi - ui * bi) * Math.tan(phi_r)) / mAlpha
    }

    const FS_new = numerator / sumWsinA
    if (Math.abs(FS_new - FS) < 1e-5) {
      FS = FS_new
      break
    }
    FS = FS_new
  }

  return FS
}

// ---------------------------------------------------------------------------
// 4. Critical Circle (Grid Search)
// ---------------------------------------------------------------------------

/**
 * Find the critical (minimum-FS) circular slip surface via grid search.
 *
 * Sweeps xc in [-0.5·xCrest, 1.5·xCrest] (8 steps) and
 *        yc in [ 0.5·H,      2.5·H      ] (8 steps),
 * and for each centre tries 5 radii between R_min and R_max.
 *
 * @param {object} p
 * @param {number} p.H         – slope height (m)
 * @param {number} p.beta_deg  – slope angle (°)
 * @param {number} p.c         – cohesion (kPa)
 * @param {number} p.phi       – friction angle (°)
 * @param {number} p.gamma     – bulk unit weight (kN/m³)
 * @param {number} p.gammaSat  – saturated unit weight (kN/m³)
 * @param {number} p.hw        – water table height above slip surface (m)
 * @param {number} p.nSlices   – slices per circle (default 10)
 * @returns {{ FS_min, xc, yc, R, slices }}
 */
export function criticalCircle({
  H, beta_deg, c, phi, gamma = 18, gammaSat = 20, hw = 0, nSlices = 10,
}) {
  const beta_r = beta_deg * DEG
  const xCrest = H / Math.tan(beta_r)

  // Grid bounds
  const xcMin = -0.5 * xCrest
  const xcMax =  1.5 * xCrest
  const ycMin =  0.5 * H
  const ycMax =  2.5 * H
  const nSteps = 8

  const dxc = (xcMax - xcMin) / (nSteps - 1)
  const dyc = (ycMax - ycMin) / (nSteps - 1)

  let best = { FS_min: Infinity, xc: null, yc: null, R: null, slices: [] }

  for (let ix = 0; ix < nSteps; ix++) {
    const xc = xcMin + ix * dxc

    for (let iy = 0; iy < nSteps; iy++) {
      const yc = ycMin + iy * dyc

      // R must be large enough to reach toe (0,0) and crest (xCrest, H)
      const R_toToe   = Math.sqrt(xc * xc + yc * yc)
      const R_toCrest = Math.sqrt((xc - xCrest) ** 2 + (yc - H) ** 2)
      const R_min = Math.max(0.5 * H, Math.min(R_toToe, R_toCrest))
      const R_max = Math.max(R_toToe, R_toCrest) * 1.2

      for (let ir = 0; ir < 5; ir++) {
        const R = R_min + (ir / 4) * (R_max - R_min)

        const slices = generateSlices({
          xc, yc, R, H, beta_deg, nSlices, hw, gamma, gammaSat,
        })

        if (slices.length < 3) continue   // too few slices – invalid geometry

        const FS = bishopCircle({ slices, c, phi })

        // Accept only physically meaningful FS values
        if (FS > 0.5 && FS < best.FS_min) {
          best = { FS_min: FS, xc, yc, R, slices }
        }
      }
    }
  }

  return best
}

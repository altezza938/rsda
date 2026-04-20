/**
 * Soil Nail Design — 3 failure modes per R376.
 *
 * A. Tensile failure of steel bar
 * B. Pullout at grout–bar interface
 * C. Pullout at soil–grout interface (per soil layer)
 *
 * Verification (R376 rows C/B/A):
 *   FOS_A: 35.41 / 15.17 / 10.62  (row A governs, min 10.62 > 1.0 ✓)
 *   FOS_B: 39.15 / 28.39 / 25.29  (row A governs, min 25.29 > 1.0 ✓)
 *   FOS_C: 3.27  / 2.84  / 3.00   (row B governs, min 2.84 > 2.0 ✓)
 */

export function soilNailCheck({
  // Bar geometry
  diameter_mm  = 25,   // bar nominal diameter mm (net = d-4 for deformed bar)
  drillhole_mm = 150,  // drill hole diameter mm
  barLength    = 4,    // total bar length m

  // Bar steel
  fy   = 460,          // yield strength MPa
  FOS_tension  = 1.5,  // FOS on tension failure

  // Grout
  fcu = 30,            // grout cube strength MPa
  beta = 0.5,          // bond factor (deformed bar in grout)
  FOS_grout_bar = 2,   // FOS on grout-bar bond

  // Required force per nail (kN)
  T_demand = 10,

  // Bond lengths in each soil layer (m): [{ c, phi, gamma, sigma_v_mid, Le }]
  // sigma_v_mid: effective vertical stress at mid-point of bond in this layer
  layers = [],         // per-layer soil data for Mode C

  // Inclination for nail
  inclination_deg = 20,

  // Test loads (kN)
  Ta = null,           // allowable working load (auto if null)
  Tp = 520,            // proof test load kN
}) {
  const d_net = diameter_mm - 4    // net bar diameter for grout bond (mm)
  const D_hole = drillhole_mm / 1000  // drill hole dia (m)

  // ── Mode A: Tensile failure ──
  const A_bar = Math.PI * Math.pow((diameter_mm - 4) / 1000, 2) / 4   // net area m²
  const TT    = fy * 1000 * A_bar   // kN — allowable tensile force (yield)
  const FOS_A = T_demand > 0 ? TT / T_demand : Infinity

  // ── Mode B: Grout-bar pullout ──
  // Allowable bond stress = β√fcu kN/m²
  const allowBond_B = beta * Math.sqrt(fcu) * 1000   // kN/m² (fcu in MPa → *1000)
  // Perimeter of net bar
  const perim_bar = Math.PI * d_net / 1000            // m
  // Capacity over total bar length (conservative: bond over full length)
  const Fmax_B = allowBond_B * perim_bar * barLength / FOS_grout_bar  // kN
  const FOS_B  = T_demand > 0 ? Fmax_B / T_demand : Infinity

  // ── Mode C: Soil-grout pullout ──
  // For each layer: T_layer = (π·D·c' + 2·D·σ'v·tan(φ'))·Le
  // σ'v at mid-point of bond length in that layer
  const perim_hole = Math.PI * D_hole   // m
  let T_sg = 0
  const layerDetails = layers.map(layer => {
    const { c = 0, phi = 30, sigma_v_mid = 0, Le = 0 } = layer
    const phi_r = phi * Math.PI / 180
    const t = (perim_hole * c + 2 * D_hole * sigma_v_mid * Math.tan(phi_r)) * Le
    T_sg += t
    return { ...layer, T_layer: t }
  })
  const FOS_C = T_demand > 0 && T_sg > 0 ? T_sg / T_demand : Infinity

  // Test loads
  const Ta_auto = FOS_A > 0 ? T_demand * Math.min(FOS_A, FOS_B, FOS_C > 0 ? FOS_C : Infinity) : T_demand
  const TDL1    = T_demand / (FOS_A > 0 ? FOS_A : 1)
  const TDL2    = T_demand / (FOS_B > 0 ? FOS_B : 1)

  return {
    diameter_mm, drillhole_mm, barLength, fy, fcu,
    A_bar: A_bar * 1e6,  // mm²
    TT, T_demand,
    allowBond_B, Fmax_B,
    T_sg, layerDetails,
    FOS_A, FOS_B, FOS_C,
    Ta: Ta !== null ? Ta : T_demand,
    TDL1, TDL2, Tp,
    pass: FOS_A >= 1.0 && FOS_B >= 1.0 && FOS_C >= 2.0,
  }
}

/**
 * Compute design nail force per m width for a single nail row.
 * Force per nail = (Pa_h / total rows) × horizontal spacing
 */
export function nailRowForce({ Pa_h, nRows, sh }) {
  return (Pa_h / Math.max(1, nRows)) * sh
}

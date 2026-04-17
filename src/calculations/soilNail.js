/**
 * Soil Nail design calculations – Type 4 Skin Wall.
 * Based on FR146 (Trial Wedge with Soil Nails) workbook logic.
 *
 * Per nail row:
 *   Ta   = Allowable tensile capacity (limited by bar yield or grout bond)
 *   TDL1 = Design load – serviceability check
 *   TDL2 = Design load – strength check
 *   Tp   = Proof load (1.25 × Ta)
 *
 * Nail force T per nail = Pa / n  where n = nails per metre = 1/sh
 */

const DEG = Math.PI / 180

/**
 * Calculate design forces and capacities for a soil nail.
 * @param {object} nail - { diameter_mm, length, sh, inclination_deg,
 *                          grout_fcu, steel_fy, bond_stress, T_demand }
 * T_demand = nail force required (kN per nail)
 */
export function soilNailCapacity(nail) {
  const {
    diameter_mm = 32,    // bar diameter mm
    drill_dia_mm = 100,  // drill hole diameter mm
    length = 6,
    sh = 1.5,            // horizontal spacing m
    inclination_deg = 10,
    grout_fcu = 25,      // MPa
    steel_fy = 460,      // MPa
    bond_stress,         // MPa – if not given, estimate from fcu
    T_demand = 0,        // required nail force kN per nail
  } = nail

  const d  = diameter_mm / 1000    // m
  const Dh = drill_dia_mm / 1000   // m
  const A_bar = Math.PI * d * d / 4  // m²

  // Allowable tensile capacity (steel governs usually)
  // Ta = 0.55 × fy × A_bar (GEO report typical FOS on yield)
  const Ta_steel = 0.55 * steel_fy * 1000 * A_bar  // kN

  // Grout bond
  const fbu = bond_stress ?? (0.1 * grout_fcu)   // MPa
  const ub  = Math.PI * Dh * length * fbu * 1000  // kN (perimeter × length × bond)
  const Ta_grout = ub / 2.5   // FOS 2.5 on bond

  const Ta = Math.min(Ta_steel, Ta_grout)

  // Design loads (based on HK practice GEO Pub 1/2008)
  const TDL1 = T_demand   // service demand = factored trial wedge force
  const TDL2 = 1.0 * T_demand  // ULS demand (factored separately outside)
  const Tp   = 1.25 * Ta   // proof load

  // Utilisation
  const util = Ta > 0 ? TDL1 / Ta : 0
  const pass = util <= 1.0

  return {
    Ta, Ta_steel, Ta_grout, TDL1, TDL2, Tp,
    util, pass, A_bar, fbu, ub,
  }
}

/**
 * Check nail head bearing.
 * plate_size: bearing plate dimension (m), typically 0.2×0.2 m
 */
export function nailHeadCheck({ plate_size = 0.2, concrete_fcu = 25, T }) {
  const A_plate = plate_size * plate_size
  const bearing_stress = T / A_plate     // kN/m²
  const allow = 0.6 * concrete_fcu * 1000  // kN/m²  (0.6 fcu)
  return { bearing_stress, allow, pass: bearing_stress <= allow }
}

/**
 * Overall FOS for skin wall – trial wedge with full nail mobilisation.
 * nails: array with T (kN per nail) and sh for each row.
 */
export function skinWallFOS({ Pa, Pa_h, gamma, phi, cohesion, B, hw = 0, nailRows = [], cf = 0 }) {
  const DEG_RAD = Math.PI / 180
  const GAMMA_W = 9.81

  // Sum horizontal nail components (kN/m)
  const nail_H = nailRows.reduce((acc, n) => acc + (n.T / n.sh) * Math.cos(n.inclination_deg * DEG_RAD), 0)
  const nail_V = nailRows.reduce((acc, n) => acc + (n.T / n.sh) * Math.sin(n.inclination_deg * DEG_RAD), 0)

  // Horizontal driving force
  const hw_eff = Math.min(hw, B)
  const U1 = 0.5 * GAMMA_W * hw_eff * hw_eff
  const F_drive = Pa_h + U1

  // Resistance
  const W = gamma * B * B / 2  // wedge weight approx
  const F_resist = (W + nail_V) * Math.tan(phi * DEG_RAD) + cf * B + nail_H

  const FOS = F_drive > 0 ? F_resist / F_drive : Infinity
  return { FOS, nail_H, nail_V, F_drive, F_resist }
}

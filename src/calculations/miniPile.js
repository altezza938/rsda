/**
 * Mini Pile Wall calculations – Type 3.
 * Simple lateral earth pressure method (Rankine / Coulomb).
 */

const DEG = Math.PI / 180

export function miniPileCheck({
  H,        // retained height m
  d,        // embedment depth m
  D,        // pile diameter m
  s,        // pile spacing c/c m
  gamma,    // retained soil kN/m³
  phi,      // retained soil friction angle deg
  cohesion = 0,
  gamma_p,  // passive side soil kN/m³
  phi_p,    // passive side friction angle deg
  cohesion_p = 0,
  surcharge = 0,
}) {
  const Ka = Math.pow(Math.tan(Math.PI / 4 - phi * DEG / 2), 2)
  const Kp = Math.pow(Math.tan(Math.PI / 4 + phi_p * DEG / 2), 2)

  // Active force per pile (N per pile over pile spacing)
  const Pa_strip = 0.5 * Ka * gamma * H * H + Ka * surcharge * H - 2 * cohesion * Math.sqrt(Ka) * H
  const Pa_pile  = Pa_strip * s   // kN per pile

  // Passive resistance per pile width D
  const Rp_strip = 0.5 * Kp * gamma_p * d * d + 2 * cohesion_p * Math.sqrt(Kp) * d
  const Rp_pile  = Rp_strip * D   // kN per pile

  const FOS_sliding = Pa_pile > 0 ? Rp_pile / Pa_pile : Infinity

  // Max bending moment in pile (fixed-head assumption, simplified)
  // M_max at ~0.2d below dredge level
  const h_act  = H / 3   // active resultant height above base
  const h_pass = d / 3   // passive resultant height above pile tip
  const M_max  = Pa_pile * (h_act + d) - Rp_pile * h_pass  // kN·m per pile

  // Simplified deflection (cantilever approximation)
  const E  = 30e6  // kPa – concrete
  const I  = Math.PI * Math.pow(D, 4) / 64   // m⁴
  const EI = E * I
  const delta = (Pa_pile * Math.pow(H + d, 3)) / (3 * EI)   // m

  return { Ka, Kp, Pa_pile, Rp_pile, FOS_sliding, M_max, delta, EI }
}

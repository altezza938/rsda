/**
 * Vesic (1973) general bearing capacity formula for shallow foundations.
 * qu = c'·Nc·sc·dc·ic + q·Nq·sq·dq·iq + 0.5·γ·B·Nγ·sγ·dγ·iγ
 */

const DEG = Math.PI / 180

export function vesicBearing({ cf, phif, gamma_f, B, Df, Q, inclineDeg = 0 }) {
  const phi_r = phif * DEG
  const i_r   = inclineDeg * DEG

  // Bearing capacity factors
  const Nq = Math.exp(Math.PI * Math.tan(phi_r)) * Math.pow(Math.tan(Math.PI / 4 + phi_r / 2), 2)
  const Nc = phif > 0 ? (Nq - 1) / Math.tan(phi_r) : (Math.PI + 2)
  const Ng = 2 * (Nq + 1) * Math.tan(phi_r)   // Nγ

  // Shape factors (strip footing → all 1)
  const sc = phif > 0 ? 1 + (Nq / Nc) : 1
  const sq = 1 + Math.tan(phi_r)
  const sg = 0.6  // conservative for strip

  // Depth factors
  const ratio = Df / B
  const dc = 1 + 0.4 * (ratio <= 1 ? ratio : Math.atan(ratio))
  const dq = 1 + 2 * Math.tan(phi_r) * Math.pow(1 - Math.sin(phi_r), 2) * (ratio <= 1 ? ratio : Math.atan(ratio))
  const dg = 1.0

  // Inclination factors
  const m  = 2   // strip
  const ic = phif > 0 ? Math.pow(1 - i_r / (Math.PI / 2), 2) : 1 - (m * Q) / (B * cf * Nc)
  const iq = Math.pow(1 - Math.tan(i_r), 2)
  const ig = Math.pow(1 - Math.tan(i_r), m + 1)

  // Overburden at foundation level
  const qover = gamma_f * Df

  const qu = cf * Nc * sc * dc * ic
           + qover * Nq * sq * dq * iq
           + 0.5 * gamma_f * B * Ng * sg * dg * ig

  const qapplied = Q / B   // applied bearing pressure (kN/m per unit length)
  const FOS = qapplied > 0 ? qu / qapplied : Infinity

  return { qu, qapplied, FOS, Nq, Nc, Ng, sc, sq, sg, dc, dq, dg, ic, iq, ig }
}

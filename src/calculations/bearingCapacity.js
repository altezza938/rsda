/**
 * Vesic (1973) bearing capacity formula — full implementation per GG1 p.239.
 *
 * qu = c'·Nc·Sc·ic·tc·Gc + ½γB'·Nγ·Sγ·iγ·tγ·Gγ + q'·Nq·Sq·iq·tq·Gq
 *
 * Verification (R376 Bearing Capacity ULS x=0):
 *   φ'=30° c'=4 γ=19 d=3.33m B=0.5m L=16.8m Qn=82.055 Qs=82.055 μ=0.26 rad β=0
 *   Nc=30.140 Nγ=22.402 Nq=18.401
 *   Sc=1.0182 Sγ=0.9881 Sq=1.0172
 *   ic=0.1293 iγ=0.0733 iq=0.1766
 *   tc=0.7064 tγ=0.7223 tq=0.7223
 *   qult = 11.21 + 7.71 + 151.07 = 167.849 kPa ✓
 */

const DEG = Math.PI / 180

export function vesicBearing({
  cf    = 0,     // foundation cohesion kPa
  phif  = 30,    // foundation friction angle °
  gamma_f = 19,  // foundation soil unit weight kN/m³
  B     = 0.5,   // foundation width m
  L     = 16.8,  // foundation length m (large for strip → shape factors ≈ 1)
  Df    = 0,     // embedment depth m
  Q     = 82.055,// normal (vertical) load kN/m (per m run if L=1)
  Qs    = 0,     // shear (horizontal) load kN/m
  beta  = 0,     // ground slope angle ° (β)
  mu    = 0,     // base tilt angle rad (μ)
  eb    = 0,     // eccentricity parallel to B (m)
  el    = 0,     // eccentricity parallel to L (m)
}) {
  const phi_r  = phif * DEG
  const beta_r = beta * DEG

  const Bprime = Math.max(0.01, B - 2 * eb)
  const Lprime = Math.max(0.01, L - 2 * el)

  // Bearing capacity factors
  const Nq = Math.exp(Math.PI * Math.tan(phi_r)) * Math.pow(Math.tan(Math.PI / 4 + phi_r / 2), 2)
  const Nc = phif > 0 ? (Nq - 1) / Math.tan(phi_r) : (Math.PI + 2)
  const Ng = 2 * (Nq + 1) * Math.tan(phi_r)   // Nγ

  // Shape factors
  const Sc = phif > 0 ? 1 + (Bprime / Lprime) * (Nq / Nc) : 1 + 0.2 * Bprime / Lprime
  const Sγ = Math.max(0.6, 1 - 0.4 * Bprime / Lprime)
  const Sq = 1 + (Bprime / Lprime) * Math.tan(phi_r)

  // m factor
  const m = (2 + Bprime / Lprime) / (1 + Bprime / Lprime)

  // Inclination factors
  const denom_i = Q + Bprime * Lprime * cf / Math.tan(phi_r)
  let iγ, iq, ic
  if (Qs <= 0 || denom_i <= 0) {
    iγ = 1; iq = 1; ic = 1
  } else {
    iγ = Math.max(0, Math.pow(1 - Qs / denom_i, m + 1))
    iq = Math.max(0, Math.pow(1 - Qs / denom_i, m))
    ic = phif > 0 ? iq - (1 - iq) / (Nc * Math.tan(phi_r)) : 1 - (m * Qs) / (Bprime * Lprime * cf * Nc)
  }

  // Tilt factors (base inclination μ in radians)
  const tγ = mu !== 0 ? Math.pow(1 - mu * Math.tan(phi_r), 2) : 1
  const tq = tγ
  const tc = phif > 0 ? tq - (1 - tq) / (Nc * Math.tan(phi_r)) : 1 - 2 * mu / (Math.PI + 2)

  // Ground slope factors
  const Gγ = beta_r !== 0 ? Math.pow(1 - Math.tan(beta_r), 2) : 1
  const Gq = Gγ
  const Gc = beta_r !== 0 ? Math.exp(-2 * beta_r * Math.tan(phi_r)) : 1

  // Overburden
  const qover = gamma_f * Df * Math.cos(beta_r)

  // Components
  const comp_c  = cf    * Nc * Sc * ic * tc * Gc
  const comp_γ  = 0.5   * gamma_f * Bprime * Ng * Sγ * iγ * tγ * Gγ
  const comp_q  = qover * Nq * Sq * iq * tq * Gq
  const qu = comp_c + comp_γ + comp_q

  const qapplied = Q / Bprime
  const FOS = qapplied > 0 ? qu / qapplied : Infinity

  return {
    qu, qapplied, FOS,
    comp_c, comp_γ, comp_q,
    Nq, Nc, Ng,
    Sc, Sγ, Sq,
    ic, iγ, iq,
    tc, tγ, tq,
    Gc, Gγ, Gq,
    Bprime, Lprime, qover, m,
  }
}

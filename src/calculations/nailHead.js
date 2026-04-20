/**
 * RC Nail Head — Punching shear per CPoC2004 Table 6.3.
 *
 * Verification (R376 Nail Head):
 *   fcu=30 t=200mm h=100mm cover=50mm bar T10@200 As=392.7mm²
 *   V=60kN, vmax=2.0 N/mm² OK, v=1.0 N/mm², vc=1.042 N/mm²
 *   v < vc → no shear reinforcement initially
 *   20 R8 links @ 60mm spacing provided
 */

export function nailHeadCheck({
  fcu       = 30,    // concrete cube strength MPa
  t         = 200,   // skin wall thickness mm
  cover     = 50,    // concrete cover mm
  barSize   = 10,    // main bar diameter mm
  barSpacing = 200,  // bar spacing mm c/c
  plateSide = 150,   // nail bearing plate side mm (square)
  nailForce = 60,    // design nail force kN
  fyv       = 250,   // shear link yield MPa
  linkSize  = 8,     // shear link bar mm
}) {
  const h  = t / 2                // effective depth (h = t/2 for two-way action) mm
  const d  = h                    // effective depth mm (same here)

  // Area of steel per metre width (one direction)
  const As_per_m = (Math.PI * barSize * barSize / 4) / barSpacing * 1000  // mm²/m
  // As at critical perimeter (use both directions: multiply by plate length)
  const As = As_per_m * plateSide / 1000    // mm² (over plate width)

  const V_N = nailForce * 1e3    // N

  // 1. Max shear stress at face (1.5d beyond each side of plate)
  const u0    = 4 * plateSide    // mm — perimeter at face of plate
  const vmax  = V_N / (u0 * d)  // N/mm²
  const vmaxLimit = Math.min(0.8 * Math.sqrt(fcu), 7)
  const vmaxOK = vmax <= vmaxLimit

  // 2. Shear stress at first critical perimeter (1.5d from plate face)
  const dist1 = 1.5 * d         // mm
  const u1    = 4 * plateSide + 4 * Math.PI * dist1 / 2   // rounded corners approx
  // Simpler rectangular perimeter: 4*(plateSide + 2*1.5d) = 4*plateSide + 12d
  const u1_rect = 4 * plateSide + 12 * d
  const v1  = V_N / (u1_rect * d)   // N/mm²

  // 3. Design concrete shear stress vc (CPoC2004 Table 6.3)
  const As_over_bd = Math.min(3, 100 * As / (plateSide * d))   // capped at 3
  const depth_factor = Math.max(1, Math.pow(400 / d, 0.25))    // (400/d)^0.25, ≥1
  const fcu_factor   = Math.pow(Math.min(fcu, 40) / 25, 1 / 3)
  const vc = 0.79 * Math.pow(as3(As_over_bd), 1 / 3) * depth_factor / 1.25 * fcu_factor

  // 4. Reinforcement decision
  let needLinks = false
  let nLinks = 0, linkSpacing = 0, Asv = 0

  if (v1 > vc && v1 <= 1.6 * vc) {
    needLinks = true
    Asv = Math.ceil(1000 * (v1 - vc) * u1_rect * d / (0.87 * fyv))  // mm²
  } else if (v1 > 1.6 * vc && v1 <= 2 * vc) {
    needLinks = true
    Asv = Math.ceil(1000 * (2 * v1 - vc) * u1_rect * d / (0.87 * fyv * 2))
  }

  if (needLinks) {
    const A_link = Math.PI * linkSize * linkSize / 4
    nLinks = Math.ceil(Asv / A_link)
    linkSpacing = Math.min(Math.floor(1.5 * d), 75)  // max 1.5d
  }

  // Check at second perimeter (1.5d + 0.75d from face)
  const u2_rect = 4 * plateSide + 12 * (dist1 + 0.75 * d)
  const v2 = V_N / (u2_rect * d)
  const secondOK = v2 <= vc

  return {
    fcu, t, h: d, cover, barSize, barSpacing, plateSide, nailForce,
    As_per_m, As, As_over_bd, depth_factor, fcu_factor,
    u0, vmax, vmaxLimit, vmaxOK,
    u1: u1_rect, v1, vc,
    needLinks, Asv, nLinks, linkSpacing, linkSize, fyv,
    u2: u2_rect, v2, secondOK,
    pass: vmaxOK && (v1 <= vc || needLinks),
  }
}

function as3(x) { return x <= 0 ? 0.001 : x }

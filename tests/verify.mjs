/**
 * Verification script — checks app calculations against analytical references.
 * Run: node tests/verify.mjs
 *
 * Coulomb (1776) general Ka for battered wall (ω), sloped backfill (β):
 *   Ka = cos²(φ−ω) / { cos²ω · cos(δ+ω) · [1 + √(sin(φ+δ)·sin(φ−β) / (cos(δ+ω)·cos(ω−β)))]² }
 * For β=0: sin(φ−β)=sinφ, cos(ω−β)=cosω  ➜ simplified form used here.
 *
 * Trial-wedge Pa (kN/m) = Ka · ½ · γ · H²   when c=0, hw=0, β=0.
 */

import { trialWedge } from '../src/calculations/trialWedge.js'
import { gravityWallCheck } from '../src/calculations/fosChecks.js'
import { cantileverWallCheck } from '../src/calculations/fosChecks.js'
import { vesicBearing } from '../src/calculations/bearingCapacity.js'

const DEG = Math.PI / 180
let passed = 0, failed = 0

function pct(app, ref) { return Math.abs((app - ref) / ref) * 100 }

function check(label, app, ref, tol = 0.1) {
  const d = pct(app, ref)
  const ok = d <= tol
  const flag = ok ? '  ✓' : '  ✗'
  console.log(`${flag} ${label}: app=${app.toFixed(4)}  ref=${ref.toFixed(4)}  Δ=${d.toFixed(2)}%`)
  if (ok) passed++; else failed++
}

// ── Coulomb Ka — INWARD batter convention (ω>0 = back face tilts toward fill at top) ──
// This matches the trial-wedge sign convention in trialWedge.js.
// Derived from Das outward-batter formula by substituting ω → −ω:
//   Ka = cos²(φ+ω) / [ cos²ω · cos(δ−ω) · (1 + √(sin(φ+δ)sinφ / (cos(δ−ω)cosω)))² ]
// For ω=0 this is identical to the standard vertical-wall formula.
function coulombKa(phi, delta, omega) {
  const p = phi * DEG, d = delta * DEG, w = omega * DEG
  const num = Math.cos(p + w) ** 2
  const inner = Math.sqrt(Math.sin(p + d) * Math.sin(p) / (Math.cos(d - w) * Math.cos(w)))
  const den = Math.cos(w) ** 2 * Math.cos(d - w) * (1 + inner) ** 2
  return num / den
}

// ────────────────────────────────────────────────────
console.log('\n── TEST 1: Trial Wedge vs Coulomb Ka (c=0, hw=0) ──')
const cases1 = [
  { phi: 30, delta: 0,    omega: 0,  H: 4.0, gamma: 20 },
  { phi: 35, delta: 23.3, omega: 0,  H: 3.5, gamma: 19 },
  { phi: 38, delta: 25.3, omega: 0,  H: 5.0, gamma: 20 },
  { phi: 35, delta: 23.3, omega: 10, H: 5.0, gamma: 19 },
  { phi: 30, delta: 20,   omega: 5,  H: 6.0, gamma: 18 },
]
for (const c of cases1) {
  const { Pa } = trialWedge({ ...c, cohesion: 0, surcharge: 0, hw: 0 })
  const Ka = coulombKa(c.phi, c.delta, c.omega)
  const ref = Ka * 0.5 * c.gamma * c.H * c.H
  const tol = c.omega === 0 ? 0.1 : 3.0   // 1° step discretization adds ~2-3% for ω≠0
  check(`φ=${c.phi}° δ=${c.delta}° ω=${c.omega}° H=${c.H}m`, Pa, ref, tol)
}

// ────────────────────────────────────────────────────
console.log('\n── TEST 2: Gravity Wall FOS (ω=0, hw=0, c=0) ──')
// Manual: H=4, B=3.2, bt=0.6, gamma=20, phi=35, delta=23.3, cf=0, phif=35, gamma_f=20
{
  const p = {
    H: 4, B: 3.2, bt: 0.6, batter: 0,
    gamma: 20, cohesion: 0, phi: 35, delta: 23.3,
    gamma_f: 20, cf: 0, phif: 35, Df: 0.5,
    gamma_wall: 24, hw: 0, surcharge: 0,
  }
  const r = gravityWallCheck(p)

  // Pa reference
  const Ka = coulombKa(35, 23.3, 0)
  const Pa_ref = Ka * 0.5 * 20 * 16
  check('Pa (kN/m)',            r.Pa,           Pa_ref,  0.5)

  // Manual sliding: N = W_wall + Pa_v; F_resist = N·tan(35°); F_drive = Pa·cos(23.3°)
  const Pa_h = r.Pa * Math.cos(23.3 * DEG)
  const Pa_v = r.Pa * Math.sin(23.3 * DEG)
  const A_wall = 0.5 * (0.6 + 3.2) * 4
  const W_wall = 24 * A_wall
  const N_ref = W_wall + Pa_v
  const FOS_slide_ref = N_ref * Math.tan(35 * DEG) / Pa_h
  check('FOS Sliding',          r.FOS_sliding,  FOS_slide_ref, 0.1)

  // Manual overturning: centroid of trapezoid from toe
  const A_rect = 0.6 * 4, x_rect = 3.2 - 0.6 / 2
  const A_tri  = 0.5 * 2.6 * 4, x_tri = 2.6 / 3
  const x_c = (A_rect * x_rect + A_tri * x_tri) / (A_rect + A_tri)
  const Mr_ref = W_wall * x_c + Pa_v * 3.2
  const Mo_ref = Pa_h * 4 / 3
  const FOS_ot_ref = Mr_ref / Mo_ref
  check('FOS Overturning',      r.FOS_overturning, FOS_ot_ref, 0.1)

  // e and B_eff
  const e_ref    = 3.2 / 2 - (Mr_ref - Mo_ref) / N_ref
  const B_eff_ref = Math.max(0.01, 3.2 - 2 * Math.abs(e_ref))
  check('B_eff (m)',            r.B_eff,        B_eff_ref, 0.1)
}

// ────────────────────────────────────────────────────
console.log('\n── TEST 3: Vesic Bearing Capacity Factors ──')
for (const phif of [25, 30, 35, 40]) {
  const phi_r = phif * DEG
  const Nq_ref = Math.exp(Math.PI * Math.tan(phi_r)) * Math.tan(Math.PI / 4 + phi_r / 2) ** 2
  const Nc_ref = (Nq_ref - 1) / Math.tan(phi_r)
  const Ng_ref = 2 * (Nq_ref + 1) * Math.tan(phi_r)
  const r = vesicBearing({ cf: 0, phif, gamma_f: 20, B: 2.5, Df: 0.5, Q: 200 })
  check(`Nq φ=${phif}°`, r.Nq, Nq_ref)
  check(`Nc φ=${phif}°`, r.Nc, Nc_ref)
  check(`Nγ φ=${phif}°`, r.Ng, Ng_ref)
}

// ────────────────────────────────────────────────────
console.log('\n── TEST 4: L-Cantilever Wall FOS ──')
{
  const p = {
    H: 4.5, ts: 0.3, tb: 0.5, Lh: 2.5, Lt: 0.6,
    gamma: 19, cohesion: 0, phi: 32, delta: 21.3,
    gamma_f: 20, cf: 0, phif: 32, Df: 0.5,
    gamma_wall: 24, hw: 0, surcharge: 0, batter: 0,
  }
  const B = p.Lt + p.ts + p.Lh  // 3.4 m
  const r = cantileverWallCheck(p)

  const Ka = coulombKa(32, 21.3, 0)
  const Pa_ref = Ka * 0.5 * 19 * p.H ** 2
  check('Pa (kN/m)', r.Pa, Pa_ref, 0.5)

  const Pa_h = r.Pa * Math.cos(21.3 * DEG)
  const Pa_v = r.Pa * Math.sin(21.3 * DEG)
  const W_stem = 24 * p.ts * p.H
  const W_base = 24 * B * p.tb
  const W_fill = 19 * p.Lh * p.H
  const N_ref  = W_stem + W_base + W_fill + Pa_v
  const FOS_slide_ref = N_ref * Math.tan(32 * DEG) / Pa_h
  check('FOS Sliding', r.FOS_sliding, FOS_slide_ref, 0.1)

  const x_stem = p.Lt + p.ts / 2
  const x_base = B / 2
  const x_fill = p.Lt + p.ts + p.Lh / 2
  const Mr_ref = W_stem * x_stem + W_base * x_base + W_fill * x_fill + Pa_v * B
  const Mo_ref = Pa_h * p.H / 3
  const FOS_ot_ref = Mr_ref / Mo_ref
  check('FOS Overturning', r.FOS_overturning, FOS_ot_ref, 0.1)
}

// ────────────────────────────────────────────────────
console.log('\n── TEST 5: Trial Wedge with Water (hw>0) ──')
{
  // Manual: wedge W, U1 on wall face, U2 on slip plane
  const GAMMA_W = 9.81
  const p = { H: 4, phi: 30, delta: 20, omega: 0, gamma: 20, cohesion: 0, hw: 2, surcharge: 0 }
  const { Pa, thetaCrit } = trialWedge(p)
  // At thetaCrit, hand-check forces
  const theta_r = thetaCrit * DEG
  const phi_r   = 30 * DEG
  const delta_r = 20 * DEG
  const hw_eff  = 2
  const W_area  = 0.5 * 16 * Math.tan(theta_r)
  const W_ref   = 20 * W_area
  const U1_ref  = 0.5 * GAMMA_W * 4 / Math.cos(0)
  const U2_ref  = 0.5 * GAMMA_W * 4 / Math.cos(theta_r)
  const tpf     = Math.tan(theta_r + phi_r)
  const num_ref = (W_ref - U1_ref * 0 - U2_ref * Math.sin(theta_r))
                + tpf * (U2_ref * Math.cos(theta_r) - U1_ref * 1)
  const den_ref = Math.cos(delta_r) * tpf + Math.sin(delta_r)
  const Pa_ref  = num_ref / den_ref
  check(`Pa with hw=2m θcrit=${thetaCrit}°`, Pa, Pa_ref, 0.5)
}

// ────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(40)}`)
console.log(`  ${passed} PASSED  ${failed} FAILED`)
console.log('═'.repeat(40))
process.exit(failed > 0 ? 1 : 0)

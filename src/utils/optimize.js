/**
 * Numerical optimization utilities.
 * bisect: find x in [lo, hi] where fn(x) = 0 (sign change lo→hi).
 */

/**
 * Binary search for x where fn(x) crosses zero (negative → positive).
 * Returns null if fn(hi) < 0 (target never reached).
 * Returns lo immediately if fn(lo) >= 0 (already satisfied).
 */
export function bisect(fn, lo, hi, tol = 0.001, maxIter = 64) {
  if (fn(lo) >= 0) return lo
  if (fn(hi) < 0)  return null   // not achievable in range

  for (let i = 0; i < maxIter && hi - lo > tol; i++) {
    const mid = (lo + hi) / 2
    fn(mid) < 0 ? (lo = mid) : (hi = mid)
  }
  return parseFloat(hi.toFixed(3))
}

/**
 * Sweep parameter x from lo to hi in steps, returning the value
 * where fn(x) first becomes >= 0. Coarser but handles non-monotone fns.
 */
export function sweep(fn, lo, hi, steps = 200) {
  const dx = (hi - lo) / steps
  for (let i = 0; i <= steps; i++) {
    const x = lo + i * dx
    if (fn(x) >= 0) return parseFloat(x.toFixed(3))
  }
  return null
}

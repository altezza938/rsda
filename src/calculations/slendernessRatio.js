/**
 * Wall Slenderness Ratio check per GeoGuide 1.
 * Limit: H/t > 12 → not satisfactory (GG1); >5 flagged by R376.
 *
 * Verification (R376):
 *   Lower: 3.4/0.2 = 17 > 5 → NOT satisfactory
 *   Upper: 1.6/0.2 = 8  > 5 → NOT satisfactory
 */

export const SLENDERNESS_LIMIT_GG1 = 12   // GeoGuide 1 recommended limit
export const SLENDERNESS_LIMIT_R376 = 5    // R376 reference flag

export function slendernessCheck(sections = []) {
  return sections.map(s => {
    const ratio = s.t > 0 ? s.H / s.t : Infinity
    return {
      ...s,
      ratio: parseFloat(ratio.toFixed(2)),
      passGG1: ratio <= SLENDERNESS_LIMIT_GG1,
      passR376: ratio <= SLENDERNESS_LIMIT_R376,
    }
  })
}

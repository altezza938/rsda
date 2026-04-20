// GeoGuide 1 thresholds, material presets, shared constants

export const GAMMA_W = 9.81          // kN/m³ water
export const GAMMA_E = 1.2           // ULS load factor on active earth pressure
export const DEG = Math.PI / 180

export const GG1_THRESHOLDS = {
  sliding:     { SLS: 1.5,  ULS: 1.0 },
  overturning: { SLS: 2.0,  ULS: 1.0 },
  bearing:     { SLS: 1.0,  ULS: 1.0 },
}

// R376 Design Statement material presets
export const MATERIAL_PRESETS = {
  'Fill':       { gamma: 19, cohesion: 0, phi: 30 },
  'CDG':        { gamma: 19, cohesion: 6, phi: 37 },
  'Colluvium':  { gamma: 19, cohesion: 3, phi: 34 },
  'Rock':       { gamma: 25, cohesion: 20, phi: 45 },
  'Masonry':    { gamma: 22, cohesion: 0, phi: 35 },
  'Nailed Area':{ gamma: 22, cohesion: 3, phi: 37 },
}

export const WALL_TYPES = [
  'Trial Wedge (FR146)',
  'Wall Design — SLS',
  'Wall Design — ULS',
  'Bearing Capacity',
  'Soil Nail Design',
  'Nail Head',
  'Slenderness',
]

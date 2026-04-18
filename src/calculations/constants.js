// GeoGuide 1 (GG1) thresholds, partial factors, and material presets

export const GAMMA_E = 1.2   // Load factor on active earth pressure (ULS)

export const GG1_THRESHOLDS = {
  sliding:     { SLS: 1.5,  ULS: 1.1 },
  overturning: { SLS: 2.0,  ULS: 1.5 },
  bearing:     { SLS: 1.0,  ULS: 1.0 },
  fosPile:     { SLS: 1.5 },
}

export const GAMMA_W = 9.81   // kN/m³

// Material presets: { gamma, cohesion, phi }  (kN/m³, kPa, degrees)
export const MATERIAL_PRESETS = {
  'Fill (Loose)':   { gamma: 18, cohesion: 0,  phi: 30 },
  'Fill (Dense)':   { gamma: 20, cohesion: 0,  phi: 35 },
  'Colluvium':      { gamma: 19, cohesion: 5,  phi: 28 },
  'Rock':           { gamma: 25, cohesion: 20, phi: 40 },
}

export const WALL_TYPES = ['Gravity Wall', 'L-Cantilever Wall', 'Mini Pile Wall', 'Skin Wall + Soil Nails']

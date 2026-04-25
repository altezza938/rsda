/**
 * Top-level version selector — v1 classic panel, v2 7-tab RSDA, v3 full GEO suite.
 */

const VERSIONS = [
  {
    id: 'v1',
    label: 'v1',
    title: 'Classic Panel App',
    subtitle: 'Original single-page layout',
    desc: 'Four wall types in a three-panel layout: inputs, diagram, and results side-by-side. The original RSDA prototype.',
    features: [
      'Gravity wall (trial wedge Pa)',
      'L-cantilever wall (stem + base)',
      'Mini pile wall (Rankine Ka/Kp)',
      'Skin wall + soil nails',
    ],
    accent: '#6B7280',
    badge: 'Legacy',
  },
  {
    id: 'v2',
    label: 'v2',
    title: 'RSDA 7-Tab App',
    subtitle: 'R376 · FR146 · GG1',
    desc: 'Full retaining wall design suite with tab-based workflow, design optimisation, and cross-tab data sharing.',
    features: [
      'FR146 trial wedge (coordinate method)',
      'Wall SLS & ULS (R376 verified)',
      'Vesic bearing capacity (GG1 p.239)',
      'Soil nail · Nail head · Slenderness',
    ],
    accent: '#2D6A4F',
    badge: 'RSDA v2',
  },
  {
    id: 'v3',
    label: 'v3',
    title: 'Full GEO Suite',
    subtitle: 'GEO5-style · 6 modules',
    desc: 'Complete geotechnical design suite covering slope stability, excavation, foundations, piles, and settlement.',
    features: [
      'Slope stability — Infinite + Bishop',
      'Excavation — Sheet pile design',
      'Shallow & pile foundations',
      'Multi-layer settlement & RSDA',
    ],
    accent: '#1A6EA0',
    badge: 'New',
  },
]

export default function VersionPage({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-charcoal text-white px-6 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">AECOM · GEO</div>
            <div className="text-xl font-semibold tracking-wide">Retaining Structure Design App</div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Select version</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Which app would you like to open?</h2>

        <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
          {VERSIONS.map(v => (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left p-6 flex flex-col group"
            >
              {/* Version badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black text-gray-100 group-hover:text-gray-200 transition-colors"
                  style={{ color: v.accent, opacity: 0.15 }}>{v.label.toUpperCase()}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: v.accent }}>{v.badge}</span>
              </div>

              <div className="h-0.5 rounded mb-4" style={{ background: v.accent, opacity: 0.3 }} />

              <h3 className="text-sm font-bold text-gray-800 mb-0.5">{v.title}</h3>
              <p className="text-[10px] text-gray-400 mb-3 font-medium tracking-wide">{v.subtitle}</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{v.desc}</p>

              <ul className="space-y-1 mt-auto mb-4">
                {v.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                    <span style={{ color: v.accent }} className="mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="py-1.5 rounded-lg text-xs font-semibold text-center text-white transition-opacity"
                style={{ background: v.accent }}>
                Open {v.title} →
              </div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-charcoal text-gray-500 text-[10px] text-center py-2">
        AECOM GEO · GeoGuide 1 (2011) · R376 · FR146 · For Checking Use Only
      </footer>
    </div>
  )
}

/**
 * GEO5-style landing page — 6 module cards.
 */

/* ── SVG icons (silhouette style matching GEO5) ── */
const icons = {
  slope: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      <polygon points="10,50 60,50 60,15" fill="none" stroke="#bbb" strokeWidth="2.5" />
      <line x1="0" y1="50" x2="80" y2="50" stroke="#bbb" strokeWidth="2" />
      <path d="M18,42 Q35,20 55,30" fill="none" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4,3" />
      <circle cx="18" cy="42" r="2" fill="#bbb" /><circle cx="55" cy="30" r="2" fill="#bbb" />
    </svg>
  ),
  excavation: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      <rect x="35" y="5" width="8" height="50" fill="#bbb" />
      <line x1="0" y1="30" x2="80" y2="30" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4,3" />
      <polygon points="5,5 5,55 20,55 20,30 35,30 35,5" fill="none" stroke="#bbb" strokeWidth="2" />
      {[14,22,30,38,46].map(y => <line key={y} x1="5" y1={y} x2="35" y2={y} stroke="#ddd" strokeWidth="0.8" />)}
    </svg>
  ),
  retaining: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      <rect x="30" y="5" width="12" height="50" fill="#bbb" />
      <rect x="20" y="48" width="35" height="7" fill="#aaa" />
      <polygon points="42,5 70,5 70,55 42,55" fill="#ddd" opacity="0.5" />
      <line x1="0" y1="55" x2="80" y2="55" stroke="#bbb" strokeWidth="2" />
      <line x1="70" y1="28" x2="42" y2="28" stroke="#999" strokeWidth="1.5" markerEnd="url(#arr)" />
    </svg>
  ),
  foundation: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      <rect x="20" y="5" width="40" height="8" fill="#bbb" />
      <line x1="20" y1="13" x2="15" y2="25" stroke="#bbb" strokeWidth="2" />
      <line x1="60" y1="13" x2="65" y2="25" stroke="#bbb" strokeWidth="2" />
      <line x1="8" y1="30" x2="72" y2="30" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4,3" />
      <line x1="0" y1="55" x2="80" y2="55" stroke="#bbb" strokeWidth="2" />
      {[35,42,49].map(y => <line key={y} x1="10" y1={y} x2="70" y2={y} stroke="#eee" strokeWidth="1" />)}
    </svg>
  ),
  pile: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      {[20, 40, 60].map(x => (
        <g key={x}>
          <rect x={x - 4} y="5" width="8" height="42" fill="#bbb" />
          <polygon points={`${x-4},47 ${x+4},47 ${x},55`} fill="#999" />
        </g>
      ))}
      <line x1="0" y1="20" x2="80" y2="20" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4,3" />
    </svg>
  ),
  settlement: (
    <svg viewBox="0 0 80 60" className="w-20 h-14">
      <rect x="5" y="5" width="70" height="10" fill="#ccc" />
      <rect x="5" y="15" width="70" height="14" fill="#bbb" />
      <rect x="5" y="29" width="70" height="10" fill="#aaa" />
      <rect x="5" y="39" width="70" height="16" fill="#999" />
      <path d="M40,5 Q42,25 45,55" fill="none" stroke="#E74C3C" strokeWidth="1.5" />
      <line x1="35" y1="55" x2="55" y2="55" stroke="#E74C3C" strokeWidth="1" strokeDasharray="3,2" />
    </svg>
  ),
}

const MODULES = [
  {
    id: 'slope',
    title: 'Slope Stability',
    desc: 'Analysis of slope stability using infinite slope and Bishop\'s simplified circular failure method.',
    features: ['Infinite slope (closed-form)', "Bishop's simplified method", 'Critical circle search', 'Sensitivity to slope angle'],
    icon: 'slope',
    accent: '#2D6A4F',
  },
  {
    id: 'excavation',
    title: 'Excavation Design',
    desc: 'Design and verification of sheet pile walls. Cantilever and propped configurations in cohesionless soil.',
    features: ['Cantilever sheet pile (Rankine)', 'Propped / anchored wall', 'Embedment depth by moment equil.', 'Maximum bending moment'],
    icon: 'excavation',
    accent: '#1A6EA0',
  },
  {
    id: 'retaining',
    title: 'Retaining Wall Design',
    desc: 'Full R376/FR146 verified suite: trial wedge, gravity wall SLS/ULS, bearing capacity, soil nails.',
    features: ['Trial wedge (FR146 coordinate method)', 'Wall SLS & ULS (R376 verified)', 'Vesic bearing capacity (GG1 p.239)', 'Soil nail · Nail head · Slenderness'],
    icon: 'retaining',
    accent: '#52B788',
  },
  {
    id: 'foundation',
    title: 'Shallow Foundations',
    desc: 'Bearing capacity and settlement of spread footings. Full Vesic formula with elastic and consolidation settlement.',
    features: ['Vesic bearing capacity (all factors)', 'Elastic immediate settlement', 'Terzaghi consolidation', 'Boussinesq stress distribution'],
    icon: 'foundation',
    accent: '#E9A820',
  },
  {
    id: 'pile',
    title: 'Pile Foundations',
    desc: 'Bearing capacity of single piles and pile groups. Meyerhof (sand), alpha method (clay), Converse-Labarre group efficiency.',
    features: ['Meyerhof method (sand)', 'Alpha method — Tomlinson (clay)', 'Pile group efficiency', 'Block failure check'],
    icon: 'pile',
    accent: '#8B5CF6',
  },
  {
    id: 'settlement',
    title: 'Settlement Calculations',
    desc: 'Analysis of consolidation settlement for multi-layer soil profiles with time-settlement curves.',
    features: ['Multi-layer consolidation', 'NC / OC / OC→NC clay', 'Time-settlement curves (Terzaghi)', 't50 and t90 time factors'],
    icon: 'settlement',
    accent: '#E74C3C',
  },
]

export default function LandingPage({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-charcoal text-white px-6 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">AECOM · GEO</div>
            <div className="text-xl font-semibold tracking-wide">Geotechnical Design Suite</div>
          </div>
          <div className="ml-auto text-xs text-gray-400 hidden sm:block max-w-xs text-right leading-relaxed">
            Comprehensive solutions from slope stability to advanced foundation design
          </div>
        </div>
      </header>

      {/* Module grid */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => onSelect(mod.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left p-5 flex flex-col group"
              style={{ '--accent': mod.accent }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-3 opacity-60 group-hover:opacity-80 transition-opacity">
                {icons[mod.icon]}
              </div>

              {/* Divider line (accent colour) */}
              <div className="h-0.5 rounded mb-3" style={{ background: mod.accent, opacity: 0.3 }} />

              <h3 className="text-sm font-bold text-gray-800 mb-1">{mod.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{mod.desc}</p>

              {/* Feature list */}
              <ul className="space-y-0.5 mt-auto">
                {mod.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                    <span style={{ color: mod.accent }} className="mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-4 py-1.5 rounded-lg text-xs font-semibold text-center text-white transition-colors"
                style={{ background: mod.accent }}>
                Open {mod.title} →
              </div>
            </button>
          ))}
        </div>
      </div>

      <footer className="bg-charcoal text-gray-500 text-[10px] text-center py-2">
        AECOM GEO · GeoGuide 1 (2011) · R376 · FR146 · CPoC2004 · For Checking Use Only
      </footer>
    </div>
  )
}

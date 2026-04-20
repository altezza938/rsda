/**
 * Landing page — select between old multi-wall panel app or new 7-tab RSDA.
 */

const APPS = [
  {
    id: 'old',
    version: 'v1',
    title: 'Multi-Wall Checking Tool',
    subtitle: 'Original panel-based app',
    description: 'Gravity wall, L-cantilever, soil nail & mini-pile checks. Input panel → live diagram → full calc sheet.',
    features: [
      'Gravity wall stability (FOS Sliding / Overturning)',
      'L-Cantilever wall (Coulomb Ka)',
      'Soil nail capacity (3 modes)',
      'Mini-pile lateral capacity',
      'Trial wedge with groundwater',
      'Sensitivity sliders & test cases',
    ],
    badge: 'Original',
    badgeColor: 'bg-gray-500',
    accent: 'border-gray-400',
    btnColor: 'bg-gray-600 hover:bg-gray-700',
    preview: OldPreview,
  },
  {
    id: 'new',
    version: 'v2',
    title: 'RSDA — R376 / FR146',
    subtitle: 'New 7-tab design suite',
    description: 'Full R376 / FR146 formula implementation. Shared state between tabs, verified against XLS workbooks.',
    features: [
      'Tab 1 — Trial Wedge (FR146 coordinate method)',
      'Tab 2/3 — Wall SLS & ULS (R376 verified)',
      'Tab 4 — Vesic Bearing Capacity (GG1 p.239)',
      'Tab 5 — Soil Nail (3 failure modes)',
      'Tab 6 — Nail Head punching shear (CPoC2004)',
      'Tab 7 — Wall Slenderness Ratio',
    ],
    badge: 'New',
    badgeColor: 'bg-primary',
    accent: 'border-primary',
    btnColor: 'bg-primary hover:bg-green-800',
    preview: NewPreview,
  },
]

function OldPreview() {
  return (
    <div className="rounded border border-gray-300 bg-white overflow-hidden text-[8px] select-none pointer-events-none">
      {/* header bar */}
      <div className="bg-[#2b2b2b] text-white px-2 py-1 flex items-center gap-1">
        <div className="w-3 h-3 bg-[#2D6A4F] rounded text-[6px] flex items-center justify-center font-bold">A</div>
        <span className="text-[7px] tracking-wider opacity-80">Retaining Structure Design App</span>
      </div>
      {/* wall type tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {['Gravity Wall','L-Cantilever','Soil Nail','Mini-Pile'].map((t, i) => (
          <div key={t} className={`px-2 py-0.5 border-b-2 ${i === 0 ? 'border-[#2D6A4F] text-[#2D6A4F] font-bold' : 'border-transparent text-gray-400'}`}>{t}</div>
        ))}
      </div>
      {/* 3-col body */}
      <div className="grid grid-cols-3 gap-0" style={{ height: 90 }}>
        {/* inputs */}
        <div className="border-r border-gray-200 px-1 py-1">
          <div className="text-gray-400 mb-0.5">Foundation</div>
          {['H = 3.5 m','B = 1.8 m','γ = 19','φ = 35°'].map(l => (
            <div key={l} className="flex justify-between border-b border-gray-100 py-px">
              <span className="text-gray-500">{l.split('=')[0]}</span>
              <span className="font-mono text-gray-700">{l.split('=')[1]}</span>
            </div>
          ))}
        </div>
        {/* diagram */}
        <div className="border-r border-gray-200 flex items-center justify-center bg-gray-50">
          <svg width="50" height="70" viewBox="0 0 50 70">
            <rect x="8" y="5" width="10" height="45" fill="#D4C5A9" stroke="#888" strokeWidth="0.8"/>
            <rect x="18" y="35" width="18" height="4" fill="#D4C5A9" stroke="#888" strokeWidth="0.8"/>
            <rect x="18" y="5" width="18" height="45" fill="url(#h)" opacity="0.5"/>
            <line x1="0" y1="50" x2="50" y2="50" stroke="#555" strokeWidth="1"/>
            <defs><pattern id="h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke="#8B7355" strokeWidth="0.6"/>
            </pattern></defs>
            <line x1="36" y1="35" x2="18" y2="35" stroke="#E74C3C" strokeWidth="1"/>
            <polygon points="18,35 20,34 20,36" fill="#E74C3C"/>
          </svg>
        </div>
        {/* results */}
        <div className="px-1 py-1">
          <div className="text-gray-400 mb-0.5">Results</div>
          {[['FOS Sliding','3.86','pass'],['FOS Overt.','6.78','pass'],['q_base','45.2','pass']].map(([l,v,s]) => (
            <div key={l} className="rounded border border-gray-100 px-1 py-0.5 mb-0.5 flex justify-between">
              <span className="text-gray-400">{l}</span>
              <span className={`font-mono font-bold ${s==='pass'?'text-green-600':'text-red-500'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NewPreview() {
  return (
    <div className="rounded border border-[#2D6A4F] bg-white overflow-hidden text-[8px] select-none pointer-events-none">
      {/* header */}
      <div className="bg-[#2b2b2b] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#2D6A4F] rounded text-[6px] flex items-center justify-center font-bold">A</div>
          <span className="text-[7px] tracking-wider opacity-80">RSDA v2.0</span>
        </div>
        <span className="text-[6px] text-[#52B788] border border-[#52B788] px-1 rounded">CE53/2022</span>
      </div>
      {/* tabs */}
      <div className="flex border-b border-gray-200 bg-white overflow-hidden">
        {['1.Trial Wedge','2.Wall SLS','3.Wall ULS','4.Bearing','5.Nail','6.Head','7.Slend.'].map((t, i) => (
          <div key={t} className={`px-1.5 py-0.5 border-b-2 text-[6px] whitespace-nowrap ${i === 0 ? 'border-[#2D6A4F] text-[#2D6A4F] bg-[#D8F3DC] font-bold' : 'border-transparent text-gray-400'}`}>{t}</div>
        ))}
      </div>
      {/* 2-col body */}
      <div className="grid grid-cols-[60px_1fr] gap-0" style={{ height: 80 }}>
        {/* inputs */}
        <div className="border-r border-gray-200 px-1 py-1">
          <div className="text-[#2D6A4F] font-bold mb-0.5">Foundation</div>
          {["c'=4 kPa","φ'=30°","γ=19","Df=3.33m"].map(l => (
            <div key={l} className="text-gray-500 border-b border-gray-100 py-px font-mono">{l}</div>
          ))}
        </div>
        {/* results area */}
        <div className="px-1 py-1">
          <div className="grid grid-cols-3 gap-0.5 mb-1">
            {["c' comp","γB' comp","q' comp"].map((l, i) => (
              <div key={l} className="border border-gray-200 rounded text-center py-0.5">
                <div className="text-[5px] text-gray-400">{l}</div>
                <div className={`font-mono font-bold text-[7px] ${i===0?'text-[#2D6A4F]':i===1?'text-[#52B788]':'text-[#E9A820]'}`}>
                  {['21.4','28.8','117.6'][i]}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded border-2 border-[#2D6A4F] bg-[#D8F3DC] text-center py-0.5">
            <div className="text-[5px] text-gray-500">qult</div>
            <div className="text-[9px] font-bold text-[#2D6A4F] font-mono">167.849 kPa</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-charcoal text-white px-6 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">AECOM · GEO</div>
            <div className="text-xl font-semibold tracking-wide">Retaining Structure Design App</div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-charcoal text-white pb-10 pt-4 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 text-sm max-w-xl">
            Select a tool version below. Both run locally in your browser — no data is sent to any server.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-6 -mt-4 pb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {APPS.map(app => {
            const Preview = app.preview
            return (
              <div key={app.id}
                className={`bg-white rounded-xl shadow-md border-2 ${app.accent} overflow-hidden flex flex-col`}>
                {/* card header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">{app.subtitle}</div>
                      <h2 className="text-base font-bold text-gray-800">{app.title}</h2>
                    </div>
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${app.badgeColor}`}>
                      {app.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{app.description}</p>
                </div>

                {/* mockup preview */}
                <div className="px-5 pb-3">
                  <Preview />
                </div>

                {/* feature list */}
                <div className="px-5 pb-4 flex-1">
                  <ul className="space-y-1">
                    {app.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-primary mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => onSelect(app.id)}
                    className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${app.btnColor}`}
                  >
                    Open {app.title} →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="bg-charcoal text-gray-500 text-xs text-center py-2">
        AECOM GEO · GeoGuide 1 (2011) · R376 · FR146 · For Checking Use Only
      </footer>
    </div>
  )
}

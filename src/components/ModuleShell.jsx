/**
 * Reusable shell for each geo module: header + tab bar + content.
 */
export default function ModuleShell({ title, subtitle, level, tabs, activeTab, onTab, onBack, children, headerRight }) {
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-charcoal text-white px-4 py-2 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-gray-400 hover:text-white text-xs border border-gray-600 px-2 py-0.5 rounded mr-1">
            ← Modules
          </button>
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center font-bold text-sm">A</div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">AECOM · GEO · {level}</div>
            <div className="text-sm font-semibold tracking-wide">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {headerRight}
          <span className="hidden sm:inline">{subtitle}</span>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 flex shrink-0 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button key={tab.id} onClick={() => onTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-pale'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <span className="text-gray-400 mr-1">{i + 1}.</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-white overflow-hidden">
        {children}
      </div>

      <footer className="bg-charcoal text-gray-500 text-[10px] text-center py-1 shrink-0">
        AECOM GEO · {title} · GeoGuide 1 (2011) · For Checking Use Only
      </footer>
    </div>
  )
}

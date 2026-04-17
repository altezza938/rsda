import { useState, useCallback } from 'react'
import WallTypeSelector from './components/WallTypeSelector'
import InputPanel from './components/InputPanel'
import ResultsPanel from './components/ResultsPanel'
import WallDiagram from './components/WallDiagram'

const DEFAULT_PROJECT = {
  featureNo: 'CE53/2022',
  agreementNo: '',
  calcBy: '',
  checkedBy: '',
  date: new Date().toISOString().slice(0, 10),
}

export default function App() {
  const [wallType, setWallType] = useState(0)
  const [params, setParams] = useState(null)
  const [results, setResults] = useState(null)
  const [project, setProject] = useState(DEFAULT_PROJECT)
  const [showProject, setShowProject] = useState(false)

  const handleResults = useCallback((r) => setResults(r), [])
  const handleParams  = useCallback((p) => setParams(p), [])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-charcoal text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-sm">A</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">AECOM · GEO</div>
            <div className="text-base font-semibold tracking-wide">Retaining Structure Design App</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-secondary px-2 py-1 border border-secondary rounded">{project.featureNo}</span>
          <button
            onClick={() => setShowProject(v => !v)}
            className="text-xs text-gray-300 hover:text-white border border-gray-600 px-2 py-1 rounded"
          >
            Project Info
          </button>
        </div>
      </header>

      {/* ── Project Info drawer ── */}
      {showProject && (
        <div className="bg-charcoal text-white px-4 py-3 border-t border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            ['Feature No.', 'featureNo'],
            ['Agreement No.', 'agreementNo'],
            ['Calc. By', 'calcBy'],
            ['Checked By', 'checkedBy'],
            ['Date', 'date'],
          ].map(([label, key]) => (
            <label key={key}>
              <span className="block text-gray-400 mb-1">{label}</span>
              <input
                type="text"
                value={project[key]}
                onChange={e => setProject(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-secondary"
              />
            </label>
          ))}
        </div>
      )}

      {/* ── Wall type tabs ── */}
      <WallTypeSelector active={wallType} onChange={t => { setWallType(t); setResults(null) }} />

      {/* ── Three-column layout ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Column 1: Inputs */}
        <div className="bg-white border-r border-gray-200 overflow-y-auto">
          <InputPanel
            wallType={wallType}
            onResults={handleResults}
            onParams={handleParams}
            project={project}
          />
        </div>

        {/* Column 2: Live SVG diagram */}
        <div className="bg-gray-50 border-r border-gray-200 flex items-start justify-center p-4">
          <WallDiagram wallType={wallType} params={params} results={results} />
        </div>

        {/* Column 3: Results */}
        <div className="bg-white overflow-y-auto">
          <ResultsPanel wallType={wallType} results={results} params={params} project={project} />
        </div>
      </div>

      <footer className="bg-charcoal text-gray-500 text-xs text-center py-2">
        AECOM GEO · RSDA v1.0 · GeoGuide 1 (2011) · For Checking Use Only
      </footer>
    </div>
  )
}
